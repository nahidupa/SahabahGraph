# Using Gemini Nano for UI Control & Graph Building

## The Pattern: AI as Command Interpreter

Gemini Nano **cannot** directly manipulate UI, but it **can**:
1. ✅ Understand user intent from natural language
2. ✅ Generate structured commands (JSON)
3. ✅ Your code executes those commands

## Architecture

```
User Input: "Show me all Sahabah from Medina"
    ↓
Gemini Nano interprets intent
    ↓
Returns: { action: "filter", criteria: { location: "Medina" } }
    ↓
Your code executes: applyFilter({ location: "Medina" })
    ↓
UI updates
```

## What You Can Build

### 1. **Natural Language Commands**

User says → AI interprets → App executes:

| User Command | AI Returns | App Action |
|--------------|------------|------------|
| "Clear the canvas" | `{ action: "clear" }` | `clearCanvas()` |
| "Show Abu Bakr" | `{ action: "focus", person: "Abu Bakr" }` | `focusOnNode("Abu Bakr")` |
| "Filter by Medina" | `{ action: "filter", location: "Medina" }` | `applyFilter()` |
| "Zoom to Battle of Badr" | `{ action: "zoom", event: "Badr" }` | `zoomToEvent()` |
| "Show family tree of Umar" | `{ action: "tree", person: "Umar", type: "family" }` | `buildTree()` |
| "Hide non-Sahabah" | `{ action: "filter", nodeType: "Sahabi" }` | `filterNodes()` |
| "Export to JSON" | `{ action: "export", format: "json" }` | `exportData()` |

### 2. **Graph Building from Natural Language**

```javascript
// User: "Create a graph showing all companions who fought at Badr"
// AI generates query structure:
{
  action: "build_graph",
  nodes: {
    type: "Sahabi",
    battles: ["Badr"]
  },
  relationships: {
    include: ["family", "battles"]
  },
  layout: "force-directed"
}

// Your code executes it
```

### 3. **Smart Query Builder**

```javascript
// User: "Find all Sahabah related to the Prophet through marriage"
// AI interprets:
{
  action: "query",
  filters: {
    relationship_type: "marriage",
    connected_to: "Muhammad (PBUH)"
  }
}
```

### 4. **UI State Management**

```javascript
// User: "Switch to timeline view and show the first 10 years after Hijra"
// AI returns:
{
  actions: [
    { action: "switch_view", view: "timeline" },
    { action: "set_time_range", start: 1, end: 10, unit: "AH" }
  ]
}
```

## Implementation Examples

### Example 1: Command Parser

```typescript
interface UICommand {
  action: string;
  params?: Record<string, any>;
  description?: string;
}

async function parseUserCommand(input: string): Promise<UICommand[]> {
  const session = await LanguageModel.create({
    systemPrompt: `You are a command parser for SahabahGraph.
    
Available actions:
- clear: Clear the canvas
- focus: Focus on a specific person (requires: person name)
- filter: Apply filters (requires: filter criteria)
- zoom: Zoom to location/event
- build_graph: Build custom graph
- switch_view: Change view (graph/timeline/political)
- export: Export data

Parse the user's command and return ONLY valid JSON in this format:
{
  "actions": [
    { "action": "action_name", "params": {...} }
  ]
}

Be concise. Only return JSON.`
  });

  const response = await session.prompt(`Parse this command: "${input}"`);
  session.destroy();
  
  try {
    const parsed = JSON.parse(response);
    return parsed.actions;
  } catch (e) {
    console.error('Failed to parse AI response:', response);
    return [];
  }
}

// Usage
const commands = await parseUserCommand("Clear the canvas and show Abu Bakr");
// Returns: [
//   { action: "clear" },
//   { action: "focus", params: { person: "Abu Bakr" } }
// ]

// Execute commands
commands.forEach(cmd => executeCommand(cmd));
```

### Example 2: Graph Builder

```typescript
interface GraphBuildRequest {
  nodes: {
    type?: string;
    filters?: Record<string, any>;
    names?: string[];
  };
  relationships?: string[];
  layout?: string;
}

async function buildGraphFromNL(description: string): Promise<GraphBuildRequest> {
  const session = await LanguageModel.create({
    systemPrompt: `You are a graph builder for SahabahGraph.

