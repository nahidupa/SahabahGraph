import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Fab,
  Collapse,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as AIIcon,
  Psychology as CommandIcon,
} from '@mui/icons-material';
import type { Sahabi } from '../../types';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isCommand?: boolean;
  commandResult?: string;
}

interface UICommand {
  action: string;
  params?: Record<string, any>;
}

interface AIChatPanelProps {
  // Graph control callbacks
  onClearCanvas?: () => void;
  onFocusNode?: (nodeName: string) => void;
  onAddNode?: (node: Sahabi) => void;
  onFilterNodes?: (criteria: any) => void;
  onSwitchView?: (view: 'graph' | 'timeline' | 'political') => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onSearchChange?: (term: string) => void;
  // Data access
  allNodes?: Sahabi[];
  cyRef?: React.MutableRefObject<any>;
}

// Chrome AI API type declarations - supports both old and new APIs
declare global {
  interface Window {
    // Old API (Chrome 127-130)
    ai?: {
      languageModel?: {
        create: () => Promise<{
          prompt: (text: string) => Promise<string>;
          destroy: () => void;
        }>;
        capabilities?: () => Promise<{
          available: string;
        }>;
      };
    };
  }
  // New API (Chrome Canary/131+)
  interface LanguageModelConstructor {
    availability: () => Promise<'available' | 'downloading' | 'downloadable' | 'no'>;
    create: (options?: { systemPrompt?: string }) => Promise<{
      prompt: (text: string) => Promise<string>;
      promptStreaming?: (text: string) => ReadableStream;
      destroy: () => void;
    }>;
  }
  const LanguageModel: LanguageModelConstructor;
}

// Unified AI Helper - works with both old and new APIs
class ChromeAIHelper {
  private useNewAPI: boolean = false;
  
  async checkAvailability(): Promise<boolean> {
    // Try new API first (Chrome Canary/131+)
    if (typeof LanguageModel !== 'undefined') {
      try {
        const status = await LanguageModel.availability();
        this.useNewAPI = true;
        return status === 'available';
      } catch (e) {
        console.log('New LanguageModel API check failed:', e);
      }
    }
    
    // Fall back to old API (Chrome 127-130)
    if (window.ai?.languageModel) {
      try {
        if (window.ai.languageModel.capabilities) {
          const capabilities = await window.ai.languageModel.capabilities();
          return capabilities.available === 'readily';
        } else {
          // Try creating a test session
          const session = await window.ai.languageModel.create();
          session.destroy();
          return true;
        }
      } catch (e) {
        console.log('Old window.ai API check failed:', e);
      }
    }
    
    return false;
  }
  
