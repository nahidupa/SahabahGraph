import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AIChatPanel from './AIChatPanel';

// Mock RAG Engine
vi.mock('../../utils/ragEngine', () => ({
  ragEngine: {
    getContext: vi.fn().mockResolvedValue(''),
    loadData: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock Transformers AI Helper
const mockTransformersPrompt = vi.fn();
const mockTransformersInit = vi.fn();
const mockTransformersDestroy = vi.fn();
const mockCheckWebGPUSupport = vi.fn().mockResolvedValue(false);

vi.mock('../../utils/transformersAIHelper', () => {
  return {
    TransformersAIHelper: vi.fn().mockImplementation(function(this: any) {
      this.checkWebGPUSupport = mockCheckWebGPUSupport;
      this.init = mockTransformersInit;
      this.prompt = mockTransformersPrompt;
      this.destroy = mockTransformersDestroy;
      return this;
    }),
  };
});

// Mock Chrome AI API
const mockPrompt = vi.fn();
const mockDestroy = vi.fn();
const mockCreate = vi.fn(() => Promise.resolve({
  prompt: mockPrompt,
  destroy: mockDestroy,
} as any));

describe('AIChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).ai = undefined;
    (window as any).LanguageModel = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  it('should render FAB when Chrome AI is available', async () => {
    (window as any).ai = {
      languageModel: {
        create: mockCreate,
        capabilities: vi.fn(() => Promise.resolve({ available: 'readily' })),
      },
    };

    render(<AIChatPanel />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ai-chat/i })).toBeInTheDocument();
    });
  });

  it('should open chat panel when FAB is clicked', async () => {
    (window as any).ai = {
      languageModel: {
        create: mockCreate,
        capabilities: vi.fn(() => Promise.resolve({ available: 'readily' })),
      },
    };

    render(<AIChatPanel />);
    
    const fab = await screen.findByRole('button', { name: /ai-chat/i });
    fireEvent.click(fab);

    await waitFor(() => {
      // Use queryAllByText to avoid multiple elements error if necessary, but here we just check for presence
      expect(screen.getAllByText(/AI Assistant/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Gemini Nano/i).length).toBeGreaterThan(0);
    });
  });

  it('should display welcome message when chat opens', async () => {
    (window as any).ai = {
      languageModel: {
        create: mockCreate,
        capabilities: vi.fn(() => Promise.resolve({ available: 'readily' })),
      },
    };

    render(<AIChatPanel />);
    
    const fab = await screen.findByRole('button', { name: /ai-chat/i });
    fireEvent.click(fab);

    await screen.findByText(/Hello! I'm your AI assistant powered by Chrome/i);
  });

  it('should send message and display response', async () => {
    mockPrompt.mockResolvedValue('This is a test response from AI');

    (window as any).ai = {
      languageModel: {
        create: mockCreate,
        capabilities: vi.fn(() => Promise.resolve({ available: 'readily' })),
      },
    };

    render(<AIChatPanel />);
    
    const fab = await screen.findByRole('button', { name: /ai-chat/i });
    fireEvent.click(fab);

    const input = await screen.findByPlaceholderText(/Ask me anything/i);
    fireEvent.change(input, { target: { value: 'Who was Abu Bakr?' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalled();
      expect(screen.getByText(/This is a test response from AI/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Who was Abu Bakr?')).toBeInTheDocument();
  });

  it('should close chat panel when close button is clicked', async () => {
    (window as any).ai = {
      languageModel: {
        create: mockCreate,
        capabilities: vi.fn(() => Promise.resolve({ available: 'readily' })),
      },
    };

    render(<AIChatPanel />);
    
    const fab = await screen.findByRole('button', { name: /ai-chat/i });
    fireEvent.click(fab);

    const closeButton = await screen.findByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
  });
});
