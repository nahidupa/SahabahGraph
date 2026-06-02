// Test cases for AI response parsing
const TEST_CASES = [
  // Valid commands
  {
    name: 'Simple clear command',
    response: '{"type":"command","actions":[{"action":"clear","params":{}}]}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'Clear with extra closing brace',
    response: '{"type":"command","actions":[{"action":"clear","params":{}}]}}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'Clear with double extra braces',
    response: '{"type":"command","actions":[{"action":"clear","params":{}}]}}}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'Focus command with name',
    response: '{"type":"command","actions":[{"action":"focus","params":{"name":"Abu Bakr"}}]}',
    expectedType: 'command',
    expectedAction: 'focus',
    shouldPass: true,
  },
  {
    name: 'Add command with full name',
    response: '{"type":"command","actions":[{"action":"add","params":{"name":"Umar ibn al-Khattab"}}]}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldPass: true,
  },
  {
    name: 'JSON in markdown code block',
    response: '```json\n{"type":"command","actions":[{"action":"clear","params":{}}]}\n```',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'JSON with text before',
    response: 'I will clear the canvas.\n{"type":"command","actions":[{"action":"clear","params":{}}]}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'JSON with text after',
    response: '{"type":"command","actions":[{"action":"clear","params":{}}]}\nCanvas cleared.',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'Action with underscore',
    response: '{"type":"command","actions":[{"action":"clear_canvas","params":{}}]}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'Missing closing brace',
    response: '{"type":"command","actions":[{"action":"clear","params":{}}]',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'Missing two closing braces',
    response: '{"type":"command","actions":[{"action":"add","params":{"name":"Abu Bakr"}}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldPass: true,
  },
  {
    name: 'Missing closing bracket',
    response: '{"type":"command","actions":[{"action":"clear","params":{}}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  {
    name: 'Missing bracket and brace',
    response: '{"type":"command","actions":[{"action":"add","params":{"name":"Ali"}}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldPass: true,
  },
  
  // Multi-command tests
  {
    name: 'Multiple add commands (valid)',
    response: '{"type":"command","actions":[{"action":"add","params":{"name":"Abu Bakr"}},{"action":"add","params":{"name":"Umar ibn al-Khattab"}},{"action":"add","params":{"name":"Ali ibn Abi Talib"}}]}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldPass: true,
  },
  {
    name: 'Multiple commands with extra braces',
    response: '{"type":"command","actions":[{"action":"add","params":{"name":"Abu Bakr"}}},{"action":"add","params":{"name":"Umar ibn al-Khattab"}}},{"action":"add","params":{"name":"Ali ibn Abi Talib"}}]}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldPass: true,
  },
  {
    name: 'Clear then add multiple',
    response: '{"type":"command","actions":[{"action":"clear","params":{}},{"action":"add","params":{"name":"Abu Bakr"}},{"action":"add","params":{"name":"Umar"}}]}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldPass: true,
  },
  
  // Text responses
  {
    name: 'Historical answer',
    response: 'Abu Bakr as-Siddiq (رضي الله عنه) was the first Caliph and closest companion of Prophet Muhammad (ﷺ).',
    expectedType: 'text',
    shouldPass: true,
  },
  {
    name: 'Database stats response',
    response: 'The SahabahGraph database contains 206 historical figures.',
    expectedType: 'text',
    shouldPass: true,
  },
  {
    name: 'Identity response',
    response: 'I am the SahabahGraph Assistant, a specialized AI guide for exploring early Islamic history.',
    expectedType: 'text',
    shouldPass: true,
  },
  {
    name: 'Generic LLM response (should be text)',
    response: 'I am a large language model created by OpenAI. I can generate human-quality text.',
    expectedType: 'text',
    shouldPass: true,
  },
  
  // Edge cases
  {
    name: 'Empty response',
    response: '',
    expectedType: 'text',
    shouldPass: true,
  },
  {
    name: 'Incomplete JSON',
    response: '{"type":"command","actions":[{"action":"clear"',
    expectedType: 'text',
    shouldPass: true,
  },
  {
    name: 'Wrong type field',
    response: '{"type":"response","actions":[{"action":"clear","params":{}}]}',
    expectedType: 'text',
    shouldPass: true,
  },
  {
    name: 'Missing actions',
    response: '{"type":"command"}',
    expectedType: 'text',
    shouldPass: true,
  },
  {
    name: 'Empty actions array',
    response: '{"type":"command","actions":[]}',
    expectedType: 'text',
    shouldPass: true,
  },
  
  // Unsupported commands (should parse but execution will show error)
  {
    name: 'Unsupported "draw" command',
    response: '{"type":"command","actions":[{"action":"draw","params":{"names":["Abu Bakr","Umar"]}}]}',
    expectedType: 'command',
    expectedAction: 'draw',
    shouldPass: true, // Parser should accept it, executor will reject
  },
  {
    name: 'Unsupported "expand" command',
    response: '{"type":"command","actions":[{"action":"expand","params":{"relationships":true}}]}',
    expectedType: 'command',
    expectedAction: 'expand',
    shouldPass: true,
  },
  {
    name: 'Unsupported "highlight" command',
    response: '{"type":"command","actions":[{"action":"highlight","params":{"name":"Ali"}}]}',
    expectedType: 'command',
    expectedAction: 'highlight',
    shouldPass: true,
  },
];

