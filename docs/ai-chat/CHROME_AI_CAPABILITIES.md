# Chrome AI API - Full Capabilities & Use Cases for SahabahGraph

## What You Currently Have

### Implemented Features
- ✅ **Basic Chat Interface**: Floating AI chat panel
- ✅ **Context-Aware Responses**: AI knows it's helping with SahabahGraph
- ✅ **Session Management**: Creates/destroys AI sessions properly
- ✅ **Simple Q&A**: Users can ask questions about Sahabah

### Current API Usage
```typescript
// What you're using now:
const session = await window.ai.languageModel.create();
const response = await session.prompt(userQuestion);
session.destroy();
```

---

## Chrome AI API - Full Capabilities

### 1. **Prompt API (What You Have)**
```typescript
interface AILanguageModel {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream;
  destroy(): void;
}
```

**Current Limitations:**
- Model: Gemini Nano (~1.8B parameters)
- Context: ~2048 tokens
- No internet access
- No real-time data
- Stateless (no memory between sessions by default)

---

## What You Can Build in SahabahGraph

### 🎯 **Tier 1: Already Possible (Easy Wins)**

#### 1. **Smart Search & Query Builder**
```typescript
// User: "Find all Sahabah from Medina who fought in Badr"
// AI generates the query logic:
{
  filters: {
    location: "Medina",
    battles: ["Badr"]
  }
}
```

**Implementation:**
```typescript
const buildQuery = async (userIntent: string, graphData: GraphData) => {
  const prompt = `
    Given this graph schema:
    - Nodes: Sahabi with properties (name, tribe, clan, battles, etc.)
    - Relationships: family, mentorship, battles, governance
    
    Convert this request into a filter query:
    "${userIntent}"
    
    Return JSON format: { filters: {...}, relationships: [...] }
  `;
  
  const result = await session.prompt(prompt);
  return JSON.parse(result);
};
```

#### 2. **Relationship Explanation**
```typescript
// User clicks connection between two Sahabah
// AI explains: "Abu Bakr and Umar were brothers-in-law. 
//               Umar married Abu Bakr's daughter Umm Kulthum..."

const explainRelationship = async (
  person1: Sahabi, 
  person2: Sahabi, 
  path: Relationship[]
) => {
  const prompt = `
    Explain the relationship between ${person1.name_en} and ${person2.name_en}.
    Connection path: ${path.map(r => r.type).join(' → ')}
    Keep it concise and historically accurate.
  `;
  
  return await session.prompt(prompt);
};
```

#### 3. **Biography Summarization**
```typescript
// Summarize long biographies based on user's focus
const summarizeBio = async (sahabi: Sahabi, focus: string) => {
  const prompt = `
    Summarize this biography focusing on ${focus}:
    ${sahabi.biography_short}
    
    Keep it under 100 words.
  `;
  
  return await session.prompt(prompt);
};
```

#### 4. **Timeline Narrative Generator**
```typescript
// Convert timeline data into story
const generateTimelineNarrative = async (events: GovernorTerm[]) => {
  const prompt = `
    Create a brief narrative from these historical events:
    ${events.map(e => `${e.caliph_name} appointed ${e.governor_name} 
                       to govern ${e.city_id} (${e.start_year_hijri}AH)`).join('\n')}
    
    Make it engaging but historically accurate.
  `;
  
  return await session.prompt(prompt);
};
```

#### 5. **Data Validation Helper**
```typescript
// Help validate user-contributed data
const validateEntry = async (entry: Partial<Sahabi>) => {
  const prompt = `
    Check if this Sahabi data seems historically consistent:
    Name: ${entry.name_en}
    Tribe: ${entry.tribe}
    Birth: ${entry.birth_year_hijri}AH
    Death: ${entry.death_year_hijri}AH
    
    Flag any obvious inconsistencies.
  `;
  
  return await session.prompt(prompt);
};
```

---

### 🚀 **Tier 2: Advanced Features (More Development)**

#### 6. **Intelligent Path Finding Explanation**
```typescript
// Explain why certain paths exist
const explainPath = async (path: Sahabi[]) => {
  const prompt = `
    Explain the historical significance of this connection path:
    ${path.map(s => s.name_en).join(' → ')}
    
    Why is this path historically important?
  `;
  
  return await session.prompt(prompt);
};
```

#### 7. **Comparative Analysis**
```typescript
// Compare multiple Sahabah
const compareSahabah = async (sahabah: Sahabi[]) => {
  const prompt = `
    Compare these companions:
    ${sahabah.map(s => `- ${s.name_en}: ${s.prominence}, ${s.tribe}`).join('\n')}
    
    What are the key similarities and differences?
  `;
  
  return await session.prompt(prompt);
};
```

