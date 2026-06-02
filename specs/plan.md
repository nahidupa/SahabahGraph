# Project Plan: SahabahGraph

## 1. Executive Summary
SahabahGraph is a knowledge graph visualization tool designed to explore the interconnected lives of the Sahabah (companions of the Prophet Muhammad ﷺ). The project has evolved from a live-database architecture to a **Zero-Cost Static Model**, optimizing for performance, accessibility, and maintenance.

---

## 2. Historical Perspective (Original Vision)
Initially, the project was envisioned as a dynamic application with a live graph database backend.
- **Backend**: Node.js (NestJS) with a GraphQL API.
- **Database**: Neo4j (Community Edition) hosted on a VPS.
- **Features**: Real-time updates, shortest path calculations via Cypher, and user accounts.
- **Infrastructure**: Dockerized environment with Redis for caching and Sentry for monitoring.

---

## 3. Current State (Zero-Cost Static Implementation)
The project currently operates as a high-performance, static Single Page Application (SPA) to eliminate hosting costs and maximize speed.

### 3.1 Architecture
- **Frontend**: React 19 + TypeScript + Material-UI (MUI) v6.
- **Data Layer**: Pre-computed JSON bundles (`sahabah_data.json`, `political_terms.json`) generated from a local Neo4j instance.
- **Graph Engine**: Cytoscape.js with custom styling and multiple layouts (CoSE, Dagre, Cola, Euler).
- **Internationalization**: Full support for English, Arabic (RTL), Bangla, and German.
- **Hosting**: Vercel (Production) / Local Static Server.

### 3.2 Key Features (Implemented)
- **Interactive Graph**: Drag-and-drop nodes, relationship expansion, and automated layouts.
- **AI Chat Panel**: Integrated assistant for natural language queries about the Sahabah and graph controls.
- **Timeline View**: Multi-lane visualization of lifespans, battles, and political terms.
- **Political Map**: Schematic visualization of governor appointments and regional history.
- **Pathfinding**: Client-side Dijkstra algorithm (Web Worker) for finding connections between Sahabah.
- **Search & Filter**: Fuzzy search by name, kunyah, or laqab; filtering by tribe and prominence.
- **Sharing & Export**: Shareable URLs for graph states and PNG/SVG export.

### 3.3 Data Pipeline
- **Source of Truth**: `data-pipeline/sahabah.csv` and specialized CSVs for relationships and political terms.
- **Enrichment**: Python scripts using Wikidata and historical texts for biographical data.
- **Validation**: Automated checks for chronological consistency and relationship integrity.
- **Export**: Scripts to transform the Neo4j knowledge base into optimized JSON for the frontend.

---

## 4. Technical Stack Detail
- **Frontend**: React 19, TypeScript, Vite, Vitest, Playwright.
- **Styling**: MUI v6, Emotion, Stylis (RTL support).
- **Graph**: Cytoscape.js, `react-cytoscapejs`, various layout extensions.
- **State Management**: React Context & Hooks (Current); Redux Toolkit (On-Hold).
- **Pipeline**: Python 3.12, Neo4j (Local), `urllib.request`.

---

## 5. Roadmap & Future Plans

### Phase A: Polish & Visibility (Near Term)
- **PWA Support**: Implement service workers and manifest for offline access.
- **SEO & OpenGraph**: Enhance metadata for better social sharing and search ranking.
- **Onboarding**: Refine the Joyride-based tour for new users.

### Phase B: Scaling & Depth (Mid Term)
- **Dataset Expansion**: Target 3000+ Sahabah nodes.
- **Enhanced Visuals**: Explore WebGL renderers for larger graph clusters.
- **Advanced Pathfinding**: Pre-compute complex historical chains for instant retrieval.

### Phase C: Infrastructure Evolution (Long Term / On-Hold)
- **Neo4j Production**: Transition back to a live DB (e.g., Neo4j Aura) if data volume exceeds static limits.
- **User Contributions**: Implement a "Suggest Edit" system with a backend for review.
- **Authentication**: JWT-based accounts for saved views (Marked as **On-Hold**).
- **Monitoring & Caching**: Redis and Sentry (Marked as **On-Hold**).

---

## 6. Development Philosophy
- **Zero-Cost**: Prioritize static and serverless solutions.
- **Scholarly Accuracy**: Maintain rigorous validation of historical dates and relationships.
- **Accessibility**: Ensure the tool is usable across different languages and device types.
