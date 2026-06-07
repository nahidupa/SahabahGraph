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
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as AIIcon,
  Psychology as CommandIcon,
} from '@mui/icons-material';
import type { Sahabi } from '../../types';
import { TransformersAIHelper } from '../../utils/transformersAIHelper';

// Available AI models configuration
const AVAILABLE_MODELS = [
    {
    id: 'HuggingFaceTB/SmolLM2-135M-Instruct',
    name: 'SmolLM2 (135M)',
    size: '~80MB',
    description: 'Fast - Smaller, faster loading'
  },
  {
    id: 'onnx-community/Qwen2.5-0.5B-Instruct',
    name: 'Qwen2.5 (500M)',
    size: '~300MB',
    description: 'Balanced - Good quality, moderate size'
  }

] as const;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isCommand?: boolean;
  commandResult?: string;
  isThinking?: boolean;
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
  allRelationships?: Array<{ source: number; target: number; type: string; category: string }>;
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
  allRelationships = [],
  cyRef,
  currentView = 'graph',
  selectedNodes = [],
  graphStats,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChromeAIAvailable, setIsChromeAIAvailable] = useState<boolean | null>(null);
  const [isTransformersAvailable, setIsTransformersAvailable] = useState<boolean | null>(false); // Default to false
  const [aiSession, setAISession] = useState<any>(null);
  const [lastSuggestion, setLastSuggestion] = useState<{ action: string; params: Record<string, any> } | null>(null);
  const [aiHelper] = useState(() => new ChromeAIHelper());
  const [transformersHelper] = useState<TransformersAIHelper | null>(() => {
    // Only create Transformers helper if not in development or if explicitly needed
    try {
      return new TransformersAIHelper();
    } catch (error) {
      console.warn('Transformers.js helper not available:', error);
      return null;
    }
  });
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [aiMode, setAiMode] = useState<'chrome' | 'transformers' | null>(null);
  const [backend, setBackend] = useState<'webgpu' | 'wasm'>(() => {
    // Load from localStorage or default to wasm (lower memory)
    const saved = localStorage.getItem('ai-backend') as 'webgpu' | 'wasm';
    const selected = saved || 'wasm';
    console.log('🔧 Component: Loading backend from localStorage:', saved, '→ using:', selected);
    return selected;
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Load from localStorage or default to Qwen
    const saved = localStorage.getItem('ai-model');
    const selected = saved || AVAILABLE_MODELS[0].id;
    console.log('🔧 Component: Loading model from localStorage:', saved, '→ using:', selected);
    return selected;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI availability for both Chrome AI and Transformers.js
  useEffect(() => {
    const checkAIAvailability = async () => {
      try {
        const chromeAvailable = await aiHelper.checkAvailability();
        setIsChromeAIAvailable(chromeAvailable);
      } catch (error) {
        console.error('Chrome AI availability check failed:', error);
        setIsChromeAIAvailable(false);
      }
      
      try {
        const webGPUSupported = transformersHelper ? await transformersHelper.checkWebGPUSupport() : false;
        setIsTransformersAvailable(webGPUSupported);
      } catch (error) {
        console.error('Transformers.js availability check failed:', error);
        setIsTransformersAvailable(false);
      }
    };

    checkAIAvailability();
  }, [aiHelper, transformersHelper]);

  // Save backend preference to localStorage whenever it changes
  useEffect(() => {
    console.log('🔧 Component: Saving backend to localStorage:', backend);
    localStorage.setItem('ai-backend', backend);
  }, [backend]);

  // Save model preference to localStorage whenever it changes
  useEffect(() => {
    console.log('🔧 Component: Saving model to localStorage:', selectedModel);
    localStorage.setItem('ai-model', selectedModel);
  }, [selectedModel]);

  // Initialize AI session when panel opens
  useEffect(() => {
    let active = true;
    const initSession = async () => {
      if (!isOpen) return;
      
      // Try Chrome AI first
      if (isChromeAIAvailable && !aiSession) {
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
          if (!active) {
            if (session.destroy) session.destroy();
            return;
          }
          setAISession(session);
          setAiMode('chrome');
          
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
          console.error('Chrome AI init failed:', error);
        }
      }
      
      // Fall back to Transformers.js if Chrome AI not available
      else if (isTransformersAvailable && transformersHelper && !aiSession) {
        try {
          console.log('🔧 Component: Initializing Transformers.js with backend:', backend, 'model:', selectedModel);
          setAiMode('transformers');
          await transformersHelper.init(
            (progress: any) => {
              setDownloadProgress(progress.progress || 0);
            },
            () => {
              if (active) {
                // Set aiSession to enable input field
                console.log('🔧 Component: Setting aiSession to enable input');
                setAISession(transformersHelper);
                setMessages([
                  {
                    role: 'assistant',
                    content: `Assalamu Alaikum! 🕌 I'm your AI assistant for exploring SahabahGraph. I can help you discover relationships between the Sahabah (companions of Prophet Muhammad ﷺ), search by name, tribe, or family connections, and visualize their biographical data. Ask me about specific Sahabah, request family trees, or use commands like "Add random sahaba" or "Compare Ali and Uthman". How may I assist you today?`,
                    timestamp: new Date(),
                  },
                ]);
              }
            },
            (error: string, suggestFallback?: boolean) => {
              console.error('🔧 Component: Transformers.js Error:', error, 'suggestFallback:', suggestFallback, 'current backend:', backend, 'model:', selectedModel);
              
              // If WebGPU failed with OOM and we haven't already switched to WASM
              if (suggestFallback && backend === 'webgpu') {
                console.log('🔧 Component: WebGPU OOM detected, auto-switching to WASM');
                setBackend('wasm');
                // Retry with WASM
                if (active && transformersHelper) {
                  transformersHelper.init(
                    (progress: any) => {
                      setDownloadProgress(progress.progress || 0);
                    },
                    () => {
                      if (active) {
                        setAISession(transformersHelper);
                        setMessages([
                          {
                            role: 'assistant',
                            content: `Assalamu Alaikum! 🕌 I'm your AI assistant for exploring SahabahGraph (WASM mode - switched automatically due to memory constraints). I can help you discover relationships between the Sahabah (companions of Prophet Muhammad ﷺ), search by name, tribe, or family connections, and visualize their biographical data. Ask me about specific Sahabah, request family trees, or use commands like "Add random sahaba" or "Compare Ali and Uthman". How may I assist you today?`,
                            timestamp: new Date(),
                          },
                        ]);
                      }
                    },
                    (retryError: string) => {
                      console.error('WASM fallback also failed:', retryError);
                      // Show error message to user
                      if (active) {
                        setMessages([
                          {
                            role: 'assistant',
                            content: `❌ I'm sorry, but I'm unable to load the AI model due to insufficient memory. The model requires more RAM than is currently available.

⚠️ **Troubleshooting:**
- Close other browser tabs and applications to free up memory
- Try refreshing the page
- The AI chat feature may not work on devices with limited RAM

💡 You can still use **command-based features** without AI:
- Type "add random sahaba" to add people to the graph
- Type "compare Ali and Uthman" for comparisons
- Type "list tribes" to see available data

The AI natural language understanding won't work, but direct commands will still function.`,
                            timestamp: new Date(),
                          },
                        ]);
                      }
                    },
                    'wasm',
                    true,
                    selectedModel // Pass model to fallback init
                  );
                }
              }
              // If WASM also fails (non-fallback error on WASM backend)
              else if (!suggestFallback && backend === 'wasm' && error.includes('bad_alloc')) {
                console.error('🔧 Component: WASM also failed with OOM');
                if (active) {
                  setMessages([
                    {
                      role: 'assistant',
                      content: `❌ I'm sorry, but I'm unable to load the AI model due to insufficient memory. The model requires more RAM than is currently available.

⚠️ **Troubleshooting:**
- Close other browser tabs and applications to free up memory
- Try refreshing the page
- The AI chat feature may not work on devices with limited RAM

💡 You can still use **command-based features** without AI:
- Type "add random sahaba" to add people to the graph
- Type "compare Ali and Uthman" for comparisons
- Type "list tribes" to see available data

The AI natural language understanding won't work, but direct commands will still function.`,
                      timestamp: new Date(),
                    },
                  ]);
                }
              }
              // Note: We don't set isTransformersAvailable to false here
              // because that would unmount the component on any error
            },
            backend, // Pass backend selection to worker
            false, // Don't force reload on initial load
            selectedModel // Pass selected model to worker
          );
        } catch (error) {
          console.error('Transformers.js init failed:', error);
          if (active) setIsTransformersAvailable(false);
        }
      }
    };

    initSession();

    // Cleanup session when panel closes
    return () => {
      active = false;
      if (!isOpen && aiSession) {
        if (aiMode === 'chrome' && aiSession.destroy) {
          aiSession.destroy();
        }
        // We don't destroy transformersHelper worker here to keep it cached if they reopen,
        // but set aiSession to null so they get a fresh welcome
        setAISession(null);
      }
    };
  }, [isOpen, isChromeAIAvailable, isTransformersAvailable, aiHelper, transformersHelper, currentView, graphStats, selectedNodes.length, backend, selectedModel]);

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
    
    // 0. CONFIRMATION commands - "yes", "confirm", "ok", "sure"
    if (/^(yes|yeah|yep|ok|okay|sure|confirm|do it|proceed)$/i.test(lower)) {
      if (lastSuggestion) {
        return { type: 'command', command: lastSuggestion };
      }
      // If no suggestion stored, treat as question
      return { type: 'question' };
    }
    
    // 1. CLEAR commands
    if (/^(clear|reset)(\s+(the\s+)?(canvas|graph|screen))?$/i.test(lower)) {
      return { type: 'command', command: { action: 'clear', params: {} } };
    }
    
    // 2. RANDOM selection - "add X random sahaba/people/companions"
    const randomMatch = input.match(/^(?:add|show|display)\s+(\d+|few|some|several)\s+random\s+(?:sahaba|people|companions|persons|sahabah)/i);
    if (randomMatch) {
      let count = 5; // default for "few/some/several"
      if (randomMatch[1].match(/^\d+$/)) {
        count = Math.min(parseInt(randomMatch[1], 10), 20); // Max 20
      } else if (randomMatch[1].toLowerCase() === 'few') {
        count = 3;
      } else if (randomMatch[1].toLowerCase() === 'some') {
        count = 5;
      } else if (randomMatch[1].toLowerCase() === 'several') {
        count = 7;
      }
      return { 
        type: 'command', 
        command: { action: 'random', params: { count } } 
      };
    }
    
    // 3. ADD/SHOW RELATIONSHIP - "add relation/relationship with/between X and Y"
    const addRelationMatch = input.match(/^(?:add|show|display)\s+(?:relation|relationship|connection)\s+(?:with|between|of)\s+(.+?)\s+(?:and|with)\s+(.+)$/i);
    if (addRelationMatch) {
      return {
        type: 'command',
        command: { 
          action: 'expand', 
          params: { 
            person1: addRelationMatch[1].trim(), 
            person2: addRelationMatch[2].trim() 
          } 
        }
      };
    }
    
    // 3b. SHOW/ADD single person commands
    const showMatch = input.match(/^(show|add|display|i want to see)\s+(?:me\s+)?(.+?)$/i);
    if (showMatch && !lower.includes(' all ') && !lower.includes(' family')) {
      return { 
        type: 'command', 
        command: { action: 'add', params: { name: showMatch[2].trim() } } 
      };
    }
    
    // 2b. FAMILY commands - multiple patterns
    
    // Pattern 1: Specific relationship type - "expand parents of X", "show children of X", etc.
    const familyTypeMatch = input.match(/^(?:expand|show|display)\s+(parents?|children|child|sons?|daughters?|spouses?|wives?|husband|siblings?|brothers?|sisters?)\s+of\s+(.+)$/i);
    if (familyTypeMatch) {
      const relationshipType = familyTypeMatch[1].trim().toLowerCase();
      const name = familyTypeMatch[2].trim();
      
      // Normalize relationship types to standard forms
      let normalizedType = relationshipType;
      if (['parent', 'parents'].includes(relationshipType)) normalizedType = 'parents';
      else if (['child', 'children', 'son', 'sons', 'daughter', 'daughters'].includes(relationshipType)) normalizedType = 'children';
      else if (['spouse', 'spouses', 'wife', 'wives', 'husband'].includes(relationshipType)) normalizedType = 'spouses';
      else if (['sibling', 'siblings', 'brother', 'brothers', 'sister', 'sisters'].includes(relationshipType)) normalizedType = 'siblings';
      
      return { 
        type: 'command', 
        command: { action: 'family', params: { name, relationshipType: normalizedType } } 
      };
    }
    
    // Pattern 2: "expand family of X", "show family of X" (all family members)
    const familyOfMatch = input.match(/^(?:expand|show|display)\s+family\s+of\s+(.+)$/i);
    if (familyOfMatch) {
      return { 
        type: 'command', 
        command: { action: 'family', params: { name: familyOfMatch[1].trim() } } 
      };
    }
    
    // Pattern 3: "create graph of X family", "show X family", "expand X's family"
    const familyMatch = input.match(/^(?:create\s+graph\s+of|show|display|expand)\s+(?:me\s+)?(.+?)(?:'s)?\s+family(?:\s+members?)?$/i);
    if (familyMatch) {
      return { 
        type: 'command', 
        command: { action: 'family', params: { name: familyMatch[1].trim() } } 
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
    
    // 8. COMPARE commands - "compare X and Y"
    const compareMatch = input.match(/^compare\s+(.+?)\s+(?:and|with|vs|versus)\s+(.+)$/i);
    if (compareMatch) {
      return {
        type: 'command',
        command: { 
          action: 'compare', 
          params: { 
            person1: compareMatch[1].trim(), 
            person2: compareMatch[2].trim() 
          } 
        }
      };
    }
    
    // 9. FILTER commands - "filter by tribe/battle/prominence"
    const filterMatch = input.match(/^(?:filter|show|list)\s+(?:by\s+)?(?:tribe|clan|prominence|battle|role)(?:\s+(.+))?$/i);
    if (filterMatch) {
      return {
        type: 'command',
        command: { action: 'filter', params: { criteria: filterMatch[1]?.trim() || 'all' } }
      };
    }
    
    // 10. STATS command - "show stats" or "statistics"
    if (/^(?:show\s+)?(?:stats|statistics|summary)$/i.test(lower)) {
      return { type: 'command', command: { action: 'stats', params: {} } };
    }
    
    // 11. LIST commands - "list tribes", "list battles", "list all X" (accepts singular/plural)
    const listMatch = input.match(/^list\s+(?:all\s+)?(tribes?|clans?|battles?|wives?|children|prominent)$/i);
    if (listMatch) {
      // Normalize to plural form
      let category = listMatch[1].toLowerCase();
      if (category === 'tribe') category = 'tribes';
      if (category === 'clan') category = 'clans';
      if (category === 'battle') category = 'battles';
      if (category === 'wife') category = 'wives';
      return {
        type: 'command',
        command: { action: 'list', params: { category } }
      };
    }
    
    // 12. PATH/CONNECTION command - "path between X and Y" or "how are X and Y connected"
    const pathMatch = input.match(/^(?:path|connection|how\s+(?:are|is))\s+(?:between\s+)?(.+?)\s+(?:and|to|with)\s+(.+?)(?:\s+connected)?$/i);
    if (pathMatch) {
      return {
        type: 'command',
        command: { 
          action: 'path', 
          params: { 
            person1: pathMatch[1].trim(), 
            person2: pathMatch[2].trim() 
          } 
        }
      };
    }
    
    // Everything else is a question for the AI
    return { type: 'question' };
  };

  // ============================================
  // RAG: Retrieve relevant context from database
  // ============================================
  const retrieveContext = (question: string): string => {
    if (!allNodes || allNodes.length === 0) {
      return 'No data available.';
    }

    const lowerQuestion = question.toLowerCase();
    let context = '';

    // Extract potential names from the question
    const relevantNodes = allNodes.filter(node => {
      const name = node.name_en.toLowerCase();
      return lowerQuestion.includes(name) || 
             lowerQuestion.includes(node.kunyah?.toLowerCase() || '') ||
             lowerQuestion.includes(node.laqab?.toLowerCase() || '');
    });

    // If specific people mentioned, provide detailed context
    if (relevantNodes.length > 0 && relevantNodes.length <= 3) {
      context += '📚 RELEVANT PEOPLE:\n\n';
      relevantNodes.forEach(node => {
        context += `**${node.name_en}** (${node.kunyah || 'N/A'})\n`;
        context += `- Prominence: ${node.prominence}\n`;
        if (node.tribe) context += `- Tribe: ${node.tribe}\n`;
        if (node.clan) context += `- Clan: ${node.clan}\n`;
        if (node.birth_year_hijri) context += `- Born: ${node.birth_year_hijri} AH\n`;
        if (node.death_year_hijri) context += `- Died: ${node.death_year_hijri} AH\n`;
        if (node.biography_short) {
          context += `- Biography: ${node.biography_short.substring(0, 300)}...\n`;
        }
        context += '\n';
      });
    }

    // Topic-based context retrieval
    if (lowerQuestion.includes('battle') || lowerQuestion.includes('war') || lowerQuestion.includes('fight')) {
      const warriors = allNodes.filter(n => n.has_battles && n.prominence !== 'MINOR');
      context += `\n📖 ${warriors.length} prominent figures participated in battles.\n`;
    }

    if (lowerQuestion.includes('tribe') || lowerQuestion.includes('clan')) {
      const tribes = [...new Set(allNodes.filter(n => n.tribe).map(n => n.tribe))];
      context += `\n🏕️ Major tribes: ${tribes.slice(0, 10).join(', ')}\n`;
    }

    if (lowerQuestion.includes('wife') || lowerQuestion.includes('spouse') || lowerQuestion.includes('marriage')) {
      const withSpouses = allNodes.filter(n => n.has_spouses);
      context += `\n💑 ${withSpouses.length} people have recorded marriages.\n`;
    }

    if (lowerQuestion.includes('child') || lowerQuestion.includes('son') || lowerQuestion.includes('daughter')) {
      const withChildren = allNodes.filter(n => n.has_children);
      context += `\n👨‍👩‍👧‍👦 ${withChildren.length} people have recorded children.\n`;
    }

    // If no specific context found, provide general stats
    if (!context) {
      const totalNodes = allNodes.length;
      const prophets = allNodes.filter(n => n.is_prophet).length;
      const ashara = allNodes.filter(n => n.prominence === 'ASHARA_MUBASHSHARA').length;
      context = `\n📊 DATABASE STATS:\n`;
      context += `- Total Sahabah: ${totalNodes}\n`;
      context += `- Prophets: ${prophets}\n`;
      context += `- Ashara Mubashshara: ${ashara}\n`;
    }

    return context;
  };

  // Parse AI responses for command intentions and execute them
  const extractAndExecuteCommands = async (aiResponse: string): Promise<{ hasCommands: boolean; results: string[] }> => {
    const commands: Array<{ action: string; params: Record<string, any> }> = [];
    const results: string[] = [];
    
    // Pattern 1: "add X to graph" or "adding X to graph"
    const addMatches = aiResponse.matchAll(/(?:add|adding|added)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)(?:\s+to\s+(?:the\s+)?graph|'s|\.|,|$)/gi);
    for (const match of addMatches) {
      const name = match[1].trim();
      if (name && name.length > 2 && name.length < 50) {
        commands.push({ action: 'add', params: { name } });
      }
    }
    
    // Pattern 2: "show X" or "showing X"
    const showMatches = aiResponse.matchAll(/(?:show|showing|displayed?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)(?:'s|\.|,|$)/gi);
    for (const match of showMatches) {
      const name = match[1].trim();
      if (name && name.length > 2 && name.length < 50) {
        commands.push({ action: 'add', params: { name } });
      }
    }
    
    // Pattern 3: "expand relationship between X and Y"
    const expandMatches = aiResponse.matchAll(/(?:expand|expanded|expanding)\s+(?:relationship|relation|connection)?\s*(?:between)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\s+and\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)(?:\.|,|$)/gi);
    for (const match of expandMatches) {
      const person1 = match[1].trim();
      const person2 = match[2].trim();
      if (person1 && person2) {
        commands.push({ action: 'expand', params: { person1, person2 } });
      }
    }
    
    // Pattern 4: "search for X" or "searching X"
    const searchMatches = aiResponse.matchAll(/(?:search|searching|searched)\s+(?:for\s+)?([a-z]+(?:\s+[a-z]+)*?)(?:\.|,|$)/gi);
    for (const match of searchMatches) {
      const term = match[1].trim();
      if (term && term.length > 2) {
        commands.push({ action: 'search', params: { term } });
      }
    }
    
    // Execute all detected commands
    for (const command of commands) {
      try {
        const result = await executeCommand(command);
        results.push(result);
      } catch (error) {
        console.error('Failed to execute AI command:', command, error);
      }
    }
    
    return { hasCommands: commands.length > 0, results };
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
      
      case 'random': {
        if (!onAddNode || !allNodes) {
          return '⚠️ Add node capability not available';
        }
        
        const count = params.count || 5;
        
        // Randomly select nodes
        const shuffled = [...allNodes].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, count);
        
        // Add all selected nodes
        selected.forEach(node => onAddNode(node));
        
        const names = selected.map(n => n.name_en).join(', ');
        
        return `✅ Added ${count} random Sahabah to the graph:\n\n${names}\n\n💡 Their relationships will appear as connecting lines automatically!`;
      }
      
      case 'search': {
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
      }
        
      case 'view': {
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
      }
        
      case 'zoom': {
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
      }
        
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
        
        // Fuzzy search: match by name parts (handles titles like "as-Siddiq", "al-Farooq")
        const findNodeFuzzy = (searchTerm: string) => {
          // First try exact match
          let node = allNodes.find(n => 
            n.name_en.toLowerCase() === searchTerm ||
            n.name_ar === searchTerm
          );
          if (node) return node;
          
          // Then try partial match (any part of the name)
          node = allNodes.find(n => 
            n.name_en.toLowerCase().includes(searchTerm) ||
            n.name_ar?.includes(searchTerm)
          );
          if (node) return node;
          
          // Finally try word-by-word match (handles "Abu Bakr as-Siddiq" → "Abu Bakr")
          const searchWords = searchTerm.split(/\s+/);
          return allNodes.find(n => {
            const nameWords = n.name_en.toLowerCase().split(/\s+/);
            return searchWords.some(sw => nameWords.includes(sw)) &&
                   searchWords.length >= 2; // At least 2 words match
          });
        };
        
        const node1 = findNodeFuzzy(searchName1);
        const node2 = findNodeFuzzy(searchName2);
        
        // If both not found, suggest alternatives
        if (!node1 && !node2) {
          const similar1 = allNodes.filter(n => 
            searchName1.split(/\s+/).some((word: string) => n.name_en.toLowerCase().includes(word))
          ).slice(0, 2);
          const similar2 = allNodes.filter(n => 
            searchName2.split(/\s+/).some((word: string) => n.name_en.toLowerCase().includes(word))
          ).slice(0, 2);
          
          if (similar1.length > 0 && similar2.length > 0) {
            // Store suggestion for "yes" confirmation
            setLastSuggestion({
              action: 'expand',
              params: { person1: similar1[0].name_en, person2: similar2[0].name_en }
            });
            return `❌ Neither "${person1}" nor "${person2}" found exactly.\n\nDid you mean: **${similar1[0].name_en}** and **${similar2[0].name_en}**?\n\nType "yes" to expand their relationship.`;
          }
          return `❌ Neither "${person1}" nor "${person2}" found in database`;
        }
        
        // If one not found, suggest alternatives
        if (!node1) {
          const similar = allNodes.filter(n => 
            searchName1.split(/\s+/).some((word: string) => n.name_en.toLowerCase().includes(word))
          ).slice(0, 3);
          if (similar.length > 0) {
            setLastSuggestion({
              action: 'expand',
              params: { person1: similar[0].name_en, person2: node2!.name_en }
            });
            return `❌ "${person1}" not found.\n\nDid you mean: **${similar.map(s => s.name_en).join(', ')}**?\n\nType "yes" to use ${similar[0].name_en}.`;
          }
          return `❌ "${person1}" not found in database`;
        }
        
        if (!node2) {
          const similar = allNodes.filter(n => 
            searchName2.split(/\s+/).some((word: string) => n.name_en.toLowerCase().includes(word))
          ).slice(0, 3);
          if (similar.length > 0) {
            setLastSuggestion({
              action: 'expand',
              params: { person1: node1!.name_en, person2: similar[0].name_en }
            });
            return `❌ "${person2}" not found.\n\nDid you mean: **${similar.map(s => s.name_en).join(', ')}**?\n\nType "yes" to use ${similar[0].name_en}.`;
          }
          return `❌ "${person2}" not found in database`;
        }
        
        // Clear last suggestion since we found both
        setLastSuggestion(null);
        
        // Add both nodes
        onAddNode(node1);
        onAddNode(node2);
        
        // Highlight and focus on the relationship edges
        setTimeout(() => {
          if (cyRef?.current) {
            const cy = cyRef.current;
            
            // Find nodes by ID
            const cyNode1 = cy.getElementById(node1.id);
            const cyNode2 = cy.getElementById(node2.id);
            
            if (cyNode1.length > 0 && cyNode2.length > 0) {
              // Find all edges between these two nodes (both directions)
              const edges = cy.edges().filter((edge: any) => {
                const source = edge.source().id();
                const target = edge.target().id();
                return (source === node1.id && target === node2.id) ||
                       (source === node2.id && target === node1.id);
              });
              
              if (edges.length > 0) {
                // Highlight the nodes and their connecting edges
                cy.elements().removeClass('highlighted');
                cyNode1.addClass('highlighted');
                cyNode2.addClass('highlighted');
                edges.addClass('highlighted');
                
                // Temporarily emphasize the edges
                edges.style({
                  'line-color': '#ff6b6b',
                  'width': 4,
                  'z-index': 999
                });
                
                // Focus view on these nodes
                cy.animate({
                  fit: {
                    eles: cyNode1.union(cyNode2).union(edges),
                    padding: 100
                  },
                  duration: 500
                });
                
                // Reset edge styling after 3 seconds
                setTimeout(() => {
                  edges.removeStyle('line-color width z-index');
                }, 3000);
              } else {
                // No direct edges found, just focus on the nodes
                cy.animate({
                  fit: {
                    eles: cyNode1.union(cyNode2),
                    padding: 100
                  },
                  duration: 500
                });
              }
            }
          }
        }, 300); // Small delay to ensure nodes are rendered
        
        return `✅ Added ${node1.name_en} and ${node2.name_en} to the graph.

🔍 Highlighting their relationships with connecting lines:
• Family relationships
• Shared battles
• Companionship connections

The graph will zoom to show their connections!`;
      }
      
      case 'compare': {
        // Compare two people side-by-side
        const { person1, person2 } = params;
        if (!person1 || !person2 || !allNodes) {
          return '⚠️ Please specify two people to compare';
        }
        
        const node1 = allNodes.find(n => 
          n.name_en.toLowerCase().includes(person1.toLowerCase())
        );
        const node2 = allNodes.find(n => 
          n.name_en.toLowerCase().includes(person2.toLowerCase())
        );
        
        if (!node1 || !node2) {
          return `❌ Could not find ${!node1 ? person1 : person2} in database`;
        }
        
        return `📊 **Comparison: ${node1.name_en} vs ${node2.name_en}**

**${node1.name_en}**
- Prominence: ${node1.prominence}
- Tribe: ${node1.tribe || 'Unknown'}
- Birth: ${node1.birth_year_hijri || 'Unknown'} AH
- Death: ${node1.death_year_hijri || 'Unknown'} AH
${node1.biography_short ? `\n${node1.biography_short.substring(0, 200)}...` : ''}

**${node2.name_en}**
- Prominence: ${node2.prominence}
- Tribe: ${node2.tribe || 'Unknown'}
- Birth: ${node2.birth_year_hijri || 'Unknown'} AH
- Death: ${node2.death_year_hijri || 'Unknown'} AH
${node2.biography_short ? `\n${node2.biography_short.substring(0, 200)}...` : ''}

💡 Try: "Expand ${node1.name_en} and ${node2.name_en}" to see their connections`;
      }
      
      case 'stats': {
        if (!allNodes) return '❌ No data available';
        
        const total = allNodes.length;
        const male = allNodes.filter(n => n.gender === 'male').length;
        const female = allNodes.filter(n => n.gender === 'female').length;
        const prophets = allNodes.filter(n => n.is_prophet).length;
        const ashara = allNodes.filter(n => n.prominence === 'ASHARA_MUBASHSHARA').length;
        const withBattles = allNodes.filter(n => n.has_battles).length;
        const tribes = [...new Set(allNodes.filter(n => n.tribe).map(n => n.tribe))];
        
        return `📊 **SahabahGraph Statistics**

**People**
- Total: ${total}
- Male: ${male} | Female: ${female}
- Prophets: ${prophets}
- Ashara Mubashshara: ${ashara}

**Participation**
- Fought in battles: ${withBattles}
- Unique tribes: ${tribes.length}

**Graph View**
- Currently viewing: ${currentView}
- Selected nodes: ${selectedNodes.length}
- Total relationships: ${graphStats?.totalRelationships || 'N/A'}`;
      }
      
      case 'list': {
        if (!allNodes) return '❌ No data available';
        
        const category = params.category;
        let result;
        
        switch (category) {
          case 'tribes': {
            const tribes = [...new Set(allNodes.filter(n => n.tribe).map(n => n.tribe))];
            result = `🏕️ **Tribes (${tribes.length} total)**\n\n${tribes.slice(0, 20).join('\n')}`;
            if (tribes.length > 20) result += `\n\n...and ${tribes.length - 20} more`;
            break;
          }
          case 'clans': {
            const clans = [...new Set(allNodes.filter(n => n.clan).map(n => n.clan))];
            result = `🏠 **Clans (${clans.length} total)**\n\n${clans.slice(0, 20).join('\n')}`;
            if (clans.length > 20) result += `\n\n...and ${clans.length - 20} more`;
            break;
          }
          case 'prominent': {
            const prominent = allNodes.filter(n => 
              n.prominence === 'ASHARA_MUBASHSHARA' || 
              n.prominence === 'MAJOR' ||
              n.is_prophet
            ).map(n => `${n.name_en} - ${n.prominence}`);
            result = `⭐ **Prominent Figures (${prominent.length} total)**\n\n${prominent.slice(0, 15).join('\n')}`;
            break;
          }
          default:
            result = '⚠️ Unknown category. Try: tribes, clans, or prominent';
        }
        
        return result;
      }
      
      case 'family': {
        // Add a person and their family members (optionally filtered by relationship type)
        if (!onAddNode || !allNodes || !allRelationships) {
          return '⚠️ Family graph capability not available';
        }
        
        const searchName = params.name.toLowerCase();
        const relationshipType = params.relationshipType; // 'parents', 'children', 'spouses', 'siblings', or undefined for all
        
        const mainPerson = allNodes.find(n => 
          n.name_en.toLowerCase().includes(searchName) ||
          n.name_ar?.includes(params.name)
        );
        
        if (!mainPerson) {
          return `❌ Could not find "${params.name}" in database`;
        }
        
        // Add the main person first
        onAddNode(mainPerson);
        
        // Find all family relationships from the data
        const mainPersonId = typeof mainPerson.id === 'string' ? parseInt(mainPerson.id, 10) : mainPerson.id;
        const familyMembers: Sahabi[] = [];
        const familyMemberIds = new Set<number>();
        
        // Query allRelationships for family connections
        allRelationships.forEach((rel) => {
          // Check if this relationship involves the main person
          const relSource = typeof rel.source === 'string' ? parseInt(rel.source, 10) : rel.source;
          const relTarget = typeof rel.target === 'string' ? parseInt(rel.target, 10) : rel.target;
          
          const isMainPersonSource = relSource === mainPersonId;
          const isMainPersonTarget = relTarget === mainPersonId;
          
          if (!isMainPersonSource && !isMainPersonTarget) {
            return; // Not related to main person
          }
          
          // Check if it's a family relationship and matches the filter (if specified)
          let isFamilyRelation = false;
          
          if (relationshipType) {
            // Filter by specific relationship type
            switch (relationshipType) {
              case 'parents':
                // Main person is the child (target), related person is parent (source)
                isFamilyRelation = rel.type === 'PARENT_OF' && isMainPersonTarget;
                break;
              case 'children':
                // Main person is the parent (source), related person is child (target)
                isFamilyRelation = rel.type === 'PARENT_OF' && isMainPersonSource;
                break;
              case 'spouses':
                isFamilyRelation = rel.type === 'SPOUSE_OF';
                break;
              case 'siblings':
                isFamilyRelation = rel.type === 'SIBLING_OF';
                break;
            }
          } else {
            // No filter - include all family relationships
            isFamilyRelation = 
              rel.type === 'PARENT_OF' ||
              rel.type === 'SPOUSE_OF' ||
              rel.type === 'SIBLING_OF' ||
              rel.type === 'CHILD_OF' ||
              rel.category === 'family';
          }
          
          if (isFamilyRelation) {
            // Get the ID of the related person
            const relatedPersonId = isMainPersonSource ? relTarget : relSource;
            
            if (!familyMemberIds.has(relatedPersonId)) {
              familyMemberIds.add(relatedPersonId);
              
              // Find the person in allNodes
              const familyMember = allNodes.find(n => {
                const nodeId = typeof n.id === 'string' ? parseInt(n.id, 10) : n.id;
                return nodeId === relatedPersonId;
              });
              
              if (familyMember) {
                familyMembers.push(familyMember);
              }
            }
          }
        });
        
        // Add all family members to the graph
        familyMembers.forEach(member => onAddNode(member));
        
        // Wait for nodes to be added, then add edges and highlight the family network
        if (cyRef?.current && familyMembers.length > 0) {
          setTimeout(() => {
            try {
              const cy = cyRef.current;
              const allFamilyIds = [mainPerson.id.toString(), ...familyMembers.map(m => m.id.toString())];
              const familyNodes = cy.nodes().filter((node: any) => 
                allFamilyIds.includes(node.id().toString())
              );
              
              // Add edge elements for family relationships that aren't already in the graph
              const edgesToAdd: any[] = [];
              const existingEdgeIds = new Set();
              
              // Get existing edges
              cy.edges().forEach((edge: any) => {
                existingEdgeIds.add(`${edge.data('source')}-${edge.data('target')}`);
                existingEdgeIds.add(`${edge.data('target')}-${edge.data('source')}`);
              });
              
              // Find family relationships that need edges (apply same filter as node collection)
              allRelationships.forEach((rel) => {
                const relSource = typeof rel.source === 'string' ? parseInt(rel.source, 10) : rel.source;
                const relTarget = typeof rel.target === 'string' ? parseInt(rel.target, 10) : rel.target;
                
                const isMainPersonSource = relSource === mainPersonId;
                const isMainPersonTarget = relTarget === mainPersonId;
                
                if (!isMainPersonSource && !isMainPersonTarget) {
                  return; // Not related to main person
                }
                
                // Apply same relationship type filter as node collection
                let isFamilyRelation = false;
                
                if (relationshipType) {
                  // Filter by specific relationship type
                  switch (relationshipType) {
                    case 'parents':
                      isFamilyRelation = rel.type === 'PARENT_OF' && isMainPersonTarget;
                      break;
                    case 'children':
                      isFamilyRelation = rel.type === 'PARENT_OF' && isMainPersonSource;
                      break;
                    case 'spouses':
                      isFamilyRelation = rel.type === 'SPOUSE_OF';
                      break;
                    case 'siblings':
                      isFamilyRelation = rel.type === 'SIBLING_OF';
                      break;
                  }
                } else {
                  // No filter - include all family relationships
                  isFamilyRelation = 
                    rel.type === 'PARENT_OF' ||
                    rel.type === 'SPOUSE_OF' ||
                    rel.type === 'SIBLING_OF' ||
                    rel.type === 'CHILD_OF' ||
                    rel.category === 'family';
                }
                
                if (isFamilyRelation) {
                  const edgeId = `${rel.source}-${rel.target}`;
                  if (!existingEdgeIds.has(edgeId)) {
                    edgesToAdd.push({
                      group: 'edges',
                      data: {
                        id: edgeId,
                        source: rel.source.toString(),
                        target: rel.target.toString(),
                        relationship_type: rel.type,
                        category: rel.category || 'family',
                        label: rel.type
                      }
                    });
                  }
                }
              });
              
              // Add new edges to the graph
              if (edgesToAdd.length > 0) {
                cy.add(edgesToAdd);
              }
              
              // Find all edges connecting the main person to their family members
              const mainNode = cy.getElementById(mainPerson.id.toString());
              const familyEdges = mainNode.connectedEdges().filter((edge: any) => {
                const sourceId = edge.source().id();
                const targetId = edge.target().id();
                // Check if edge connects main person to a family member
                return (sourceId === mainPerson.id.toString() && allFamilyIds.includes(targetId)) ||
                       (targetId === mainPerson.id.toString() && allFamilyIds.includes(sourceId));
              });
              
              if (familyNodes.length > 0) {
                // Clear any previous highlights
                cy.elements().removeClass('highlighted');
                
                // Highlight family nodes
                familyNodes.addClass('highlighted');
                
                // Highlight and style family edges in green (for family relationships)
                if (familyEdges.length > 0) {
                  familyEdges.addClass('highlighted');
                  familyEdges.style({
                    'line-color': '#4caf50', // Green for family relationships
                    'width': 4,
                    'z-index': 999,
                    'opacity': 1
                  });
                  
                  // Zoom to show family network including edges
                  cy.animate({
                    fit: {
                      eles: familyNodes.union(familyEdges),
                      padding: 80
                    },
                    duration: 500
                  });
                  
                  // Remove edge highlighting after 5 seconds
                  setTimeout(() => {
                    familyEdges.removeStyle('line-color width z-index opacity');
                    cy.elements().removeClass('highlighted');
                  }, 5000);
                } else {
                  // No edges found, just zoom to nodes
                  cy.animate({
                    fit: {
                      eles: familyNodes,
                      padding: 80
                    },
                    duration: 500
                  });
                }
              }
            } catch (error) {
              console.error('Error focusing on family:', error);
            }
          }, 400); // Slightly longer delay to ensure nodes are fully added
        }
        
        if (familyMembers.length === 0) {
          const relationshipLabel = relationshipType 
            ? relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1)
            : 'family members';
            
          return `✅ Added **${mainPerson.name_en}** to the graph.

⚠️ No ${relationshipLabel.toLowerCase()} found in the database. This could mean:
- ${relationshipLabel} relationships haven't been added to the database yet
- The person's ${relationshipLabel.toLowerCase()} ${relationshipLabel === 'Children' ? "aren't" : "isn't"} in the current dataset

${mainPerson.has_parents || mainPerson.has_spouses || mainPerson.has_children ? '\n💡 Database indicates family exists but relationships may not be connected yet.' : ''}`;
        }
        
        // Build relationship type label
        let relationshipLabel: string;
        if (relationshipType) {
          relationshipLabel = relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1);
        } else {
          // Build list of all included types for general family expansion
          const familyTypes: string[] = [];
          if (mainPerson.has_parents) familyTypes.push('Parents');
          if (mainPerson.has_spouses) familyTypes.push('Spouses');
          if (mainPerson.has_children) familyTypes.push('Children');
          if (mainPerson.has_siblings) familyTypes.push('Siblings');
          relationshipLabel = familyTypes.length > 0 ? familyTypes.join(', ') : 'Family Tree';
        }
        
        return `✅ **${relationshipLabel} Expanded for ${mainPerson.name_en}**

📊 Added ${familyMembers.length} ${relationshipType ? relationshipType : 'family member'}${familyMembers.length !== 1 ? 's' : ''}:
${familyMembers.slice(0, 10).map(m => `• ${m.name_en}`).join('\n')}${familyMembers.length > 10 ? `\n• ...and ${familyMembers.length - 10} more` : ''}

🔗 Relationship type${relationshipType ? '' : 's'}: ${relationshipLabel}

The graph now shows all ${relationshipType ? relationshipType : 'family'} connections with colored lines! 🎨`;
      }
      
      case 'filter':
      case 'path': {
        // These need more complex graph operations - suggest using questions instead
        return `ℹ️ This feature requires graph analysis. Try asking me a question instead, like:
- "Who from Banu Hashim participated in battles?"
- "How are Abu Bakr and Umar related?"
- "What battles did Ali participate in?"`;
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
        // It's a question - ask the AI with RAG context
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
        
        // Show "thinking..." indicator
        const thinkingMessage: Message = {
          role: 'assistant',
          content: 'Thinking...',
          timestamp: new Date(),
          isThinking: true,
        };
        setMessages((prev) => [...prev, thinkingMessage]);
        
        // ✨ RAG: Retrieve relevant context from database
        const context = retrieveContext(currentInput);
        
        let response: string;
        
        if (aiMode === 'chrome') {
          // Chrome AI - simple prompt with RAG context
          const enhancedPrompt = `${context}

User question: "${currentInput}"

Answer this question about early Islamic history. Be informative and respectful. 
Use the context provided above if relevant.

IMPORTANT: If the user wants to see someone on the graph or explore relationships, 
explicitly state what you're doing using these formats:
- "Let me add Abu Bakr to the graph" or "Adding Abu Bakr to graph"
- "Let me show Umar" or "Showing Umar"
- "Let me expand relationship between Ali and Uthman"
- "Let me search for battles"

These actions will be automatically executed when you mention them.`;
          response = await aiSession.prompt(enhancedPrompt);
        } else if (aiMode === 'transformers' && transformersHelper) {
          // Transformers.js - system message + RAG context
          const systemMessage = `You are a helpful assistant for SahabahGraph, a tool to explore early Islamic history. 
You have access to a database of Sahabah (companions of Prophet Muhammad PBUH).

${context}

Be informative, respectful, and concise.

IMPORTANT: When users ask to see someone or explore relationships, explicitly state your actions:
- "Adding Abu Bakr to graph" or "Let me add Abu Bakr"
- "Showing Umar" or "Let me show Umar"  
- "Expanding relationship between Ali and Uthman"
- "Searching battles" or "Let me search for battles"

These actions will be automatically executed. After stating the action, provide helpful context about the person or topic.`;

          const promptMessages = [
            { role: 'system', content: systemMessage },
            ...messages.filter(m => m.role !== 'system').slice(-4).map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: currentInput }
          ];
          console.log('🔧 Component: Calling transformersHelper.prompt with:', promptMessages);
          response = await transformersHelper.prompt(promptMessages);
          console.log('🔧 Component: Got response:', response);
        } else {
          throw new Error('No AI mode selected or helper not available');
        }
        
        // Extract and execute any commands from AI response
        const { hasCommands, results } = await extractAndExecuteCommands(response);
        
        console.log('🔧 Component: Creating AI message');
        const aiMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        
        // If commands were executed, add their results as separate messages
        if (hasCommands && results.length > 0) {
          const commandResults = results.map(result => ({
            role: 'assistant' as const,
            content: result,
            timestamp: new Date(),
            isCommand: true,
            commandResult: result,
          }));
          
          // Remove thinking message and add AI response + command results
          console.log('🔧 Component: Updating messages with AI response and command results');
          setMessages((prev) => prev.filter(m => !m.isThinking).concat(aiMessage, ...commandResults));
        } else {
          // Remove thinking message and add actual response
          console.log('🔧 Component: Updating messages, removing thinking indicator');
          setMessages((prev) => prev.filter(m => !m.isThinking).concat(aiMessage));
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      // Remove thinking message and add error message
      setMessages((prev) => prev.filter(m => !m.isThinking).concat(errorMessage));
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

  // Don't show the FAB if BOTH AI options are unavailable
  if (isChromeAIAvailable === false && isTransformersAvailable === false) {
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
                label={aiMode === 'chrome' ? 'Gemini Nano' : aiMode === 'transformers' ? backend.toUpperCase() : 'Starting...'}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'inherit',
                  fontSize: '0.7rem',
                }}
              />
              {aiMode === 'transformers' && (
                <Tooltip title="Switch AI backend: WebGPU (fast, more memory, may auto-fallback to WASM if OOM) or WASM (slower, less memory, more stable)">
                  <ToggleButtonGroup
                    value={backend}
                    exclusive
                    onChange={async (_, newBackend) => {
                      if (newBackend !== null && transformersHelper) {
                        console.log('🔧 Component: Backend changed to', newBackend);
                        setBackend(newBackend);
                        // Clear session and messages
                        setAISession(null);
                        setMessages([]);
                        setDownloadProgress(0);
                        
                        // Reinitialize with new backend
                        await transformersHelper.init(
                          (progress: any) => {
                            setDownloadProgress(progress.progress || 0);
                          },
                          () => {
                            console.log('🔧 Component: Setting aiSession after backend switch');
                            setAISession(transformersHelper);
                            setMessages([
                              {
                                role: 'assistant',
                                content: `Assalamu Alaikum! 🕌 I'm your AI assistant for exploring SahabahGraph. I can help you discover relationships between the Sahabah (companions of Prophet Muhammad ﷺ), search by name, tribe, or family connections, and visualize their biographical data. Ask me about specific Sahabah, request family trees, or use commands like "Add random sahaba" or "Compare Ali and Uthman". How may I assist you today?`,
                                timestamp: new Date(),
                              },
                            ]);
                          },
                          (error: string, suggestFallback?: boolean) => {
                            console.error('🔧 Component: Backend switch error:', error, 'suggestFallback:', suggestFallback, 'newBackend:', newBackend);
                            
                            // If WebGPU failed with OOM, auto-switch to WASM
                            if (suggestFallback && newBackend === 'webgpu') {
                              console.log('🔧 Component: WebGPU OOM on switch, falling back to WASM');
                              setBackend('wasm');
                              // Retry with WASM
                              transformersHelper.init(
                                (progress: any) => {
                                  setDownloadProgress(progress.progress || 0);
                                },
                                () => {
                                  setAISession(transformersHelper);
                                  setMessages([
                                    {
                                      role: 'assistant',
                                      content: `Assalamu Alaikum! 🕌 I'm your AI assistant for exploring SahabahGraph (WASM mode - switched automatically due to memory constraints). I can help you discover relationships between the Sahabah (companions of Prophet Muhammad ﷺ), search by name, tribe, or family connections, and visualize their biographical data. Ask me about specific Sahabah, request family trees, or use commands like "Add random sahaba" or "Compare Ali and Uthman". How may I assist you today?`,
                                      timestamp: new Date(),
                                    },
                                  ]);
                                },
                                (retryError: string) => {
                                  console.error('WASM fallback also failed:', retryError);
                                  // Show error message to user
                                  setMessages([
                                    {
                                      role: 'assistant',
                                      content: `❌ Unable to load AI model due to insufficient memory.

💡 **You can still use command-based features:**
- "add random sahaba"
- "compare Ali and Uthman"
- "list tribes"

Try closing other browser tabs to free up memory and refresh the page.`,
                                      timestamp: new Date(),
                                    },
                                  ]);
                                },
                                'wasm',
                                true,
                                selectedModel // Pass model to WASM fallback
                              );
                            }
                            // If WASM fails directly
                            else if (newBackend === 'wasm' && error.includes('bad_alloc')) {
                              console.error('🔧 Component: WASM failed with OOM');
                              setMessages([
                                {
                                  role: 'assistant',
                                  content: `❌ Unable to load AI model due to insufficient memory.

💡 **You can still use command-based features:**
- "add random sahaba"
- "compare Ali and Uthman"  
- "list tribes"

Try closing other browser tabs to free up memory and refresh the page.`,
                                  timestamp: new Date(),
                                },
                              ]);
                            }
                          },
                          newBackend,
                          true, // Force reload for backend switch
                          selectedModel // Pass current model
                        );
                      }
                    }}
                    size="small"
                    sx={{ 
                      height: 24,
                      '& .MuiToggleButton-root': {
                        px: 1,
                        py: 0.5,
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ToggleButton value="wasm">WASM</ToggleButton>
                    <ToggleButton value="webgpu">GPU</ToggleButton>
                  </ToggleButtonGroup>
                </Tooltip>
              )}
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
            {(isChromeAIAvailable === null && isTransformersAvailable === null) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            
            {/* Download progress for Transformers.js */}
            {aiMode === 'transformers' && downloadProgress > 0 && downloadProgress < 100 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Downloading AI model... {downloadProgress.toFixed(0)}%
                </Typography>
                <LinearProgress variant="determinate" value={downloadProgress} />
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
                      ...(msg.isThinking && {
                        fontStyle: 'italic',
                        opacity: 0.8,
                        animation: 'pulse 1.5s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 0.6 },
                          '50%': { opacity: 1 },
                        },
                      }),
                    }}
                  >
                    {msg.isThinking ? (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AIIcon sx={{ fontSize: 16 }} />
                        Thinking
                        <Box
                          component="span"
                          sx={{
                            animation: 'dots 1.4s steps(4, end) infinite',
                            '@keyframes dots': {
                              '0%, 20%': { content: '"."' },
                              '40%': { content: '".."' },
                              '60%, 100%': { content: '"..."' },
                            },
                            '&::after': {
                              content: '"..."',
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      msg.content
                    )}
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
            {/* Model Selector - Only show for Transformers mode */}
            {aiMode === 'transformers' && (
              <Box sx={{ mb: 1.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="model-select-label">AI Model</InputLabel>
                  <Select
                    labelId="model-select-label"
                    value={selectedModel}
                    label="AI Model"
                    onChange={async (e) => {
                      const newModel = e.target.value;
                      if (newModel && transformersHelper) {
                        console.log('🔧 Component: Model changed to', newModel);
                        setSelectedModel(newModel);
                        // Clear session and messages
                        setAISession(null);
                        setMessages([]);
                        setDownloadProgress(0);
                        
                        const modelInfo = AVAILABLE_MODELS.find(m => m.id === newModel);
                        
                        // Reinitialize with new model
                        await transformersHelper.init(
                          (progress: any) => {
                            setDownloadProgress(progress.progress || 0);
                          },
                          () => {
                            console.log('🔧 Component: Setting aiSession after model switch');
                            setAISession(transformersHelper);
                            setMessages([
                              {
                                role: 'assistant',
                                content: `Assalamu Alaikum! 🕌 Switched to **${modelInfo?.name}**. How may I assist you today?`,
                                timestamp: new Date(),
                              },
                            ]);
                          },
                          (error: string) => {
                            console.error('🔧 Component: Model switch error:', error);
                            setMessages([
                              {
                                role: 'assistant',
                                content: `❌ Failed to load ${modelInfo?.name}. Error: ${error}`,
                                timestamp: new Date(),
                              },
                            ]);
                          },
                          backend,
                          true, // Force reload for model switch
                          newModel // Pass new model
                        );
                      }
                    }}
                  >
                    {AVAILABLE_MODELS.map(model => (
                      <MenuItem key={model.id} value={model.id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {model.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {model.description} • {model.size}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

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
              Try: "Add few random sahaba", "Add relation with Ali and Uthman", "Compare Abu Bakr and Umar", "List tribes"
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default AIChatPanel;