#### 8. **Educational Quiz Generator**
```typescript
// Generate quizzes from graph data
const generateQuiz = async (topic: string, difficulty: string) => {
  const prompt = `
    Create a ${difficulty} difficulty quiz about ${topic} 
    with 5 multiple choice questions.
    
    Format as JSON: [{ question, options: [], answer }]
  `;
  
  return await session.prompt(prompt);
};
```

#### 9. **Natural Language Graph Queries**
```typescript
// Let users query in plain language
const nlpQuery = async (question: string, graphData: GraphData) => {
  const prompt = `
    Answer this using the graph data:
    "${question}"
    
    Available data: ${graphData.nodes.length} Sahabah, 
                    ${graphData.links.length} relationships
    
    Provide specific names and relationships.
  `;
  
  return await session.prompt(prompt);
};
```

#### 10. **Context-Aware Recommendations**
```typescript
// Suggest related Sahabah to explore
const getRecommendations = async (
  currentSahabi: Sahabi, 
  userInterests: string[]
) => {
  const prompt = `
    User is viewing ${currentSahabi.name_en}.
    They're interested in: ${userInterests.join(', ')}
    
    Recommend 3 related Sahabah to explore next and why.
  `;
  
  return await session.prompt(prompt);
};
```

---

### 🎨 **Tier 3: Creative Applications**

#### 11. **Multi-Language Support**
```typescript
// Translate content on the fly
const translate = async (text: string, targetLang: string) => {
  const prompt = `
    Translate this to ${targetLang}:
    "${text}"
    
    Maintain historical terminology accuracy.
  `;
  
  return await session.prompt(prompt);
};
```

#### 12. **Storytelling Mode**
```typescript
// Create engaging historical narratives
const generateStory = async (sahabah: Sahabi[], event: string) => {
  const prompt = `
    Create a brief historical narrative about ${event} 
    involving: ${sahabah.map(s => s.name_en).join(', ')}
    
    Make it engaging but stick to historical facts.
    Under 200 words.
  `;
  
  return await session.prompt(prompt);
};
```

#### 13. **Study Guide Generator**
```typescript
// Create study materials
const generateStudyGuide = async (topic: string, level: string) => {
  const prompt = `
    Create a ${level}-level study guide for: ${topic}
    
    Include:
    - Key points
    - Important figures
    - Timeline
    - Discussion questions
  `;
  
  return await session.prompt(prompt);
};
```

#### 14. **Citation Helper**
```typescript
// Help format citations
const formatCitation = async (source: string, style: string) => {
  const prompt = `
    Format this source in ${style} citation style:
    ${source}
  `;
  
  return await session.prompt(prompt);
};
```

#### 15. **Accessibility Features**
```typescript
// Generate alt text for graphs
const generateAltText = async (graphState: any) => {
  const prompt = `
    Generate accessible description for a graph showing:
    - ${graphState.visibleNodes} nodes
    - ${graphState.connections} connections
    - Centered on: ${graphState.focusNode}
    
    Describe the structure and key relationships.
  `;
  
  return await session.prompt(prompt);
};
```

---

## Enhanced Features You Can Add

### 1. **Streaming Responses** (Better UX)
```typescript
// Instead of waiting for full response, stream it
const streamResponse = async (prompt: string) => {
  const stream = await session.promptStreaming(prompt);
  const reader = stream.getReader();
  
  let fullResponse = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    fullResponse += value;
    // Update UI in real-time
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages[newMessages.length - 1].content = fullResponse;
      return newMessages;
    });
  }
};
```

### 2. **Session Memory** (Context Preservation)
```typescript
// Keep conversation context
class ConversationManager {
  private history: Message[] = [];
  
  async ask(question: string) {
    // Include previous messages in context
    const context = this.history
      .slice(-5) // Last 5 messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    
    const fullPrompt = `
      Previous conversation:
      ${context}
      
      User: ${question}
      Assistant:
    `;
    
    const response = await session.prompt(fullPrompt);
    this.history.push({ role: 'user', content: question });
    this.history.push({ role: 'assistant', content: response });
    
    return response;
  }
}
```

### 3. **Smart Caching** (Performance)
```typescript
// Cache common queries
const queryCache = new Map<string, { response: string, timestamp: number }>();

const cachedPrompt = async (prompt: string) => {
  const cached = queryCache.get(prompt);
  if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
    return cached.response;
  }
  
  const response = await session.prompt(prompt);
  queryCache.set(prompt, { response, timestamp: Date.now() });
  return response;
};
```