Convert natural language descriptions into graph specifications.

Node types: Sahabi, Battle, City
Relationship types: family, mentorship, battles, governance
Filters: tribe, location, timeperiod, prominence

Return ONLY JSON in this format:
{
  "nodes": {
    "type": "Sahabi",
    "filters": { "location": "Medina" }
  },
  "relationships": ["family", "battles"],
  "layout": "force-directed"
}`
  });

  const response = await session.prompt(
    `Create graph spec: "${description}"`
  );
  session.destroy();
  
  return JSON.parse(response);
}

// Usage
const spec = await buildGraphFromNL(
  "Show all Sahabah from Quraysh tribe who fought at Badr with their family relationships"
);

// Build the graph
buildGraph(spec);
```

### Example 3: Smart Filter Generator

```typescript
async function generateFilters(query: string) {
  const session = await LanguageModel.create({
    systemPrompt: `Convert search queries into filter objects.
    
Available filters:
- name: string (partial match)
- tribe: string
- location: string
- prominence: "high" | "medium" | "low"
- birth_year_hijri: { min, max }
- death_year_hijri: { min, max }
- battles: string[]
- gender: "male" | "female"

Return ONLY JSON: { "filters": {...} }`
  });

  const response = await session.prompt(
    `Generate filters for: "${query}"`
  );
  session.destroy();
  
  return JSON.parse(response).filters;
}

// Usage
const filters = await generateFilters(
  "female companions who lived past 50 AH"
);
// Returns: {
//   gender: "female",
//   death_year_hijri: { min: 50 }
// }

applyFilters(filters);
```

### Example 4: Intent Router

```typescript
async function routeIntent(userInput: string) {
  const session = await LanguageModel.create({
    systemPrompt: `Classify user intent into categories:
    
- command: User wants to control UI (clear, zoom, switch view)
- query: User wants to find/filter data
- question: User asking for information
- build: User wants to create a custom view

Return JSON: { "intent": "category", "confidence": 0.0-1.0 }`
  });

  const response = await session.prompt(userInput);
  session.destroy();
  
  const { intent, confidence } = JSON.parse(response);
  
  if (confidence < 0.7) {
    return 'question'; // Default to Q&A if uncertain
  }
  
  switch (intent) {
    case 'command':
      return handleCommand(userInput);
    case 'query':
      return handleQuery(userInput);
    case 'question':
      return handleQuestion(userInput);
    case 'build':
      return handleGraphBuild(userInput);
  }
}
```

## Real Implementation for SahabahGraph

### AI Command Center Component

```typescript
// AICommandCenter.tsx
import { useState } from 'react';

export const AICommandCenter = ({ 
  onClear, 
  onFocus, 
  onFilter,
  onExport,
  onSwitchView 
}) => {
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const executeCommands = async () => {
    setProcessing(true);
    
    const session = await LanguageModel.create({
      systemPrompt: `Parse UI commands for SahabahGraph.
      
Actions:
- clear: Clear canvas
- focus: Focus on person (needs: name)
- filter: Filter nodes (needs: criteria)
- export: Export data (needs: format)
- view: Switch view (needs: view_name)

Return JSON array: [{ "action": "...", "params": {...} }]`
    });
    
    const response = await session.prompt(
      `Parse: "${input}"\n\nReturn only JSON array.`
    );
    session.destroy();
    
    try {
      const commands = JSON.parse(response);
      
      for (const cmd of commands) {
        switch (cmd.action) {
          case 'clear':
            onClear();
            break;
          case 'focus':
            onFocus(cmd.params.name);
            break;
          case 'filter':
            onFilter(cmd.params);
            break;
          case 'export':
            onExport(cmd.params.format);
            break;
          case 'view':
            onSwitchView(cmd.params.view);
            break;
        }
      }
    } catch (e) {
      console.error('Command parse error:', e);
    }
    
    setProcessing(false);
    setInput('');
  };
  
  return (
    <Box>
      <TextField
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g., 'Clear canvas and show Abu Bakr'"
        onKeyPress={(e) => e.key === 'Enter' && executeCommands()}
      />
      <Button onClick={executeCommands} disabled={processing}>
        {processing ? 'Processing...' : 'Execute'}
      </Button>
    </Box>
  );
};
```