// Parser implementation (mimics AIChatPanelEnhanced logic)
async function parseAIResponse(response) {
  console.log('Parsing:', response.substring(0, 50));
  
  // Handle empty response
  if (!response || response.trim().length === 0) {
    return { isCommand: false, parsed: null };
  }
  
  let cleanResponse = response.trim();
  
  // Remove markdown code blocks
  if (cleanResponse.includes('```')) {
    cleanResponse = cleanResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
  }
  
  // Extract JSON from text - look for command structure
  let jsonString = cleanResponse;
  
  // Try to find the start of a command structure
  const commandStartMatch = cleanResponse.match(/\{\s*"type"\s*:\s*"command"/);
  if (commandStartMatch) {
    // Found a command structure, extract from that point
    const startIndex = commandStartMatch.index;
    jsonString = cleanResponse.substring(startIndex);
    
    // Must have "actions" field for it to be a command
    if (!jsonString.includes('"actions"')) {
      return { isCommand: false, parsed: null };
    }
    
    // Try to find the end, but don't require it (we'll fix it below)
    // Look for the last closing brace that might indicate end of JSON
    const lastBraceIndex = jsonString.lastIndexOf('}');
    if (lastBraceIndex !== -1 && lastBraceIndex < jsonString.length - 10) {
      // If there's a lot of text after the last brace, truncate
      jsonString = jsonString.substring(0, lastBraceIndex + 1);
    }
  } else {
    // No command structure found, treat as text
    return { isCommand: false, parsed: null };
  }
  
  // Fix common pattern: extra closing braces before comma
  // Pattern: }}},{  should become  }},{
  // But DON'T change }},{ which is valid for array items
  jsonString = jsonString.replace(/\}\}\},\{/g, '}},{');
  
  const openBraces = (jsonString.match(/\{/g) || []).length;
  const closeBraces = (jsonString.match(/\}/g) || []).length;
  const openBrackets = (jsonString.match(/\[/g) || []).length;
  const closeBrackets = (jsonString.match(/\]/g) || []).length;
  
  // Fix brackets first
  if (openBrackets > closeBrackets) {
    const missingBrackets = openBrackets - closeBrackets;
    jsonString += ']'.repeat(missingBrackets);
  } else if (closeBrackets > openBrackets) {
    const extraBrackets = closeBrackets - openBrackets;
    for (let i = 0; i < extraBrackets; i++) {
      const lastBracketIndex = jsonString.lastIndexOf(']');
      if (lastBracketIndex !== -1) {
        jsonString = jsonString.substring(0, lastBracketIndex) + jsonString.substring(lastBracketIndex + 1);
      }
    }
  }
  
  // Then fix braces
  if (closeBraces > openBraces) {
    const extraBraces = closeBraces - openBraces;
    for (let i = 0; i < extraBraces; i++) {
      const lastBraceIndex = jsonString.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        jsonString = jsonString.substring(0, lastBraceIndex) + jsonString.substring(lastBraceIndex + 1);
      }
    }
  } else if (openBraces > closeBraces) {
    const missingBraces = openBraces - closeBraces;
    jsonString += '}'.repeat(missingBraces);
  }
  
  // Try parsing
  const parseAttempts = [jsonString, jsonString.trim(), jsonString.replace(/[,;.]+$/, '')];
  
  let parsed = null;
  for (const attempt of parseAttempts) {
    try {
      parsed = JSON.parse(attempt);
      break;
    } catch (e) {
      // Continue
    }
  }
  
  if (!parsed || parsed.type !== 'command' || !Array.isArray(parsed.actions) || parsed.actions.length === 0) {
    return { isCommand: false, parsed };
  }
  
  return { isCommand: true, parsed };
}

