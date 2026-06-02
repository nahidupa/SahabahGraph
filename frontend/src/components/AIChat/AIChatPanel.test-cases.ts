/**
 * AI Response Test Cases for AIChatPanelEnhanced
 * 
 * This file contains test cases for validating AI response parsing
 * and command execution in various scenarios.
 */

export interface TestCase {
  name: string;
  description: string;
  aiResponse: string;
  expectedType: 'command' | 'text';
  expectedAction?: string;
  expectedParams?: Record<string, any>;
  shouldSucceed: boolean;
}

export const AI_RESPONSE_TEST_CASES: TestCase[] = [
  // ===== VALID COMMAND RESPONSES =====
  {
    name: 'Simple clear command',
    description: 'AI returns proper JSON for clear command',
    aiResponse: '{"type":"command","actions":[{"action":"clear","params":{}}]}',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },
  {
    name: 'Clear command with extra closing brace',
    description: 'AI adds extra } at the end (common bug)',
    aiResponse: '{"type":"command","actions":[{"action":"clear","params":{}}]}}',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },
  {
    name: 'Clear command with double extra braces',
    description: 'AI adds two extra } at the end',
    aiResponse: '{"type":"command","actions":[{"action":"clear","params":{}}]}}}',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },
  {
    name: 'Focus command with name parameter',
    description: 'AI returns focus command with person name',
    aiResponse: '{"type":"command","actions":[{"action":"focus","params":{"name":"Abu Bakr"}}]}',
    expectedType: 'command',
    expectedAction: 'focus',
    expectedParams: { name: 'Abu Bakr' },
    shouldSucceed: true,
  },
  {
    name: 'Add command with full name',
    description: 'AI returns add command with full Arabic name',
    aiResponse: '{"type":"command","actions":[{"action":"add","params":{"name":"Umar ibn al-Khattab"}}]}',
    expectedType: 'command',
    expectedAction: 'add',
    expectedParams: { name: 'Umar ibn al-Khattab' },
    shouldSucceed: true,
  },
  {
    name: 'Search command',
    description: 'AI returns search command with term',
    aiResponse: '{"type":"command","actions":[{"action":"search","params":{"term":"Badr"}}]}',
    expectedType: 'command',
    expectedAction: 'search',
    expectedParams: { term: 'Badr' },
    shouldSucceed: true,
  },
  {
    name: 'View switch command',
    description: 'AI returns view switch command',
    aiResponse: '{"type":"command","actions":[{"action":"view","params":{"view":"timeline"}}]}',
    expectedType: 'command',
    expectedAction: 'view',
    expectedParams: { view: 'timeline' },
    shouldSucceed: true,
  },
  {
    name: 'Zoom command',
    description: 'AI returns zoom command with direction',
    aiResponse: '{"type":"command","actions":[{"action":"zoom","params":{"direction":"in"}}]}',
    expectedType: 'command',
    expectedAction: 'zoom',
    expectedParams: { direction: 'in' },
    shouldSucceed: true,
  },
  {
    name: 'Command with missing closing brace',
    description: 'AI forgets final closing brace',
    aiResponse: '{"type":"command","actions":[{"action":"clear","params":{}}]',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldSucceed: true,
  },
  {
    name: 'Command missing two closing braces',
    description: 'AI forgets multiple closing braces',
    aiResponse: '{"type":"command","actions":[{"action":"add","params":{"name":"Abu Bakr"}}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldSucceed: true,
  },
  {
    name: 'Command missing closing bracket',
    description: 'AI forgets to close actions array with ]',
    aiResponse: '{"type":"command","actions":[{"action":"clear","params":{}}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldSucceed: true,
  },
  {
    name: 'Command missing bracket and brace',
    description: 'AI forgets both ] and }',
    aiResponse: '{"type":"command","actions":[{"action":"add","params":{"name":"Ali"}}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldSucceed: true,
  },
  
  // ===== MULTI-COMMAND RESPONSES =====
  {
    name: 'Multiple add commands (valid)',
    description: 'AI returns multiple add actions correctly formatted',
    aiResponse: '{"type":"command","actions":[{"action":"add","params":{"name":"Abu Bakr"}},{"action":"add","params":{"name":"Umar ibn al-Khattab"}},{"action":"add","params":{"name":"Ali ibn Abi Talib"}}]}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldSucceed: true,
  },
  {
    name: 'Multiple commands with malformed braces',
    description: 'AI adds extra }} after each action (common bug)',
    aiResponse: '{"type":"command","actions":[{"action":"add","params":{"name":"Abu Bakr"}}},{"action":"add","params":{"name":"Umar ibn al-Khattab"}}},{"action":"add","params":{"name":"Ali ibn Abi Talib"}}]}',
    expectedType: 'command',
    expectedAction: 'add',
    shouldSucceed: true,
  },
  {
    name: 'Multiple different commands',
    description: 'AI returns clear + add sequence',
    aiResponse: '{"type":"command","actions":[{"action":"clear","params":{}},{"action":"add","params":{"name":"Abu Bakr"}},{"action":"add","params":{"name":"Umar"}}]}',
    expectedType: 'command',
    expectedAction: 'clear',
    shouldSucceed: true,
  },

  // ===== MALFORMED COMMAND RESPONSES =====
  {
    name: 'Command wrapped in markdown code block',
    description: 'AI wraps JSON in ```json blocks',
    aiResponse: '```json\n{"type":"command","actions":[{"action":"clear","params":{}}]}\n```',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },
  {
    name: 'Command with explanation before',
    description: 'AI adds text before the JSON',
    aiResponse: 'I will clear the canvas for you.\n{"type":"command","actions":[{"action":"clear","params":{}}]}',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },
  {
    name: 'Command with explanation after',
    description: 'AI adds text after the JSON',
    aiResponse: '{"type":"command","actions":[{"action":"clear","params":{}}]}\nThe canvas has been cleared.',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },
  {
    name: 'Command with extra whitespace',
    description: 'AI adds lots of whitespace around JSON',
    aiResponse: '\n\n  {"type":"command","actions":[{"action":"clear","params":{}}]}  \n\n',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },
  {
    name: 'String action instead of object (legacy format)',
    description: 'AI returns action as string instead of object',
    aiResponse: '{"type":"command","actions":["clear"]}',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },
  {
    name: 'Action with underscore variant',
    description: 'AI uses clear_canvas instead of clear',
    aiResponse: '{"type":"command","actions":[{"action":"clear_canvas","params":{}}]}',
    expectedType: 'command',
    expectedAction: 'clear',
    expectedParams: {},
    shouldSucceed: true,
  },

  // ===== VALID TEXT RESPONSES =====
  {
    name: 'Historical question response',
    description: 'AI answers question about Abu Bakr',
    aiResponse: 'Abu Bakr as-Siddiq (رضي الله عنه) was the first Caliph and closest companion of Prophet Muhammad (ﷺ). He was the first adult male to accept Islam.',
    expectedType: 'text',
    shouldSucceed: true,
  },
  {
    name: 'Database statistics response',
    description: 'AI responds to "how many people" question',
    aiResponse: 'The SahabahGraph database contains 206 historical figures, including the Ashara Mubashshara (10 promised Paradise), participants in 8 major battles, and Umayyad governors from 660-683 CE.',
    expectedType: 'text',
    shouldSucceed: true,
  },
  {
    name: 'Capability explanation',
    description: 'AI responds to "what can you do"',
    aiResponse: 'I\'m the SahabahGraph Assistant! I can:\n1. Answer questions about 206 historical figures from early Islam\n2. Control the graph: add people, search, switch views, zoom\n3. Explain relationships between Sahabah\n4. Share information about 8 major battles',
    expectedType: 'text',
    shouldSucceed: true,
  },
  {
    name: 'Identity response',
    description: 'AI responds to "who are you"',
    aiResponse: 'I am the SahabahGraph Assistant, a specialized AI guide for exploring early Islamic history through an interactive knowledge graph. I help you navigate 206 historical figures from the Sahabah and Umayyad period.',
    expectedType: 'text',
    shouldSucceed: true,
  },
  {
    name: 'Out of scope response',
    description: 'AI acknowledges limitation for modern scholars',
    aiResponse: 'I apologize, but my knowledge is limited to the Sahabah (Companions of the Prophet) and the early Umayyad period (660-683 CE). I don\'t have information about modern Islamic scholars.',
    expectedType: 'text',
    shouldSucceed: true,
  },
  {
    name: 'Person not found response',
    description: 'AI responds when person is not in database',
    aiResponse: 'I don\'t have information about that person in the SahabahGraph database. The current database contains 206 individuals from the Sahabah and early Umayyad period. Would you like me to suggest similar names?',
    expectedType: 'text',
    shouldSucceed: true,
  },

  // ===== EDGE CASES & ERROR CONDITIONS =====
  {
    name: 'Empty response',
    description: 'AI returns empty string',
    aiResponse: '',
    expectedType: 'text',
    shouldSucceed: false,
  },
  {
    name: 'Incomplete JSON',
    description: 'AI returns truncated JSON',
    aiResponse: '{"type":"command","actions":[{"action":"clear"',
    expectedType: 'text',
    shouldSucceed: false,
  },
  {
    name: 'Wrong type field',
    description: 'JSON has type="response" instead of "command"',
    aiResponse: '{"type":"response","actions":[{"action":"clear","params":{}}]}',
    expectedType: 'text',
    shouldSucceed: true,
  },
  {
    name: 'Missing actions array',
    description: 'JSON missing the actions field',
    aiResponse: '{"type":"command"}',
    expectedType: 'text',
    shouldSucceed: false,
  },
  {
    name: 'Empty actions array',
    description: 'JSON has empty actions array',
    aiResponse: '{"type":"command","actions":[]}',
    expectedType: 'command',
    shouldSucceed: false,
  },
  {
    name: 'Multiple commands in one response',
    description: 'AI returns multiple actions',
    aiResponse: '{"type":"command","actions":[{"action":"clear","params":{}},{"action":"add","params":{"name":"Abu Bakr"}}]}',
    expectedType: 'command',
    expectedAction: 'clear', // First action
    shouldSucceed: true,
  },
  {
    name: 'Generic LLM response (should be caught)',
    description: 'AI gives generic OpenAI boilerplate',
    aiResponse: 'I am a large language model created by OpenAI. I can generate human-quality text, translate languages, write different kinds of creative content, and answer your questions in an informative way.',
    expectedType: 'text',
    shouldSucceed: false, // This should be flagged as incorrect behavior
  },
  
  // ===== UNSUPPORTED COMMANDS =====
  {
    name: 'Unsupported "draw" command',
    description: 'AI tries to use non-existent "draw" command',
    aiResponse: '{"type":"command","actions":[{"action":"draw","params":{"names":["Abu Bakr","Umar"]}}]}',
    expectedType: 'command',
    expectedAction: 'draw',
    shouldSucceed: true, // Parser should handle gracefully with error message
  },
  {
    name: 'Unsupported "expand" command',
    description: 'AI tries to use non-existent "expand" command',
    aiResponse: '{"type":"command","actions":[{"action":"expand","params":{"relationships":true}}]}',
    expectedType: 'command',
    expectedAction: 'expand',
    shouldSucceed: true, // Parser should handle gracefully with error message
  },
  {
    name: 'Unsupported "highlight" command',
    description: 'AI tries to use non-existent "highlight" command',
    aiResponse: '{"type":"command","actions":[{"action":"highlight","params":{"name":"Ali"}}]}',
    expectedType: 'command',
    expectedAction: 'highlight',
    shouldSucceed: true, // Parser should handle gracefully with error message
  },
];

