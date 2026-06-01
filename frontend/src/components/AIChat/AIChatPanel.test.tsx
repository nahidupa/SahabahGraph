import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChatPanel from './AIChatPanel';

// Mock Chrome AI API
const mockPrompt = vi.fn();
const mockDestroy = vi.fn();
const mockCreate = vi.fn(() => Promise.resolve({
  prompt: mockPrompt,
  destroy: mockDestroy,
}));

describe('AIChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset window.ai
    delete (window as any).ai;
  });

  it('should not render FAB when Chrome AI is not available', async () => {
    render(<AIChatPanel />);
    
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /ai-chat/i })).not.toBeInTheDocument();
    });
  });

  it('should render FAB when Chrome AI is available', async () => {
    // Mock Chrome AI availability
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
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ai-chat/i })).toBeInTheDocument();
    });

    const fab = screen.getByRole('button', { name: /ai-chat/i });
    fireEvent.click(fab);

    await waitFor(() => {
      expect(screen.getByText(/AI Assistant/i)).toBeInTheDocument();
      expect(screen.getByText(/Gemini Nano/i)).toBeInTheDocument();
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
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ai-chat/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ai-chat/i }));

    await waitFor(() => {
      expect(screen.getByText(/Hello! I'm your AI assistant/i)).toBeInTheDocument();
    });
  });

  it('should send message and display response', async () => {
    mockPrompt.mockResolvedValue('This is a test response from AI');

    (window as any).ai = {
      languageModel: {
        create: mockCreate,
        capabilities: vi.fn(() => Promise.resolve({ available: 'readily' })),
      },
    };

    const user = userEvent.setup();
    render(<AIChatPanel />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ai-chat/i })).toBeInTheDocument();
    });

    // Open chat
    fireEvent.click(screen.getByRole('button', { name: /ai-chat/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask me anything/i)).toBeInTheDocument();
    });

    // Type message
    const input = screen.getByPlaceholderText(/Ask me anything/i);
    await user.type(input, 'Who was Abu Bakr?');

    // Send message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Wait for response
    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalled();
      expect(screen.getByText(/This is a test response from AI/i)).toBeInTheDocument();
    });

    // Check if user message is displayed
    expect(screen.getByText('Who was Abu Bakr?')).toBeInTheDocument();
  });

  it('should handle Enter key to send message', async () => {
    mockPrompt.mockResolvedValue('Test response');

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

    fireEvent.click(screen.getByRole('button', { name: /ai-chat/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask me anything/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalled();
    });
  });

  it('should not send message with Shift+Enter', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: /ai-chat/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask me anything/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', shiftKey: true, charCode: 13 });

    // Should not call prompt
    expect(mockPrompt).not.toHaveBeenCalled();
  });

  it('should display error message when AI fails', async () => {
    mockPrompt.mockRejectedValue(new Error('AI Error'));

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

    fireEvent.click(screen.getByRole('button', { name: /ai-chat/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask me anything/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/i)).toBeInTheDocument();
    });
  });

  it('should close chat panel when close button is clicked', async () => {
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

    // Open chat
    fireEvent.click(screen.getByRole('button', { name: /ai-chat/i }));

    await waitFor(() => {
      expect(screen.getByText(/AI Assistant/i)).toBeInTheDocument();
    });

    // Find and click close button in header
    const closeButtons = screen.getAllByRole('button');
    const headerCloseButton = closeButtons.find(btn => 
      btn.querySelector('[data-testid="CloseIcon"]')
    );
    
    if (headerCloseButton) {
      fireEvent.click(headerCloseButton);
    }

    // Chat should close (panel should not be visible)
    await waitFor(() => {
      // The chat content should become hidden
      const chatHeader = screen.queryByText(/AI Assistant/i);
      if (chatHeader) {
        expect(chatHeader.closest('[class*="MuiPaper"]')).toHaveStyle({ opacity: '0' });
      }
    }, { timeout: 1000 });
  });

  it('should destroy session when chat closes', async () => {
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

    // Open chat
    const fab = screen.getByRole('button', { name: /ai-chat/i });
    fireEvent.click(fab);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    // Close chat
    fireEvent.click(fab);

    await waitFor(() => {
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});