### 4. **Prompt Templates** (Consistency)
```typescript
const promptTemplates = {
  explain: (concept: string) => 
    `Explain ${concept} in the context of early Islamic history in 2-3 sentences.`,
    
  compare: (items: string[]) => 
    `Compare and contrast: ${items.join(', ')}. Focus on historical significance.`,
    
  summarize: (text: string, words: number) => 
    `Summarize in ${words} words: ${text}`,
    
  query: (intent: string, schema: string) =>
    `Convert this natural language query into a structured filter:
     Query: "${intent}"
     Schema: ${schema}
     Return JSON only.`
};
```

---

## Practical Implementation Plan

### Phase 1: Quick Wins (1-2 days)
1. ✅ Enable streaming responses for better UX
2. ✅ Add relationship explanation on edge click
3. ✅ Implement smart search query builder
4. ✅ Add biography summarization

### Phase 2: Core Features (1 week)
1. ✅ Conversation memory/context
2. ✅ Timeline narrative generator
3. ✅ Path finding explanations
4. ✅ Comparative analysis tool

### Phase 3: Advanced (2 weeks)
1. ✅ Quiz generator
2. ✅ Study guide creator
3. ✅ Multi-language support
4. ✅ Accessibility features

---

## Example: Complete Feature Implementation

### "Explain This Connection" Button
```typescript
// In GraphCanvas.tsx
const ExplainConnectionButton = ({ edge }: { edge: Relationship }) => {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleExplain = async () => {
    setLoading(true);
    
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    
    const session = await window.ai.languageModel.create();
    
    const prompt = `
      Explain the historical significance of this relationship:
      ${source.name_en} --[${edge.type}]--> ${target.name_en}
      
      Relationship category: ${edge.category}
      
      Provide a brief 2-3 sentence explanation with historical context.
    `;
    
    const response = await session.prompt(prompt);
    setExplanation(response);
    session.destroy();
    setLoading(false);
  };
  
  return (
    <Box>
      <Button onClick={handleExplain} disabled={loading}>
        {loading ? 'Thinking...' : 'Explain This Connection'}
      </Button>
      {explanation && <Typography>{explanation}</Typography>}
    </Box>
  );
};
```

---

## Limitations to Keep in Mind

### What Chrome AI **CANNOT** Do:
- ❌ Access internet or external APIs
- ❌ Store data between sessions (unless you implement it)
- ❌ Process images or audio
- ❌ Run code or execute functions
- ❌ Access your graph data directly (you must provide it in prompts)
- ❌ Guarantee factual accuracy (always verify historical claims)

### Best Practices:
1. **Always validate historical information** - AI can hallucinate
2. **Keep prompts under 2000 tokens** - Context window is limited
3. **Provide relevant context** - Include necessary data in prompts
4. **Handle errors gracefully** - Model might not always be available
5. **Cache common queries** - Save processing time
6. **Use streaming for long responses** - Better UX

---

## Quick Start: Add These Features Now

### Feature 1: Smart Search (Easiest)
```typescript
// In SahabahSidebar.tsx - replace basic search
const smartSearch = async (query: string) => {
  const session = await window.ai.languageModel.create();
  
  const prompt = `
    Parse this search query: "${query}"
    
    Extract filters for:
    - name (partial match)
    - tribe
    - prominence (high/medium/low)
    - time period (birth/death years)
    
    Return JSON: { filters: {...} }
  `;
  
  const result = await session.prompt(prompt);
  const filters = JSON.parse(result);
  
  // Apply filters to graph
  applyFilters(filters);
  
  session.destroy();
};
```

### Feature 2: Relationship Tooltips
```typescript
// In GraphCanvas.tsx - on edge hover
const getRelationshipTooltip = async (edge: Relationship) => {
  const session = await window.ai.languageModel.create();
  
  const prompt = `
    In one sentence, explain this relationship type:
    "${edge.type}" in category "${edge.category}"
  `;
  
  const explanation = await session.prompt(prompt);
  session.destroy();
  
  return explanation;
};
```

---

## Summary: What's Possible

**Basic (Already Working):**
- General Q&A about Sahabah
- Chat interface

**Easy to Add (Few Hours):**
- Smart search/filtering
- Relationship explanations  
- Biography summaries
- Timeline narratives

**Medium Effort (1-2 Days):**
- Streaming responses
- Context-aware recommendations
- Comparative analysis
- Query builder

**Advanced (1+ Week):**
- Quiz/study guide generation
- Multi-language support
- Educational storytelling
- Accessibility features

The Chrome AI API is surprisingly capable for on-device processing! The key is **prompt engineering** - crafting effective prompts that give context and structure to get useful responses.

Would you like me to implement any specific features from this list?
