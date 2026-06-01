# Chrome AI Integration Guide

## Overview

SahabahGraph now includes an AI-powered chat assistant using Chrome's built-in Gemini Nano model. This allows users to ask questions and get help exploring the Sahabah graph without needing external API keys or internet connectivity.

## Features

- 🤖 **Local AI Processing**: All queries are processed locally using Chrome's built-in Gemini Nano
- 💬 **Floating Chat Panel**: Easy-to-access chat interface that doesn't obstruct the main view
- 🎯 **Context-Aware**: AI assistant understands the SahabahGraph domain
- 🔒 **Privacy-First**: No data leaves your browser
- ⚡ **Fast Responses**: Local processing means instant responses

## Prerequisites

To use the AI chat feature, you need:

1. **Chrome Browser** version 127 or later
2. **Chrome AI enabled** (see setup instructions below)

## Enabling Chrome AI

### Step 1: Check Chrome Version

```bash
# Visit chrome://version in your browser
# Ensure you have Chrome 127 or later
```

### Step 2: Enable AI Features

1. Open Chrome and navigate to: `chrome://flags/#optimization-guide-on-device-model`
2. Set the flag to **"Enabled BypassPerfRequirement"**
3. Navigate to: `chrome://flags/#prompt-api-for-gemini-nano`
4. Set the flag to **"Enabled"**
5. Restart Chrome

### Step 3: Download the Model

1. Open DevTools (F12 or Cmd+Option+I on Mac)
2. Run the following code in the Console:

```javascript
(async () => {
  if (!window.ai || !window.ai.languageModel) {
    console.log("Chrome AI not available");
    return;
  }
  
  const session = await window.ai.languageModel.create();
  console.log("Chrome AI is ready!");
  session.destroy();
})();
```

3. If the model isn't downloaded yet, Chrome will download it automatically (this may take a few minutes depending on your connection)
4. You can check download progress at: `chrome://components/` (look for "Optimization Guide On Device Model")

### Step 4: Verify Installation

1. Start your SahabahGraph application
2. You should see a floating chat button (💬) in the bottom-right corner
3. Click it to open the AI chat panel
4. If the chat panel shows a warning about AI not being available, revisit the setup steps

## Using the AI Chat

### Opening the Chat

- Click the floating chat button in the bottom-right corner
- The chat panel will slide up from the bottom

### Asking Questions

Example questions you can ask:

- "Who was Abu Bakr?"
- "Tell me about the Battle of Badr"
- "How are Umar and Ali related?"
- "What family relationships exist in the graph?"
- "Explain the significance of the Ansar"

### Chat Features

- **Real-time responses**: AI responds instantly
- **Context awareness**: The AI knows it's helping with a Sahabah graph
- **Message history**: Previous messages are preserved during the session
- **Keyboard shortcuts**: Press Enter to send (Shift+Enter for new line)

### Closing the Chat

- Click the X button in the chat header
- Click the floating button again
- Chat history is preserved when you reopen

## Technical Details

### API Usage

The component uses Chrome's Prompt API:

```typescript
// Check availability
const capabilities = await window.ai.languageModel.capabilities();

// Create a session
const session = await window.ai.languageModel.create();

// Send a prompt
const response = await session.prompt("Your question here");

// Clean up
session.destroy();
```

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 127+ | ✅ Full | Native support with flags enabled |
| Chrome 126- | ❌ No | Requires Chrome 127 or later |
| Edge | 🔜 Coming | Based on Chromium, support expected |
| Firefox | ❌ No | Different AI approach |
| Safari | ❌ No | No current plans |

### Fallback Behavior

If Chrome AI is not available:
- The floating chat button won't appear
- No errors will be shown to users
- The application continues to work normally

## Troubleshooting

### "AI not available" message

**Solution:**
1. Verify Chrome version (127+)
2. Check that flags are enabled
3. Ensure the model is downloaded at `chrome://components/`
4. Restart Chrome completely

### Chat button doesn't appear

**Solution:**
1. Check browser console for errors
2. Verify Chrome AI is properly enabled
3. Try refreshing the page

### Slow or no response

**Solution:**
1. First query may be slower as the model initializes
2. Check DevTools console for errors
3. Try closing and reopening the chat panel to reset the session

### Model not downloading

**Solution:**
1. Check your internet connection
2. Visit `chrome://components/` and manually click "Check for update" on "Optimization Guide On Device Model"
3. Ensure you have at least 2GB of free disk space

## Privacy & Security

- ✅ All processing happens locally in your browser
- ✅ No data is sent to external servers
- ✅ No API keys required
- ✅ Works offline after initial model download
- ✅ Session data is cleared when chat is closed

## Limitations

- **Model Size**: Gemini Nano is optimized for on-device use, so it has some limitations compared to cloud models
- **Context Window**: Limited context size (shorter conversation memory)
- **Domain Knowledge**: General knowledge model, may not have deep Sahabah-specific training
- **Browser Only**: Only works in supported Chrome versions

## Future Enhancements

Potential improvements:
- [ ] Graph query generation from natural language
- [ ] Automatic node highlighting based on AI suggestions
- [ ] Voice input support
- [ ] Export chat conversations
- [ ] Custom prompt templates
- [ ] Integration with graph search

## Testing

To test the integration:

```bash
cd frontend
npm test -- src/components/AIChat/AIChatPanel.test.tsx
```

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Verify Chrome AI is properly set up
3. Check browser console for detailed error messages
4. Open an issue on GitHub with:
   - Chrome version
   - Error messages
   - Steps to reproduce

## Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API Origin Trial](https://developer.chrome.com/origintrials/#/view_trial/3835256218527031297)
- [Gemini Nano Information](https://ai.google.dev/gemini-api/docs/models/gemini#gemini-nano)
