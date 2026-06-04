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
  LinearProgress,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import { ragEngine } from '../../utils/ragEngine';
import { TransformersAIHelper } from '../../utils/transformersAIHelper';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const session = await (window.ai.languageModel.create() as any);
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

const AIChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChromeAIAvailable, setIsChromeAIAvailable] = useState<boolean | null>(null);
  const [isTransformersAvailable, setIsTransformersAvailable] = useState<boolean | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiSession, setAISession] = useState<any>(null);
  const [chromeAIHelper] = useState(() => new ChromeAIHelper());
  const [transformersHelper] = useState(() => new TransformersAIHelper());
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [aiMode, setAiMode] = useState<'chrome' | 'transformers' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI availability
  useEffect(() => {
    const checkAvailability = async () => {
      const chromeAvailable = await chromeAIHelper.checkAvailability();
      setIsChromeAIAvailable(chromeAvailable);

      const webGPUSupported = await transformersHelper.checkWebGPUSupport();
      setIsTransformersAvailable(webGPUSupported);
    };

    checkAvailability();
  }, [chromeAIHelper, transformersHelper]);

  // Initialize AI session
  useEffect(() => {
    let active = true;
    const initSession = async () => {
      if (!isOpen) return;

      if (isChromeAIAvailable) {
        try {
          const systemPrompt = "You are an AI assistant for SahabahGraph, an interactive visualization of the companions (Sahabah) of Prophet Muhammad (PBUH). The application shows relationships including family ties, mentorship, battles, and governance. Provide concise, accurate, and respectful responses.";
          const session = await chromeAIHelper.createSession(systemPrompt);
          if (!active) {
            if (session.destroy) session.destroy();
            return;
          }
          setAISession(session);
          setAiMode('chrome');
          
          setMessages([
            {
              role: 'assistant',
              content: 'Hello! I\'m your AI assistant powered by Chrome\'s built-in Gemini Nano. How can I assist you today?',
              timestamp: new Date(),
            },
          ]);
          return;
        } catch (error) {
          console.error('Failed to create Chrome AI session:', error);
        }
      }

      if (isTransformersAvailable) {
        setAiMode('transformers');
        transformersHelper.init(
          (progress) => {
            if (active && progress.status === 'progress') {
              setDownloadProgress(progress.progress);
            }
          },
          () => {
            if (active) {
              setDownloadProgress(100);
              setMessages([
                {
                  role: 'assistant',
                  content: 'Hello! I\'m your AI assistant powered by Transformers.js and WebGPU. I can help you explore SahabahGraph using a local model. How can I help?',
                  timestamp: new Date(),
                },
              ]);
            }
          },
          (error) => {
            console.error('Transformers.js Error:', error);
            if (active) setIsTransformersAvailable(false);
          }
        );
      }
    };

    initSession();

    return () => {
      active = false;
      if (aiSession?.destroy) {
        aiSession.destroy();
      }
      setAISession(null);
      // We don't destroy transformersHelper worker here to keep it cached if they reopen,
      // but if the component unmounts entirely we might want to.
      // However, usually we keep it for the session.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isChromeAIAvailable, isTransformersAvailable]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (aiMode === 'chrome' && !aiSession) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = await ragEngine.getContext(inputValue);
      const fullPrompt = `${context}\n\nUser Question: ${inputValue}`;

      let response = '';
      if (aiMode === 'chrome') {
        response = await aiSession.prompt(fullPrompt);
      } else if (aiMode === 'transformers') {
        const promptMessages = [
            { role: 'system', content: 'You are an AI assistant for SahabahGraph. Use the provided context to answer questions about Sahabah.' },
            { role: 'user', content: fullPrompt }
        ];
        response = await transformersHelper.prompt(promptMessages);
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      }]);
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

  if (isChromeAIAvailable === false && isTransformersAvailable === false) {
    return null;
  }

  return (
    <>
      <Fab
        color="primary"
        aria-label="ai-chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      <Collapse in={isOpen} timeout={300}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed', bottom: 96, right: 24, width: 400, maxWidth: 'calc(100vw - 48px)',
            height: 600, maxHeight: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column',
            zIndex: 1300, borderRadius: 2, overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon />
              <Typography variant="h6">AI Assistant</Typography>
              <Chip
                label={aiMode === 'chrome' ? 'Gemini Nano' : 'WebGPU Local'}
                size="small"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'inherit', fontSize: '0.7rem' }}
              />
            </Box>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'inherit' }} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>

          {aiMode === 'transformers' && downloadProgress < 100 && (
            <Box sx={{ p: 1, bgcolor: 'background.paper' }}>
              <Typography variant="caption" gutterBottom>
                Downloading Model: {Math.round(downloadProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={downloadProgress} />
            </Box>
          )}

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map((message, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <Paper elevation={1} sx={{ p: 1.5, maxWidth: '80%', bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100', color: message.role === 'user' ? 'primary.contrastText' : 'text.primary', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, fontSize: '0.65rem' }}>{message.timestamp.toLocaleTimeString()}</Typography>
                </Paper>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">AI is thinking...</Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth multiline maxRows={3} value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about Sahabah..."
                disabled={isLoading || (aiMode === 'transformers' && downloadProgress < 100)}
                size="small" variant="outlined"
              />
              <IconButton color="primary" onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading || (aiMode === 'transformers' && downloadProgress < 100)} aria-label="send">
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default AIChatPanel;
