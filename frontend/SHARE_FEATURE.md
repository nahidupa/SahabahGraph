# Share Graph Feature

## Overview
Users can now share their current graph view with others via URL. The shared URL contains encoded node IDs, allowing recipients to see the exact same graph configuration.

## How to Use

### Sharing a Graph
1. Build your graph by adding nodes
2. Click the **Share** button (📤) next to the view toggle buttons at the top
3. The share URL is automatically copied to your clipboard
4. Share the URL with others via email, chat, etc.

### Opening a Shared Graph
1. Click on a shared URL (e.g., `https://yourapp.com/?nodes=1-2-3-4`)
2. The application automatically loads the shared graph with all nodes and their relationships
3. The graph displays exactly what the sharer saw

## Technical Details

### URL Format
- **Parameter**: `?nodes=1-2-3-4`
- **Encoding**: Node IDs separated by dashes, sorted numerically
- **Example**: `?nodes=0-1-2-4-7` shows Muhammad (PBUH), Abu Bakr, Umar, Ali, and Abdur Rahman

### Features
- ✅ Minimal URL size (only node IDs, no positions or styling)
- ✅ Automatic relationship loading (edges between shared nodes)
- ✅ Fallback to localStorage if no shared URL
- ✅ One-click copy to clipboard
- ✅ Visual feedback (snackbar notification)

### Implementation Files
- `/src/utils/shareGraph.ts` - Core encoding/decoding utilities
- `/src/App.tsx` - Share button and URL handling
- `/src/utils/shareGraph.test.ts` - Unit tests

## Examples

**Share Muhammad and the 4 Rashidun Caliphs:**
```
https://yourapp.com/?nodes=0-1-2-3-4
```

**Share Battle of Badr participants:**
```
https://yourapp.com/?nodes=0-1-2-16-18-19-243
```

## Future Enhancements
- Add view mode to URL (graph/timeline/political)
- Save node positions for exact layout reproduction
- Short URL generation for large graphs
- QR code generation for mobile sharing
