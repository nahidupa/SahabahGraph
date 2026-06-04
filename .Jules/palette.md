## 2025-05-22 - [Search Polish: Clear Button & Empty State]
**Learning:** Adding a "Clear" button to a search field and providing an "Empty State" with visual feedback (icon + message) significantly improves the search experience by reducing friction and providing clarity when no data matches.
**Action:** Always implement clear buttons for search inputs and descriptive empty states for lists/results to ensure a smooth user flow.

## 2024-06-05 - Browser AI Integration & RAG
**Learning:** Client-side AI using Transformers.js and WebGPU provides a powerful fallback for built-in browser APIs like Chrome's Gemini Nano. RAG can be efficiently implemented client-side by performing keyword-based retrieval on pre-loaded JSON data bundles, bypassing the need for a server-side vector database for small datasets (~1MB).
**Action:** Use Web Workers for Transformers.js inference to avoid blocking the main UI thread. Implement a dual-check for AI availability (Built-in vs. WebGPU/Transformers.js) and provide clear UI feedback (like progress bars) during model downloads.