  async createSession(systemPrompt?: string) {
    if (this.useNewAPI && typeof LanguageModel !== 'undefined') {
      return await LanguageModel.create({ systemPrompt });
    } else if (window.ai?.languageModel) {
      return await window.ai.languageModel.create();
    }
    throw new Error('No Chrome AI API available');
  }
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({
  onClearCanvas,
  onFocusNode,
  onAddNode,
  onFilterNodes,
  onSwitchView,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSearchChange,
  allNodes = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [aiSession, setAISession] = useState<any>(null);
  const [aiHelper] = useState(() => new ChromeAIHelper());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if Chrome AI is available - works with both old and new APIs
  useEffect(() => {
    const checkAIAvailability = async () => {
      try {
        const available = await aiHelper.checkAvailability();
        setIsAIAvailable(available);
      } catch (error) {
        console.error('Chrome AI check failed:', error);
        setIsAIAvailable(false);
      }
    };

    checkAIAvailability();
  }, [aiHelper]);

  // Initialize AI session when panel opens
  useEffect(() => {
    const initSession = async () => {
      if (isOpen && isAIAvailable && !aiSession) {
        try {
          const systemPrompt = `You are an AI assistant for SahabahGraph.

For UI commands, respond with ONLY JSON (no extra text):
{"type":"command","actions":[{"action":"NAME","params":{}}]}

Available commands:
1. clear - Clear canvas
   {"type":"command","actions":[{"action":"clear","params":{}}]}

2. focus - Show/focus on person
   {"type":"command","actions":[{"action":"focus","params":{"name":"Abu Bakr"}}]}

3. add - Add person to graph
   {"type":"command","actions":[{"action":"add","params":{"name":"Umar ibn al-Khattab"}}]}

4. search - Search for people
   {"type":"command","actions":[{"action":"search","params":{"term":"Badr"}}]}

5. view - Switch views (graph/timeline/political)
   {"type":"command","actions":[{"action":"view","params":{"view":"timeline"}}]}

6. zoom - Zoom control (in/out/reset)
   {"type":"command","actions":[{"action":"zoom","params":{"direction":"in"}}]}

Extract names from user input. Examples:
- "show abu bakr" → params:{"name":"Abu Bakr"}
- "add umar" → params:{"name":"Umar"}

For questions, respond with normal text.`;

          const session = await aiHelper.createSession(systemPrompt);
          setAISession(session);
          
          // Welcome message
          setMessages([
            {
              role: 'assistant',
              content: `Hello! I'm your AI assistant powered by Chrome's Gemini Nano. 🤖

**Commands I understand:**
• "Clear the canvas"
• "Show Abu Bakr" / "Focus on Umar"
• "Add Ali to graph"
• "Search for Badr"
• "Switch to timeline view"
• "Zoom in" / "Zoom out" / "Reset zoom"

**Questions I can answer:**
• "Who was Abu Bakr?"
• "Tell me about the Battle of Badr"
• "What happened in Medina?"

Try a command or ask me anything!`,
              timestamp: new Date(),
            },
          ]);
        } catch (error) {
          console.error('Failed to create AI session:', error);
        }
      }
    };

    initSession();

    // Cleanup session when panel closes
    return () => {
      if (!isOpen && aiSession) {
        aiSession.destroy();
        setAISession(null);
      }
    };
  }, [isOpen, isAIAvailable, aiHelper]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parse and execute commands
  const executeCommands = async (commands: UICommand[]): Promise<string> => {
    const results: string[] = [];
    
    console.log(`🎯 Executing ${commands.length} command(s):`, commands);
    
    for (const cmd of commands) {
      try {
        console.log(`⚙️ Processing command:`, cmd);
        
        // Handle both string and object formats (AI sometimes returns strings)
        let actionName: string;
        let params: Record<string, any> = {};
        
        if (typeof cmd === 'string') {
          // AI returned string instead of object
          actionName = cmd;
          console.log(`⚠️ Command is string, converting: "${cmd}"`);
        } else if (typeof cmd === 'object' && cmd.action) {
          // Proper object format
          actionName = cmd.action;
          params = cmd.params || {};
        } else {
          console.error('❌ Invalid command format:', cmd);
          results.push(`❌ Invalid command format`);
          continue;
        }
        
        // Normalize action name (handle variations like "clear_canvas" vs "clear")
        const action = actionName.toLowerCase().replace(/_/g, '').replace(/screen/g, 'canvas');
        
        console.log(`🔄 Normalized action: "${actionName}" → "${action}"`);
        
        switch (action) {
          case 'clear':
          case 'clearcanvas':
            if (onClearCanvas) {
              onClearCanvas();
              results.push('✅ Canvas cleared');
            } else {
              results.push('⚠️ Clear canvas capability not available yet');
            }
            break;
            
          case 'focus':
          case 'focusnode':
          case 'show':
            if (!onFocusNode) {
              results.push('⚠️ Focus capability not available yet');
              break;
            }
            if (params?.name) {
              const searchName = params.name.toLowerCase();
              const node = allNodes.find(n => 
                n.name_en.toLowerCase().includes(searchName) ||
                n.name_ar?.includes(params.name) ||
                // Try exact match first
                n.name_en.toLowerCase() === searchName
              );
              if (node) {
                onFocusNode(node.name_en);
                results.push(`✅ Focused on ${node.name_en}`);
              } else {
                // Suggest similar names
                const similar = allNodes
                  .filter(n => n.name_en.toLowerCase().includes(searchName.split(' ')[0]))
                  .slice(0, 3)
                  .map(n => n.name_en);
                
                if (similar.length > 0) {
                  results.push(`❌ "${params.name}" not found. Did you mean: ${similar.join(', ')}?`);
                } else {
                  results.push(`❌ Person "${params.name}" not found in database`);
                }
              }
            } else {
              results.push(`⚠️ Please specify a person's name (e.g., "show Abu Bakr")`);
            }
            break;
            
          case 'add':
          case 'addnode':
            if (!onAddNode) {
              results.push('⚠️ Add node capability not available yet');
              break;
            }
            if (params?.name) {
              const searchName = params.name.toLowerCase();
              const node = allNodes.find(n => 
                n.name_en.toLowerCase().includes(searchName) ||
                n.name_ar?.includes(params.name) ||
                n.name_en.toLowerCase() === searchName
              );
              if (node) {
                onAddNode(node);
                results.push(`✅ Added ${node.name_en} to graph`);
              } else {
                // Suggest similar names
                const similar = allNodes
                  .filter(n => n.name_en.toLowerCase().includes(searchName.split(' ')[0]))
                  .slice(0, 3)
                  .map(n => n.name_en);
                
                if (similar.length > 0) {
                  results.push(`❌ "${params.name}" not found. Did you mean: ${similar.join(', ')}?`);
                } else {
                  results.push(`❌ Person "${params.name}" not found in database`);
                }
              }
            } else {
              results.push(`⚠️ Please specify a person's name (e.g., "add Abu Bakr")`);
            }
            break;
            
          case 'search':
          case 'searchnodes':
            if (!onSearchChange) {
              results.push('⚠️ Search capability not available yet');
              break;
            }
            if (params?.term) {
              onSearchChange(params.term);
              const found = allNodes.filter(n => 
                n.name_en.toLowerCase().includes(params.term.toLowerCase()) ||
                n.name_ar?.includes(params.term)
              ).length;
              results.push(`✅ Searching for "${params.term}" (${found} results)`);
            } else {
              results.push(`⚠️ Please specify a search term (e.g., "search Badr")`);
            }
            break;
            
          case 'filter':
          case 'filternodes':
            if (!onFilterNodes) {
              results.push('⚠️ Filter capability not available yet');
              break;
            }
            if (params) {
              onFilterNodes(params);
              results.push(`✅ Applied filters`);
            } else {
              results.push(`⚠️ Please specify filter criteria`);
            }
            break;
            
          case 'view':
          case 'switchview':
            if (!onSwitchView) {
              results.push('⚠️ View switching capability not available yet');
              break;
            }
            if (params?.view) {
              const validViews = ['graph', 'timeline', 'political'];
              if (validViews.includes(params.view.toLowerCase())) {
                onSwitchView(params.view.toLowerCase());
                results.push(`✅ Switched to ${params.view} view`);
              } else {
                results.push(`⚠️ Invalid view. Use: graph, timeline, or political`);
              }
            } else {
              results.push(`⚠️ Please specify a view (graph, timeline, or political)`);
            }
            break;
            
          case 'zoom':
          case 'zoomin':
          case 'zoomout':
          case 'resetzoom':
          case 'resetview':
            if (!onZoomIn && !onZoomOut && !onResetZoom) {
              results.push('⚠️ Zoom capability not available yet');
              break;
            }
            const direction = params?.direction || 'reset';
            if (direction === 'in' || action === 'zoomin') {
              onZoomIn?.();
              results.push(`✅ Zoomed in`);
            } else if (direction === 'out' || action === 'zoomout') {
              onZoomOut?.();
              results.push(`✅ Zoomed out`);
            } else {
              onResetZoom?.();
              results.push(`✅ Reset zoom`);
            }
            break;
            
          default:
            results.push(`⚠️ Command "${actionName}" not supported yet. Available: clear, focus, add, search, view, zoom`);
        }
      } catch (error) {
        console.error('❌ Command execution error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push(`❌ Error: ${errorMsg}`);
      }
    }
    
    return results.join('\n');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !aiSession || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Enhanced prompt that helps AI decide between command and question
      const enhancedPrompt = `User: "${currentInput}"

If UI command → respond ONLY with JSON:
{"type":"command","actions":[{"action":"NAME","params":{...}}]}

If question → respond with helpful text.

Extract person names carefully:
- "show abu bakr" → {"action":"focus","params":{"name":"Abu Bakr"}}
- "add umar ibn khattab" → {"action":"add","params":{"name":"Umar ibn al-Khattab"}}

Response:`;
      
      const response = await aiSession.prompt(enhancedPrompt);
      
      console.log('🤖 AI Raw Response:', response);
      
      // Try to parse as JSON command
      let isCommand = false;
      let commandResult = '';
      
      // Clean the response (remove markdown code blocks if present)
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '').trim();
      }
      
      console.log('🧹 Cleaned Response:', cleanResponse);
      
      // Try parsing, removing extra } at the end if needed
      let parsed = null;
      let attempts = [cleanResponse];
      
      // If it ends with multiple }, try removing them one by one
      if (cleanResponse.endsWith('}}')) {
        attempts.push(cleanResponse.slice(0, -1)); // Remove last }
        attempts.push(cleanResponse.slice(0, -2)); // Remove last 2 }
      }
      
      for (const attempt of attempts) {
        try {
          parsed = JSON.parse(attempt);
          console.log('✅ Parsed JSON:', parsed);
          break;
        } catch (e) {
          console.log(`❌ Parse attempt failed for: ${attempt.substring(0, 50)}...`);
        }
      }
      
      if (parsed && parsed.type === 'command' && Array.isArray(parsed.actions)) {
        isCommand = true;
        console.log('🎮 Executing commands:', parsed.actions);
        commandResult = await executeCommands(parsed.actions);
        console.log('✅ Command result:', commandResult);
      } else if (!parsed) {
        console.log('ℹ️ No valid JSON found, treating as text response');
      }
      
      if (isCommand && commandResult) {
        // Show command execution result
        const commandMessage: Message = {
          role: 'assistant',
          content: commandResult,
          timestamp: new Date(),
          isCommand: true,
          commandResult,
        };
        setMessages((prev) => [...prev, commandMessage]);
      } else {
        // Regular Q&A response
        const assistantMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Don't show the FAB if AI is not available
  if (isAIAvailable === false) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="ai-chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Chat Panel */}
      <Collapse in={isOpen} timeout={300}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            width: 420,
            maxWidth: 'calc(100vw - 48px)',
            height: 600,
            maxHeight: 'calc(100vh - 150px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon />
              <Typography variant="h6">AI Assistant</Typography>
              <Chip
                label="Gemini Nano"
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'inherit',
                  fontSize: '0.7rem',
                }}
              />
              <Tooltip title="Can execute UI commands">
                <CommandIcon fontSize="small" />
              </Tooltip>
            </Box>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {isAIAvailable === null && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: '85%',
                    bgcolor:
                      msg.role === 'user'
                        ? 'primary.main'
                        : msg.isCommand
                        ? 'success.light'
                        : 'background.paper',
                    color:
                      msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  {msg.isCommand && (
                    <Chip
                      icon={<CommandIcon />}
                      label="Command Executed"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.7,
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))}

            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Thinking...
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask a question or give a command..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !aiSession}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim() || !aiSession}
              >
                <SendIcon />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Try: "Clear canvas", "Show Abu Bakr", or ask any question
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default AIChatPanel;
