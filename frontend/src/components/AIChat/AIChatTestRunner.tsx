import React, { useState } from 'react';
import { Box, Button, Paper, Typography, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  CheckCircle as PassIcon,
  Error as FailIcon,
  PlayArrow as RunIcon,
} from '@mui/icons-material';
import { AI_RESPONSE_TEST_CASES, type TestCase } from './AIChatPanel.test-cases';

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  actualType: 'command' | 'text' | 'error';
  actualAction?: string;
  error?: string;
  parseOutput?: any;
}

/**
 * Test Runner Component for AI Response Parsing
 * 
 * This component runs test cases against the AI response parser
 * and displays results in a readable format.
 */
const AIChatTestRunner: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    for (const testCase of AI_RESPONSE_TEST_CASES) {
      try {
        // Simulate the parsing logic
        const { isCommand, parsed } = await mockParseAIResponse(testCase.aiResponse);
        
        const actualType = isCommand ? 'command' : 'text';
        const actualAction = parsed?.actions?.[0]?.action || parsed?.actions?.[0];
        
        const passed = 
          (testCase.expectedType === actualType) &&
          (!testCase.expectedAction || normalizeAction(actualAction) === normalizeAction(testCase.expectedAction));
        
        results.push({
          testCase,
          passed: passed === testCase.shouldSucceed,
          actualType,
          actualAction,
          parseOutput: parsed,
        });
      } catch (error) {
        results.push({
          testCase,
          passed: false,
          actualType: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const passedCount = testResults.filter(r => r.passed).length;
  const failedCount = testResults.length - passedCount;
  const passRate = testResults.length > 0 ? ((passedCount / testResults.length) * 100).toFixed(1) : 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        AI Response Parser Test Suite
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<RunIcon />}
            onClick={runTests}
            disabled={isRunning}
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          
          {testResults.length > 0 && (
            <>
              <Chip
                icon={<PassIcon />}
                label={`${passedCount} Passed`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<FailIcon />}
                label={`${failedCount} Failed`}
                color="error"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Pass Rate: {passRate}%
              </Typography>
            </>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          Total Test Cases: {AI_RESPONSE_TEST_CASES.length}
        </Typography>
      </Paper>

      {testResults.map((result, index) => (
        <Accordion key={index}>
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              {result.passed ? (
                <PassIcon color="success" />
              ) : (
                <FailIcon color="error" />
              )}
              <Typography sx={{ flexGrow: 1 }}>
                {result.testCase.name}
              </Typography>
              <Chip
                label={result.actualType}
                size="small"
                color={result.actualType === 'error' ? 'error' : 'default'}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {result.testCase.description}
              </Typography>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>AI Response:</Typography>
                <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                  <code style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {result.testCase.aiResponse}
                  </code>
                </Paper>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Expected:</Typography>
                  <Typography variant="body2">
                    Type: <strong>{result.testCase.expectedType}</strong>
                  </Typography>
                  {result.testCase.expectedAction && (
                    <Typography variant="body2">
                      Action: <strong>{result.testCase.expectedAction}</strong>
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Actual:</Typography>
                  <Typography variant="body2">
                    Type: <strong>{result.actualType}</strong>
                  </Typography>
                  {result.actualAction && (
                    <Typography variant="body2">
                      Action: <strong>{result.actualAction}</strong>
                    </Typography>
                  )}
                </Box>
              </Box>

              {result.error && (
                <Box>
                  <Typography variant="subtitle2" color="error" gutterBottom>Error:</Typography>
                  <Typography variant="body2" color="error">
                    {result.error}
                  </Typography>
                </Box>
              )}

              {result.parseOutput && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Parse Output:</Typography>
                  <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                    <code style={{ fontSize: '0.875rem' }}>
                      {JSON.stringify(result.parseOutput, null, 2)}
                    </code>
                  </Paper>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={result.testCase.shouldSucceed ? 'Should Pass' : 'Should Fail'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={result.passed ? 'Test Passed ✓' : 'Test Failed ✗'}
                  size="small"
                  color={result.passed ? 'success' : 'error'}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

// Mock parser for testing (mimics the real parseAIResponse logic)
async function mockParseAIResponse(response: string): Promise<{
  isCommand: boolean;
  parsed: any;
}> {
  let cleanResponse = response.trim();
  
  // Remove markdown code blocks
  if (cleanResponse.includes('```')) {
    cleanResponse = cleanResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
  }
  
  // Extract JSON from text
  let jsonString = cleanResponse;
  const jsonPattern = /\{[^{}]*"type"\s*:\s*"command"[^{}]*"actions"\s*:\s*\[[^\]]*\][^{}]*\}/;
  const match = cleanResponse.match(jsonPattern);
  if (match) {
    jsonString = match[0];
  }
  
  // Count and fix brackets/braces
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
    } catch {
      // Continue to next attempt
    }
  }
  
  if (!parsed || parsed.type !== 'command' || !Array.isArray(parsed.actions) || parsed.actions.length === 0) {
    return { isCommand: false, parsed };
  }
  
  return { isCommand: true, parsed };
}

function normalizeAction(action: string | undefined): string {
  if (!action) return '';
  return String(action).toLowerCase().replace(/_/g, '');
}

export default AIChatTestRunner;
