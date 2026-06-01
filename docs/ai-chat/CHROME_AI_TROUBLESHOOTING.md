# Chrome AI API Not Found - Troubleshooting Guide

## Problem
- `chrome://on-device-internals/` shows model is "Ready"
- But test page at `http://localhost:5173/test-chrome-ai.html` shows "Chrome AI API not found"
- This means `window.ai` is undefined in your web page

## Root Cause
The on-device model being ready doesn't automatically mean the JavaScript API is exposed. The API requires specific flags AND a complete Chrome restart.

## Solution Steps (Follow in Order)

### Step 1: Verify Flags Are Correctly Set

1. Open **two** tabs:
   - Tab 1: `chrome://flags/#optimization-guide-on-device-model`
   - Tab 2: `chrome://flags/#prompt-api-for-gemini-nano`

2. Verify settings:
   - Tab 1: Must be set to **"Enabled BypassPerfRequirement"** (not just "Enabled")
   - Tab 2: Must be set to **"Enabled"**

3. If you made ANY changes, click "Relaunch" button

### Step 2: Complete Chrome Restart (CRITICAL)

**Important:** Just relaunching is not enough!

**On macOS:**
```bash
# Quit all Chrome windows, then in Terminal:
killall "Google Chrome"

# Wait 3 seconds, then restart Chrome
```

**On Windows:**
```bash
# Close all Chrome windows
# Open Task Manager (Ctrl+Shift+Esc)
# Find "Google Chrome" processes
# End all Chrome processes
# Restart Chrome
```

**On Linux:**
```bash
killall chrome
# or
killall chromium
```

### Step 3: Verify API Availability

1. After restarting Chrome, open DevTools (F12)

2. Run this in Console:
```javascript
console.log('window.ai:', window.ai);
console.log('window.ai.languageModel:', window.ai?.languageModel);
```

3. Expected output:
```javascript
window.ai: {languageModel: {...}}
window.ai.languageModel: {create: ƒ, capabilities: ƒ}
```

4. If still undefined, proceed to Step 4

### Step 4: Use Diagnostic Tool

1. Open: `http://localhost:5173/diagnose-chrome-ai.html`

2. The diagnostic tool will check:
   - ✅ Whether `window.ai` exists
   - ✅ Whether `window.ai.languageModel` exists  
   - ✅ Model availability status
   - ✅ Alternative AI APIs
   - ✅ Browser version and origin info

3. Follow the specific instructions it provides

### Step 5: Manual API Test

Open DevTools Console and run:

```javascript
(async () => {
  console.log('=== Chrome AI Diagnostic ===');
  
  // Check 1: API existence
  if (typeof window.ai === 'undefined') {
    console.error('❌ window.ai is undefined');
    console.log('👉 Flags may not be enabled or Chrome needs restart');
    return;
  }
  console.log('✅ window.ai exists');
  
  // Check 2: languageModel
  if (!window.ai.languageModel) {
    console.error('❌ window.ai.languageModel is undefined');
    console.log('👉 prompt-api-for-gemini-nano flag may not be enabled');
    return;
  }
  console.log('✅ window.ai.languageModel exists');
  
  // Check 3: Capabilities
  try {
    const caps = await window.ai.languageModel.capabilities();
    console.log('✅ Capabilities:', caps);
    
    if (caps.available === 'no') {
      console.error('❌ Model not available on this device');
      return;
    }
    
    if (caps.available === 'after-download') {
      console.warn('⏳ Model is downloading');
      console.log('👉 Check chrome://components/ for progress');
      return;
    }
    
    if (caps.available === 'readily') {
      console.log('✅ Model is ready!');
    }
  } catch (e) {
    console.error('❌ Capabilities check failed:', e);
  }
  
  // Check 4: Create session
  try {
    console.log('Creating session...');
    const session = await window.ai.languageModel.create();
    console.log('✅ Session created successfully');
    
    // Test prompt
    console.log('Testing prompt...');
    const response = await session.prompt('Say "Hello" in one word');
    console.log('✅ AI Response:', response);
    
    session.destroy();
    console.log('✅ All tests passed! Chrome AI is working.');
  } catch (e) {
    console.error('❌ Session test failed:', e);
  }
})();
```

