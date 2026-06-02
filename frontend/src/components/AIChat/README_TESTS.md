# AI Response Parser Test Suite

## Overview

This test suite validates the robustness of the AI response parser used in SahabahGraph's AI chat feature. The parser handles responses from Chrome's built-in Gemini Nano model and must correctly distinguish between command JSON and text responses, even when the AI adds extra characters, forgets closing braces/brackets, or wraps JSON in markdown.

**Total: 29+ test cases** covering valid commands, multi-command sequences, missing/extra braces and brackets, unsupported commands, malformed JSON, text responses, and edge cases.

## Test Coverage

### Test Categories

#### 1. Valid Commands (8 tests)
- Simple clear command
- Clear with extra closing brace
- Clear with double extra braces
- Focus command with name parameter
- Add command with full name
- JSON in markdown code block
- JSON with text before/after
- Action with underscore (clear_canvas → clear)

#### 2. Incomplete JSON (2 tests)
- Missing one closing brace (parser adds it)
- Missing two closing braces (parser adds them)

#### 3. Multi-Command Tests (3 tests)
- Multiple add commands (valid format)
- Multiple commands with extra braces (}},{ pattern)
- Mixed commands (clear + multiple adds)

#### 4. Text Responses (4 tests)
- Historical answers
- Database statistics
- Identity responses
- Generic LLM responses (should still be handled gracefully)

#### 5. Unsupported Commands (3 tests)
- "draw" command (suggest "add" instead)
- "expand" command (explain auto-relationships)
- "highlight" command (suggest "focus" instead)

#### 6. Edge Cases (6 tests)
- Empty response
- Incomplete JSON
- Wrong type field
- Missing actions
- Empty actions array
- Malformed JSON with only partial structure

## Running the Tests

### Option 1: Standalone HTML Test Page

1. Ensure dev server is running:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open in Chrome Canary:
   ```
   http://localhost:5173/test-parser.html
   ```

3. Click "▶ Run All Tests" button

4. Review results:
   - ✓ Green = test passed
   - ✗ Red = test failed
   - Click on any test to expand details

### Option 2: React Component Test Runner

The `AIChatTestRunner.tsx` component can be integrated into the main app for development testing:

```tsx
import AIChatTestRunner from './components/AIChat/AIChatTestRunner';

// Add to App.tsx temporarily
<AIChatTestRunner />
```

## Test Results

Each test shows:
- **Test name** and description
- **AI Response** (raw input)
- **Expected vs Actual** comparison
- **Parsed JSON** output
- **Pass/Fail status** with detailed error messages

## Parser Logic

The parser implements a 6-step strategy:

1. **Clean response** — Remove markdown code blocks
2. **Extract JSON** — Use regex to find command structure in text
3. **Fix braces** — Count and remove extra closing braces
4. **Parse attempts** — Try multiple fallback strategies
5. **Validate structure** — Verify type, actions array, action objects
6. **Execute** — Run commands or return text response

### Common AI Issues Handled

| Issue | Example | Solution |
|-------|---------|----------|
| Extra braces | `{...}}}` | Count braces, remove extras |
| Missing braces | `{...}]` (incomplete) | Count braces, add missing ones || Missing brackets | `[...}` (no closing `]`) | Count brackets, add missing ones || Markdown wrap | ` ```json\n{...}\n``` ` | Strip markdown syntax |
| Mixed text | `I'll clear it. {...}` | Extract JSON with regex |
| Underscore actions | `"clear_canvas"` | Normalize to `"clear"` |
| Multi-cmd braces | `}},{` pattern | Fix to `},{` before brace count |
| Unsupported command | `"draw"` | Parser accepts, executor provides helpful error |
| Text response | Historical answer | Return as text, not error |

## Files

```
frontend/
├── src/components/AIChat/
│   ├── AIChatPanel.test-cases.ts    # Test case definitions
│   └── AIChatTestRunner.tsx          # React test runner component
└── public/
    ├── test-parser.html              # Standalone test page
    └── test-parser-implementation.js # Test execution logic
```

## Development Workflow

1. **Add new test case** to `test-cases.ts`:
   ```typescript
   {
     name: 'New edge case',
     response: 'AI output to test',
     expectedType: 'command' | 'text',
     expectedAction: 'clear',
     shouldPass: true,
   }
   ```

2. **Run tests** using either method above

3. **Fix parser** in `AIChatPanelEnhanced.tsx` if tests fail

4. **Re-run** until all tests pass

## Known Issues

- TypeScript ambient declaration warning for `LanguageModel` (runtime works correctly)
- Some generic LLM responses are hard to distinguish from historical answers

## Future Improvements

- [ ] Add streaming response tests
- [ ] Test multi-command JSON
- [ ] Test command parameter validation
- [ ] Add performance benchmarks
- [ ] Integration tests with live AI