/**
 * Helper function to run test cases
 */
export function runTestCase(testCase: TestCase, parseFunction: (response: string) => { isCommand: boolean; result: any }): {
  passed: boolean;
  error?: string;
} {
  try {
    const { isCommand, result } = parseFunction(testCase.aiResponse);
    
    // Check if command/text detection is correct
    if (testCase.expectedType === 'command' && !isCommand) {
      return { passed: false, error: 'Expected command but got text response' };
    }
    if (testCase.expectedType === 'text' && isCommand) {
      return { passed: false, error: 'Expected text but got command' };
    }
    
    // For commands, check action and params
    if (testCase.expectedType === 'command' && isCommand) {
      if (!result || !Array.isArray(result.actions)) {
        return { passed: false, error: 'Command result missing actions array' };
      }
      if (result.actions.length === 0) {
        return { passed: false, error: 'Command has empty actions array' };
      }
      
      const firstAction = result.actions[0];
      if (testCase.expectedAction) {
        const normalizedAction = (typeof firstAction === 'string' ? firstAction : firstAction.action)
          .toLowerCase()
          .replace(/_/g, '');
        const expectedNormalized = testCase.expectedAction.toLowerCase().replace(/_/g, '');
        
        if (normalizedAction !== expectedNormalized) {
          return { passed: false, error: `Expected action "${testCase.expectedAction}" but got "${firstAction}"` };
        }
      }
    }
    
    return { passed: true };
  } catch (error) {
    return { passed: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Run all test cases and generate report
 */
export function runAllTestCases(parseFunction: (response: string) => { isCommand: boolean; result: any }): {
  total: number;
  passed: number;
  failed: number;
  results: Array<{ testCase: TestCase; result: ReturnType<typeof runTestCase> }>;
} {
  const results = AI_RESPONSE_TEST_CASES.map(testCase => ({
    testCase,
    result: runTestCase(testCase, parseFunction),
  }));
  
  const passed = results.filter(r => r.result.passed === r.testCase.shouldSucceed).length;
  const failed = results.length - passed;
  
  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