## Common Issues & Solutions

### Issue 1: window.ai is undefined after restart

**Cause:** Flags weren't actually applied or Chrome didn't fully restart

**Solution:**
1. Go to `chrome://flags`
2. Click "Reset all" at the top
3. Set the two flags again (see Step 1)
4. **Completely quit Chrome** (not just close tabs)
5. Restart Chrome

### Issue 2: Model shows ready in chrome://on-device-internals but API fails

**Cause:** Mismatch between model availability and API exposure

**Solution:**
1. Check `chrome://components/`
2. Find "Optimization Guide On Device Model"  
3. If version is 0.0.0.0, click "Check for update"
4. Wait for download to complete
5. Restart Chrome

### Issue 3: "Failed to execute 'create' on 'AILanguageModelFactory'"

**Cause:** Model download not complete or corrupted

**Solution:**
1. Go to `chrome://components/`
2. Find "Optimization Guide On Device Model"
3. Click "Check for update" to force re-download
4. Wait for completion (can take 5-10 minutes)
5. Refresh your page

### Issue 4: Works in DevTools but not in page

**Cause:** Timing issue - page loads before API is ready

**Solution:**
Add this to your page:

```javascript
// Wait for API to be ready
async function waitForChromeAI(timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.ai?.languageModel) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

// Use it
const isReady = await waitForChromeAI();
if (isReady) {
  console.log('Chrome AI is ready!');
} else {
  console.error('Chrome AI not available after timeout');
}
```

## Quick Verification Checklist

Use this after each attempt:

- [ ] Chrome version 127 or later (`chrome://version`)
- [ ] optimization-guide-on-device-model = "Enabled BypassPerfRequirement"
- [ ] prompt-api-for-gemini-nano = "Enabled"  
- [ ] Chrome completely restarted (all processes killed)
- [ ] Model downloaded (`chrome://components/`)
- [ ] Model ready (`chrome://on-device-internals/`)
- [ ] `window.ai` defined in DevTools console
- [ ] `window.ai.languageModel` defined in DevTools console

## Still Not Working?

### Check Chrome Version

Some Chrome versions have bugs. Try:
- Chrome 128 or later (most stable)
- Chrome Canary (latest features)
- Chrome Dev channel

### Check Device Compatibility

On-device AI requires:
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 2-3GB free space for model
- **OS:** 
  - Windows 10/11
  - macOS 11+
  - Linux (Ubuntu 20.04+)

### Enable Verbose Logging

1. Start Chrome with flags:
```bash
# macOS/Linux
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --enable-logging=stderr \
  --v=1

# Windows  
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --enable-logging=stderr ^
  --v=1
```

2. Check console for AI-related logs

## Alternative: Test Without Local Server

If localhost isn't working, try the diagnostic tool directly:

```bash
# Open the file directly in Chrome
open /Users/nahidul.kibria/Documents/gitclone/SahabahGraph/frontend/public/diagnose-chrome-ai.html
```

Or drag the file into Chrome window.

## Next Steps After Fix

Once `window.ai` is available:

1. Test with diagnostic tool: `http://localhost:5173/diagnose-chrome-ai.html`
2. Test with main page: `http://localhost:5173/test-chrome-ai.html`
3. Run your main app: `http://localhost:5173`
4. Open AI chat panel and test queries

## Support Resources

- Chrome AI Documentation: https://developer.chrome.com/docs/ai/built-in
- Chrome on-device AI status: `chrome://on-device-internals/`
- Component status: `chrome://components/`
- Flags: `chrome://flags/`
- Version: `chrome://version/`