## Advanced: Multi-Step Graph Construction

```typescript
async function buildComplexGraph(description: string) {
  const session = await LanguageModel.create({
    systemPrompt: `You are a graph architect. Break down complex graph 
    building requests into steps.
    
    Return JSON:
    {
      "steps": [
        {
          "step": 1,
          "action": "fetch_nodes",
          "criteria": {...}
        },
        {
          "step": 2,
          "action": "add_relationships",
          "types": [...]
        },
        {
          "step": 3,
          "action": "apply_layout",
          "layout_type": "..."
        }
      ]
    }`
  });
  
  const response = await session.prompt(description);
  const { steps } = JSON.parse(response);
  session.destroy();
  
  // Execute steps sequentially
  for (const step of steps) {
    await executeGraphStep(step);
  }
}

// Usage
await buildComplexGraph(
  "Create a hierarchical graph showing the Prophet's family tree, " +
  "then add his closest companions, and highlight those who became caliphs"
);
```

## What Gemini Nano CANNOT Do

❌ Directly manipulate DOM elements
❌ Call your functions directly
❌ Access browser APIs
❌ Execute JavaScript code
❌ Read current UI state (unless you tell it)
❌ Make HTTP requests
❌ Access databases

## What Gemini Nano CAN Do

✅ Understand natural language intent
✅ Generate structured commands (JSON)
✅ Parse complex queries
✅ Suggest actions based on context
✅ Generate graph specifications
✅ Classify user input
✅ Extract parameters from text
✅ Provide recommendations

## Best Practices

### 1. Clear System Prompts
```typescript
const systemPrompt = `You are a command parser.
Available commands: [list them]
Input format: [describe]
Output format: [specify exact JSON structure]
Be concise. Only return valid JSON.`;
```

### 2. Validate AI Output
```typescript
const response = await session.prompt(input);
try {
  const parsed = JSON.parse(response);
  // Validate structure
  if (!isValidCommand(parsed)) {
    throw new Error('Invalid command structure');
  }
  return parsed;
} catch (e) {
  // Fallback to safe default
  return { action: 'query', query: input };
}
```

### 3. Provide Context
```typescript
// Tell AI about current state
const prompt = `Current state:
- View: graph
- Selected: Abu Bakr
- Filters: tribe=Quraysh
- Visible nodes: 150

User command: "${userInput}"

Generate appropriate action.`;
```

### 4. Graceful Degradation
```typescript
async function handleCommand(input: string) {
  try {
    const commands = await parseWithAI(input);
    executeCommands(commands);
  } catch (e) {
    // Fallback: treat as search query
    searchGraph(input);
  }
}
```

## Performance Tips

1. **Cache Common Commands**
```typescript
const commandCache = new Map();
if (commandCache.has(input)) {
  return commandCache.get(input);
}
```

2. **Reuse Sessions for Multiple Commands**
```typescript
// Keep session alive for command mode
let commandSession = await LanguageModel.create({...});
// Use for multiple commands
// Destroy when user exits command mode
```

3. **Optimize System Prompts**
- Keep them concise
- Use bullet points
- Specify exact output format
- Avoid examples (costs tokens)

## Implementation Priority

### Phase 1: Basic Commands (1-2 days)
- ✅ Clear canvas
- ✅ Focus on person
- ✅ Simple filters
- ✅ View switching

### Phase 2: Smart Queries (3-4 days)
- ✅ Natural language filtering
- ✅ Complex graph queries
- ✅ Relationship exploration

### Phase 3: Graph Building (1 week)
- ✅ Custom graph creation
- ✅ Multi-step construction
- ✅ Layout suggestions

## Summary

**The Pattern:**
```
Natural Language → AI Interprets → JSON Commands → Your Code Executes → UI Updates
```

Gemini Nano is like a **smart translator** between human intent and machine commands. It doesn't touch the UI directly, but it makes your app feel magical by understanding what users want and converting it to precise actions.

**Want me to implement the AI Command Center for your app?**
