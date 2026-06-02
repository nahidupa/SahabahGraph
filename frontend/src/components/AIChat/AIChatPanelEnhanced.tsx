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

// interface UICommand {
//   action: string;
//   params?: Record<string, any>;
// }

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
  // Application context
  currentView?: 'graph' | 'timeline' | 'political';
  selectedNodes?: Sahabi[];
  graphStats?: {
    totalNodes: number;
    totalRelationships: number;
    prominentFigures: string[];
  };
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
  var LanguageModel: LanguageModelConstructor;
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
  // onFilterNodes,
  onSwitchView,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSearchChange,
  allNodes = [],
  currentView = 'graph',
  selectedNodes = [],
  graphStats,
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
          // Build context-aware system prompt
          const totalPeople = graphStats?.totalNodes || allNodes.length;
          const prominentNames = graphStats?.prominentFigures || [
            'Abu Bakr', 'Umar ibn al-Khattab', 'Uthman ibn Affan', 'Ali ibn Abi Talib',
            'Khalid ibn al-Walid', 'Muawiya I', 'Aisha bint Abi Bakr'
          ];
          
          const currentGraphContext = selectedNodes.length > 0 
            ? `Currently viewing: ${selectedNodes.map(n => n.name_en).join(', ')}`
            : 'No nodes selected yet';
          
          const systemPrompt = `You are the SahabahGraph Assistant - an AI guide specialized in early Islamic history.

# YOUR ROLE
You answer questions about early Islamic history. Commands like "clear", "add Abu Bakr", "search Badr" are handled automatically by the application, so you NEVER need to generate JSON or execute commands - just focus on answering historical questions.

# KNOWLEDGE BASE
- **${totalPeople} historical figures**: Sahabah (Companions), Ashara Mubashshara, Umayyad governors (660-683 CE)
- **8 major battles**: Badr, Uhud, Trench, Khaibar, Mu'tah, Hunayn, Yarmouk, Qadisiyyah
- **6 major cities**: Medina, Mecca, Damascus, Kufa, Basra, Fustat
- **Relationships**: family, mentorship, battles, companionship, governance

# PROMINENT FIGURES
${prominentNames.slice(0, 7).join(' • ')}

# CURRENT STATE
- View: ${currentView === 'graph' ? 'Interactive Graph' : currentView === 'timeline' ? 'Timeline View' : 'Political View'}
- ${currentGraphContext}
- Database: ${totalPeople} people, ${graphStats?.totalRelationships || '140+'} relationships

# ANSWERING QUESTIONS
Provide factual, respectful answers using Islamic honorifics (ﷺ for Prophet, رضي الله عنه for Companions).

Examples:

"Who was Abu Bakr?"
→ "Abu Bakr as-Siddiq (رضي الله عنه) was the first Caliph and closest companion of Prophet Muhammad (ﷺ). Key facts:
• Full name: Abdullah ibn Abi Quhafa
• Title: As-Siddiq (The Truthful)
• Father of Aisha (wife of the Prophet)
• First adult male to accept Islam
• Caliph: 632-634 CE
• Participated in Badr, Uhud, and other battles

Would you like to see him on the graph? Just type 'add Abu Bakr'"

"How are Umar and Ali related?"
→ "Umar ibn al-Khattab (رضي الله عنه) and Ali ibn Abi Talib (رضي الله عنه) had multiple connections:

**Family:** Ali married Umar's daughter Umm Kulthum (father-in-law / son-in-law)
**Companionship:** Both were among the Ashara Mubashshara (10 promised Paradise), fought together at Badr, Uhud, etc.
**Political:** Umar was 2nd Caliph (634-644 CE), Ali was 4th Caliph (656-661 CE)

Want to visualize this? Type 'add Umar and Ali'"

"What can you do?"
→ "I answer questions about ${totalPeople} historical figures from early Islam! Ask about:
• Biographies (Who was X?)
• Relationships (How are X and Y related?)
• Battles (Tell me about Badr)
• Governorships (Who ruled Damascus?)

Commands like 'clear', 'add Abu Bakr', 'search Badr' work automatically - just type them naturally!"

# GUIDELINES
- **Respectful**: Use Islamic honorifics appropriately
- **Accurate**: Only state known facts; acknowledge limitations
- **Educational**: Provide context, dates, relationships
- **Concise**: Keep answers focused but informative
- **Helpful**: Suggest graph commands when relevant ("Want to see them? Type 'add X'")
- **Scope**: Limit answers to Sahabah and early Umayyad period (up to 683 CE)

If asked about modern topics or later Islamic history: "My knowledge covers the Sahabah and early Umayyad period (up to 683 CE)"

REMEMBER: You ONLY answer questions. Commands are handled automatically - never generate JSON.`;

          const session = await aiHelper.createSession(systemPrompt);
          setAISession(session);
          
          // Welcome message
          setMessages([
            {
              role: 'assistant',
              content: `As-salamu alaykum! I'm the **SahabahGraph Assistant** 🕌

I specialize in early Islamic history and can help you explore **${totalPeople} historical figures**, including:
• The Ashara Mubashshara (10 promised Paradise)
• Participants in 8 major battles
• Umayyad governors (660-683 CE)

**Ask me anything:**
• "Who was Abu Bakr?"
• "Tell me about the Battle of Badr"
• "How are Umar and Ali related?"

**Or control the graph:**
• "Show me Abu Bakr"
• "Add Ali to the graph"
• "Switch to timeline view"

Current view: **${currentView}** | ${currentGraphContext}

What would you like to explore?`,
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
  }, [isOpen, isAIAvailable, aiHelper, currentView, graphStats, selectedNodes.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Client-side command parser - NO AI needed for simple commands
  const parseUserInput = (input: string): { 
    type: 'command' | 'question'; 
    command?: { action: string; params: Record<string, any> };
  } => {
    const lower = input.toLowerCase().trim();
    
    // 1. CLEAR commands
    if (/^(clear|reset)(\s+(the\s+)?(canvas|graph|screen))?$/i.test(lower)) {
      return { type: 'command', command: { action: 'clear', params: {} } };
    }
    
    // 2. SHOW/ADD single person commands
    const showMatch = input.match(/^(show|add|display|i want to see)\s+(?:me\s+)?(.+?)$/i);
    if (showMatch && !lower.includes(' all ')) {
      return { 
        type: 'command', 
        command: { action: 'add', params: { name: showMatch[2].trim() } } 
      };
    }
    
    // 3. SEARCH commands - "all X" patterns or explicit search
    const allMatch = input.match(/^(?:add|show|find)\s+all\s+(?:involved in|at|from|in|of|the)?\s*(.+)$/i);
    if (allMatch) {
      return { 
        type: 'command', 
        command: { action: 'search', params: { term: allMatch[1].trim() } } 
      };
    }
    
    const searchMatch = input.match(/^(?:search|find)\s+(?:for\s+)?(.+)$/i);
    if (searchMatch) {
      return { 
        type: 'command', 
        command: { action: 'search', params: { term: searchMatch[1].trim() } } 
      };
    }
    
    // 4. ZOOM commands
    if (/^zoom\s+(in|out)$/i.test(lower)) {
      const direction = lower.includes('in') ? 'in' : 'out';
      return { type: 'command', command: { action: 'zoom', params: { direction } } };
    }
    
    // 5. VIEW commands
    const viewMatch = input.match(/^(?:switch to|show|view)\s+(timeline|political|graph)(?:\s+view)?$/i);
    if (viewMatch) {
      return { 
        type: 'command', 
        command: { action: 'view', params: { view: viewMatch[1].toLowerCase() } } 
      };
    }
    
    // 6. FOCUS commands
    const focusMatch = input.match(/^(?:focus|highlight)\s+(?:on\s+)?(.+)$/i);
    if (focusMatch) {
      return { 
        type: 'command', 
        command: { action: 'focus', params: { name: focusMatch[1].trim() } } 
      };
    }
    
    // 7. EXPAND RELATIONSHIP commands
    // Patterns: "expand relationship between X and Y", "show relationship X and Y", "expand X and Y"
    const expandBetween = input.match(/^(?:expand|show)\s+(?:relationship|relation|connection)?\s*(?:between|of)?\s+(.+?)\s+(?:and|with)\s+(.+)$/i);
    if (expandBetween) {
      return {
        type: 'command',
        command: { 
          action: 'expand', 
          params: { 
            person1: expandBetween[1].trim(), 
            person2: expandBetween[2].trim() 
          } 
        }
      };
    }
    
    // Pattern: "expand their relationship" (uses currently selected nodes)
    if (/^expand\s+(?:their|the)?\s*relationship/i.test(lower)) {
      return {
        type: 'command',
        command: { action: 'expand', params: { useCurrent: true } }
      };
    }
    
    // Everything else is a question for the AI
    return { type: 'question' };
  };

  // Execute a single command (no AI involved)
  const executeCommand = async (command: { action: string; params: Record<string, any> }): Promise<string> => {
    const { action, params } = command;
    
    console.log(`🎯 Executing command:`, action, params);
    
    switch (action) {
      case 'clear':
        if (onClearCanvas) {
          onClearCanvas();
          return '✅ Canvas cleared';
        }
        return '⚠️ Clear canvas capability not available';
        
      case 'add':
      case 'focus': {
        const handler = action === 'add' ? onAddNode : onFocusNode;
        if (!handler) {
          return `⚠️ ${action === 'add' ? 'Add' : 'Focus'} capability not available`;
        }
        
        if (!params.name) {
          return `⚠️ Please specify a person's name`;
        }
        
        const searchName = params.name.toLowerCase();
        const node = allNodes.find(n => 
          n.name_en.toLowerCase().includes(searchName) ||
          n.name_ar?.includes(params.name) ||
          n.name_en.toLowerCase() === searchName
        );
        
        if (node) {
          if (action === 'add') {
            onAddNode!(node);
            return `✅ Added ${node.name_en} to graph`;
          } else {
            onFocusNode!(node.name_en);
            return `✅ Focused on ${node.name_en}`;
          }
        } else {
          const similar = allNodes
            .filter(n => n.name_en.toLowerCase().includes(searchName.split(' ')[0]))
            .slice(0, 3)
            .map(n => n.name_en);
          
          if (similar.length > 0) {
            return `❌ "${params.name}" not found. Did you mean: ${similar.join(', ')}?`;
          }
          return `❌ Person "${params.name}" not found in database`;
        }
      }
      
      case 'search':
        if (!onSearchChange) {
          return '⚠️ Search capability not available';
        }
        if (!params.term) {
          return '⚠️ Please specify a search term';
        }
        onSearchChange(params.term);
        const found = allNodes.filter(n => 
          n.name_en.toLowerCase().includes(params.term.toLowerCase()) ||
          n.name_ar?.includes(params.term)
        ).length;
        return `✅ Searching for "${params.term}" (${found} results)`;
        
      case 'view':
        if (!onSwitchView) {
          return '⚠️ View switching capability not available';
        }
        if (!params.view) {
          return '⚠️ Please specify a view (graph, timeline, or political)';
        }
        const validViews = ['graph', 'timeline', 'political'];
        if (!validViews.includes(params.view)) {
          return `⚠️ Invalid view. Use: ${validViews.join(', ')}`;
        }
        onSwitchView(params.view);
        return `✅ Switched to ${params.view} view`;
        
      case 'zoom':
        const direction = params.direction || 'reset';
        if (direction === 'in' && onZoomIn) {
          onZoomIn();
          return '✅ Zoomed in';
        } else if (direction === 'out' && onZoomOut) {
          onZoomOut();
          return '✅ Zoomed out';
        } else if (onResetZoom) {
          onResetZoom();
          return '✅ Reset zoom';
        }
        return '⚠️ Zoom capability not available';
        
      case 'expand': {
        if (!onAddNode) {
          return '⚠️ Add node capability not available';
        }
        
        // Handle "expand their relationship" (uses current selection)
        if (params.useCurrent) {
          if (selectedNodes.length < 2) {
            return '⚠️ Please select at least 2 people first, or specify names like "expand Abu Bakr and Umar"';
          }
          return `ℹ️ Relationships between ${selectedNodes.map(n => n.name_en).join(', ')} are already shown automatically as connecting lines.

The graph displays all relationships from the database:
• Family (parent, spouse, sibling)
• Battles fought together
• Companionship
• Governance

To see MORE related people, try "add [person name]"`;
        }
        
        // Handle "expand X and Y" - add both people if not already on graph
        const { person1, person2 } = params;
        if (!person1 || !person2) {
          return '⚠️ Please specify two people (e.g., "expand Abu Bakr and Umar")';
        }
        
        const searchName1 = person1.toLowerCase();
        const searchName2 = person2.toLowerCase();
        
        const node1 = allNodes.find(n => 
          n.name_en.toLowerCase().includes(searchName1) ||
          n.name_ar?.includes(person1)
        );
        const node2 = allNodes.find(n => 
          n.name_en.toLowerCase().includes(searchName2) ||
          n.name_ar?.includes(person2)
        );
        
        if (!node1 && !node2) {
          return `❌ Neither "${person1}" nor "${person2}" found in database`;
        }
        
        if (!node1) {
          return `❌ "${person1}" not found in database`;
        }
        
        if (!node2) {
          return `❌ "${person2}" not found in database`;
        }
        
        // Add both nodes
        onAddNode(node1);
        onAddNode(node2);
        
        return `✅ Added ${node1.name_en} and ${node2.name_en} to the graph.

Their relationships are now visible as connecting lines:
• Family relationships
• Shared battles
• Companionship connections

The graph automatically displays all relationships from the database!`;
      }
        
      default:
        return `❌ Unknown command: ${action}`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

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
      // Parse user input with client-side regex (deterministic, no AI needed)
      const parsed = parseUserInput(currentInput);
      
      if (parsed.type === 'command' && parsed.command) {
        // Execute command directly - NO AI INVOLVED
        console.log('🎯 Detected command:', parsed.command);
        const result = await executeCommand(parsed.command);
        
        const resultMessage: Message = {
          role: 'assistant',
          content: result,
          timestamp: new Date(),
          isCommand: true,
          commandResult: result,
        };
        setMessages((prev) => [...prev, resultMessage]);
        
      } else {
        // It's a question - ask the AI
        console.log('❓ Detected question, asking AI...');
        
        if (!aiSession) {
          const errorMessage: Message = {
            role: 'assistant',
            content: 'AI session not available. Please try reopening the chat panel.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return;
        }
        
        // Simple prompt for Q&A only
        const response = await aiSession.prompt(`User question: "${currentInput}"

Answer this question about early Islamic history. Be informative and respectful.

If the question mentions people in the database, offer to add them to the graph at the end.`);
        
        const aiMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
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
