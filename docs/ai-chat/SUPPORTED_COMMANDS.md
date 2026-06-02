# Supported AI Commands

This document lists **ALL** commands that the SahabahGraph AI Assistant can execute. The AI is explicitly trained to use ONLY these commands and will reject attempts to use unsupported commands.

## ✅ Supported Commands (6 total)

### 1. `clear` - Clear the Canvas
**Purpose**: Remove all nodes from the graph canvas

**Usage**:
- "Clear the canvas"
- "Reset the graph"
- "Start over"

**JSON**:
```json
{"type":"command","actions":[{"action":"clear","params":{}}]}
```

### 2. `focus` - Focus on a Person
**Purpose**: Highlight and center a specific person in the graph

**Usage**:
- "Show me Abu Bakr"
- "Focus on Umar"
- "Highlight Ali ibn Abi Talib"

**JSON**:
```json
{"type":"command","actions":[{"action":"focus","params":{"name":"Abu Bakr"}}]}
```

**Parameters**:
- `name` (required): Person's name (English or Arabic)

### 3. `add` - Add Person to Graph
**Purpose**: Add one or more people to the graph canvas

**Usage**:
- "Add Abu Bakr"
- "Show Umar and Ali"
- "Add all Ashara Mubashshara"

**JSON (single)**:
```json
{"type":"command","actions":[{"action":"add","params":{"name":"Abu Bakr"}}]}
```

**JSON (multiple)**:
```json
{"type":"command","actions":[
  {"action":"add","params":{"name":"Abu Bakr"}},
  {"action":"add","params":{"name":"Umar ibn al-Khattab"}},
  {"action":"add","params":{"name":"Ali ibn Abi Talib"}}
]}
```

**Parameters**:
- `name` (required): Person's name to add

### 4. `search` - Search Database
**Purpose**: Search for people by name or keyword

**Usage**:
- "Search for Badr"
- "Find people named Ahmad"
- "Search Umayyad governors"

**JSON**:
```json
{"type":"command","actions":[{"action":"search","params":{"term":"Badr"}}]}
```

**Parameters**:
- `term` (required): Search keyword

### 5. `view` - Switch View Mode
**Purpose**: Change between graph, timeline, and political views

**Usage**:
- "Switch to timeline view"
- "Show political view"
- "Go to graph view"

**JSON**:
```json
{"type":"command","actions":[{"action":"view","params":{"view":"timeline"}}]}
```

**Parameters**:
- `view` (required): One of `"graph"`, `"timeline"`, or `"political"`

### 6. `zoom` - Zoom Control
**Purpose**: Zoom in/out or reset zoom level

**Usage**:
- "Zoom in"
- "Zoom out"
- "Reset zoom"

**JSON**:
```json
{"type":"command","actions":[{"action":"zoom","params":{"direction":"in"}}]}
```

**Parameters**:
- `direction` (optional): `"in"`, `"out"`, or omit for reset

---

## ❌ Unsupported Commands

The AI will **NOT** execute these commands and will provide helpful alternatives:

| Command | User Intent | Correct Alternative |
|---------|-------------|-------------------|
| `draw` | Draw on canvas | Use `add` to add people |
| `expand` | Show relationships | Relationships appear automatically when you add people |
| `show_relationships` | Display connections | Connections load automatically from database |
| `highlight` | Emphasize a person | Use `focus` instead |
| `remove` | Delete a node | Use `clear` to reset (individual removal not supported) |
| `delete` | Remove from graph | Use `clear` to reset |
| `connect` | Create relationship | Relationships come from historical database (cannot be modified) |
| `filter` | Filter by criteria | Use `search` to find specific people |

### How the AI Handles Unsupported Commands

When you request an unsupported feature, the AI will:

1. **Explain why it's not supported**
2. **Suggest the correct alternative**
3. **Offer to help with related actions**

**Example**:

**User**: "Expand their relationship"

**AI Response**:
> "Relationships are shown automatically when you add people to the graph. I cannot expand or modify relationships - they come from the historical database.
>
> I've already added Abu Bakr, Umar, and Ali. You should see connection lines showing:
> • Family relationships (father-child, spouses)
> • Shared battle participation
> • Companionship during the Prophet's time
>
> Would you like me to add more related figures to see additional connections?"

---

## 🎯 Command Best Practices

### Multiple Commands
You can combine multiple actions in one request:

**User**: "Clear the canvas and add the first three caliphs"

**AI executes**:
```json
{"type":"command","actions":[
  {"action":"clear","params":{}},
  {"action":"add","params":{"name":"Abu Bakr"}},
  {"action":"add","params":{"name":"Umar ibn al-Khattab"}},
  {"action":"add","params":{"name":"Uthman ibn Affan"}}
]}
```

### Name Variations
The AI understands various name formats:
- Full names: "Umar ibn al-Khattab"
- Short names: "Umar"
- Common spellings: "Abu Bakr", "Abubakr", "Abu-Bakr"
- Arabic names: "عمر بن الخطاب"

### Conversational Requests
You can use natural language instead of command syntax:
- ✅ "Show me Abu Bakr" (natural)
- ✅ "Add Abu Bakr" (direct)
- ❌ "execute focus Abu Bakr" (too technical)

---

## 🔍 Command Limitations

### What the AI CAN do:
- ✅ Add people from the database (206 available)
- ✅ Focus on existing people
- ✅ Search by name or keyword
- ✅ Switch between pre-defined views
- ✅ Clear the canvas
- ✅ Control zoom level

### What the AI CANNOT do:
- ❌ Add custom people not in the database
- ❌ Modify relationships
- ❌ Create new connections
- ❌ Remove individual nodes (must clear all)
- ❌ Change node colors or styles
- ❌ Export or save graphs
- ❌ Edit biographical data
- ❌ Draw custom graphics

---

## 📚 Related Documentation

- **[AI Commands Guide](./AI_COMMANDS_GUIDE.md)** - User-friendly guide with examples
- **[Chrome AI Implementation](./CHROME_AI_IMPLEMENTATION.md)** - Technical details
- **[Test Suite](../../frontend/src/components/AIChat/README_TESTS.md)** - Command validation tests

---

## 🐛 Reporting Issues

If the AI tries to use an unsupported command:
1. Note the exact command it attempted
2. Share the conversation context
3. Report in GitHub issues

The AI is trained to avoid unsupported commands, but edge cases may occur.