function normalizeAction(action) {
  if (!action) return '';
  
  // Convert to lowercase and remove underscores
  let normalized = String(action).toLowerCase().replace(/_/g, '');
  
  // Map common variations to standard actions
  const actionMap = {
    'clearcanvas': 'clear',
    'clearall': 'clear',
    'reset': 'clear',
    'focuson': 'focus',
    'selectnode': 'focus',
    'addnode': 'add',
    'addperson': 'add',
    'searchfor': 'search',
    'find': 'search',
    'viewmode': 'view',
    'switchview': 'view',
    'zoomin': 'zoom',
    'zoomout': 'zoom',
  };
  
  return actionMap[normalized] || normalized;
}

// Test runner
async function runTests() {
  const button = document.getElementById('runButton');
  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progressBar');
  const stats = document.getElementById('stats');
  const resultsContainer = document.getElementById('results');
  
  button.disabled = true;
  button.textContent = '⏳ Running Tests...';
  progress.style.display = 'block';
  stats.style.display = 'flex';
  resultsContainer.innerHTML = '';
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    progressBar.style.width = `${((i + 1) / TEST_CASES.length) * 100}%`;
    
    try {
      const { isCommand, parsed } = await parseAIResponse(testCase.response);
      const actualType = isCommand ? 'command' : 'text';
      const actualAction = parsed?.actions?.[0]?.action;
      
      const typeMatches = actualType === testCase.expectedType;
      const actionMatches = !testCase.expectedAction || normalizeAction(actualAction) === normalizeAction(testCase.expectedAction);
      
      // Test passes if type and action match as expected
      const testPassed = typeMatches && actionMatches;
      
      if (testPassed) passed++;
      else failed++;
      
      results.push({
        testCase,
        passed: testPassed,
        actualType,
        actualAction,
        parsed,
      });
    } catch (error) {
      failed++;
      results.push({
        testCase,
        passed: false,
        actualType: 'error',
        error: error.message,
      });
    }
    
    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Update stats
  document.getElementById('totalTests').textContent = TEST_CASES.length;
  document.getElementById('passedTests').textContent = passed;
  document.getElementById('failedTests').textContent = failed;
  document.getElementById('passRate').textContent = `${((passed / TEST_CASES.length) * 100).toFixed(1)}%`;
  
  // Render results
  results.forEach((result, index) => {
    const testDiv = document.createElement('div');
    testDiv.className = `test-case ${result.passed ? 'passed' : 'failed'}`;
    testDiv.innerHTML = `
      <div class="test-header" onclick="toggleDetails(${index})">
        <div class="test-icon ${result.passed ? 'passed' : 'failed'}">
          ${result.passed ? '✓' : '✗'}
        </div>
        <div class="test-title">${result.testCase.name}</div>
        <div class="test-badge ${result.actualType}">${result.actualType}</div>
      </div>
      <div class="test-details" id="details-${index}">
        <div class="detail-section">
          <div class="detail-label">AI Response:</div>
          <div class="code-block">${result.testCase.response}</div>
        </div>
        <div class="comparison">
          <div class="expected">
            <div class="detail-label">Expected:</div>
            <div>Type: <strong>${result.testCase.expectedType}</strong></div>
            ${result.testCase.expectedAction ? `<div>Action: <strong>${result.testCase.expectedAction}</strong></div>` : ''}
          </div>
          <div class="actual">
            <div class="detail-label">Actual:</div>
            <div>Type: <strong>${result.actualType}</strong></div>
            ${result.actualAction ? `<div>Action: <strong>${result.actualAction}</strong></div>` : ''}
          </div>
        </div>
        ${result.parsed ? `
          <div class="detail-section">
            <div class="detail-label">Parsed JSON:</div>
            <div class="code-block">${JSON.stringify(result.parsed, null, 2)}</div>
          </div>
        ` : ''}
        ${result.error ? `
          <div class="detail-section">
            <div class="detail-label" style="color: #f56565;">Error:</div>
            <div style="color: #f56565;">${result.error}</div>
          </div>
        ` : ''}
      </div>
    `;
    resultsContainer.appendChild(testDiv);
  });
  
  button.disabled = false;
  button.textContent = '▶ Run All Tests';
  progress.style.display = 'none';
}

function toggleDetails(index) {
  const details = document.getElementById(`details-${index}`);
  details.classList.toggle('expanded');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const runButton = document.getElementById('runButton');
  if (runButton) {
    runButton.addEventListener('click', runTests);
  }
});

// Also expose globally for dynamically created onclick handlers
window.toggleDetails = toggleDetails;
