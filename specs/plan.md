# SahabahGraph - Revised Plan (Static Architecture)

## 1. Project Overview
SahabahGraph is a knowledge graph project designed to map and visualize the relationships between the Sahabah (Companions of Prophet Muhammad ﷺ). This revised plan adopts a **Zero-Cost Static Model** for hosting on Vercel or GitHub Pages.

## 2. Architecture (Static Model)
- **Data Source**: Neo4j (Local Development Only) or CSV/Python scripts.
- **Data Delivery**: Pre-computed `sahabah_data.json` served statically.
- **Frontend**: React 18 SPA + Cytoscape.js.
- **Search**: Client-side fuzzy search (Fuse.js).
- **Graph Logic**: Client-side path finding (BFS/Dijkstra).

## 3. Revised Development Phases

### Phase 1: Foundation (Completed)
- Ontonlogy defined (Person, Relationships).
- Initial dataset of ~200 Sahabah.
- Static JSON export pipeline.
- Basic 3-column UI with Graph Visualization.

### Phase 2: Advanced Search & Path Finding (Current)
- Implement **Fuse.js** for fuzzy search.
- Implement **Client-side Path Finding** between nodes.
- UI for multi-selection and path highlighting.

### Phase 3: Data Enrichment & Scale
- Expand dataset to 3000+ Sahabah.
- Add historical events (Battles).
- Performance optimization for larger graphs.

### Phase 4: Polish & Launch
- SEO, PWA support, Arabic RTL refinements.
- Deployment to GitHub Pages/Vercel.

---
*Last Updated: May 30, 2026*
