# Sahabah Relationship Graph Explorer – Technical Project Plan

## 1. Project Overview
This project aims to build an interactive web application for exploring the genealogical and relational networks of the **Sahabah** (Companions of Prophet Muhammad ﷺ). The core experience lets users search a directory of Companions, view their immediate family and other ties, and dynamically map how multiple Companions are connected—be it through blood, marriage, mentorship, or shared historical events.

### Vision
> A visual time machine through the social fabric of early Islam, where every relationship is a thread that weaves the story of the Companions.

### Key Deliverables
- Fully searchable, paginated Sahabah directory (left panel)
- Interactive graph canvas (centre) with real-time layout, zoom, and drag
- “Add to Graph” mechanic: select multiple Companions and instantly see their relational paths
- Rich detail panel (right) for biographical info on click/hover
- Multiple relationship types: parent–child, spouse, sibling, teacher–student, tribe/clan, battle co-participation
- Shortest‑path highlighting and automatic expansion to reveal connections
- Multilingual support (Arabic primary names + English transliteration) and RTL layout readiness

---

## 2. Expanded Feature Set

### 2.1 Core Features
1. **Searchable Sahabah Directory (Left Panel)**  
   - Type-ahead search with fuzzy matching on Arabic name, English transliteration, or nickname (kunyah).  
   - Filter by tribe, era (Makkan/Madinan), prominent role (e.g., scribe, warrior).  
   - Click to add a Sahabi to the central graph as a focal node.

2. **Graph Visualizer (Centre)**  
   - Renders an ego-network graph initially (selected Sahabi + 1st-degree relatives).  
   - Nodes colour-coded by relationship type or gender.  
   - Edges labelled with relationship (e.g., “Son of”, “Wife of”).  
   - Expand/collapse nodes to load 2nd-degree connections on demand.  
   - Multiple selected Companions: the system computes and draws the minimal connecting subgraph (shortest paths, common ancestors).  
   - Advanced layout algorithms (hierarchical for family trees, force-directed for complex networks).  
   - Interactive: drag nodes, zoom, click to select, hover for quick info tooltip.

3. **Relationship Path Finder**  
   - When two (or more) nodes are selected, highlight all relationship chains between them.  
   - Display a textual summary: “Umar ibn al-Khattab is connected to Abu Bakr as-Siddiq via: Umar – Hafsa (daughter) – Prophet Muhammad (husband) – Aisha (daughter) – Abu Bakr.”  
   - Option to hide intermediate nodes or lock them for further exploration.

4. **Detail Panel (Right)**  
   - Full biographical snippet: lineage, birth/death, notable facts.  
   - List of all known relations, grouped by type, with click-to-navigate capability.  
   - Quick action buttons: “Add spouse”, “Show parents”, “Find connection with…”  

### 2.2 Extended / Future Features
- **Timeline overlay**: Align nodes on a horizontal time axis to visualise historical overlap.  
- **Tribal map**: Group Sahabah by tribe/sub-tribe and show inter-tribal marriage alliances.  
- **Hadith transmission chains**: Teacher–student edges, chain of narration (isnad) visualisation.  
- **Battle participation**: Highlight participants of Badr, Uhud, etc., with coloured halos.  
- **Export graph** as PNG/SVG or embeddable iframe.  
- **User accounts** to save custom graphs, notes, and bookmarks.  
- **Admin panel** for data curators to add/update entities and relationships.

---

## 3. Data Model & Graph Schema
We adopt a property‑graph model, ideally stored in a graph database (Neo4j) for optimal relationship traversals.

### Node Labels
- **Person**
  - `id`: UUID
  - `name_ar`: الاسم العربي (primary)
  - `name_en`: English transliteration (e.g., “Abu Bakr as-Siddiq”)
  - `kunyah`: (كنية)
  - `laqab`: (لقب)
  - `birth_year_hijri`: integer
  - `death_year_hijri`: integer
  - `gender`: MALE | FEMALE
  - `tribe`: reference to Tribe node or string
  - `prominence`: SAHABI | BADRI | ASHARA_MUBASHSHARA | etc.
  - `biography_short`: text (plain/markdown)
  - `biography_source`: citation
  - `created_at`, `updated_at`

### Relationship Types (Edges)
| Relationship Type | Property | Direction example |
|-------------------|----------|-------------------|
| `PARENT_OF`       | –        | (Father)-[:PARENT_OF]->(Child) |
| `CHILD_OF`        | (inverse of above, often stored both ways for ease) | |
| `SPOUSE_OF`       | `marriage_order`: int, `notes` | (Husband)-[:SPOUSE_OF]->(Wife) |
| `SIBLING_OF`      | `type`: FULL/HALF, `shared_parent` ref | (A)-[:SIBLING_OF]->(B) |
| `TEACHER_OF`      | `subject`: string (e.g., “Hadith”) | (Teacher)-[:TEACHER_OF]->(Student) |
| `SAME_TRIBE`      | (denormalised or inferred via Tribe node) | |
| `PARTICIPATED_IN` | `battle_name`, `role` | (Person)-[:PARTICIPATED_IN]->(Event) |

We will maintain **bidirectional** relationships (e.g., both `PARENT_OF` and `CHILD_OF`) for simpler querying, or rely on the graph database’s ability to traverse undirected paths.

---

## 4. Technical Stack

### 4.1 Frontend
- **Framework**: React 18+ with TypeScript  
- **State Management**: Redux Toolkit (or Zustand) for global app state (selected nodes, graph data cache).  
- **Graph Rendering**:  
  - Primary option: **Cytoscape.js** (well‑suited for complex biological/social networks, highly customisable, good React wrapper `react-cytoscapejs`).  
  - Alternative: `vis-network` (simpler) or `react-force-graph` (3D flair).  
- **UI Components**: Material‑UI (MUI) v5 for left/right panels, search, dialogs – supports RTL.  
- **Routing**: React Router v6 for potential multi‑page setup (e.g., dedicated list view, graph view).  
- **API Communication**: Apollo Client (GraphQL) or Axios (REST). GraphQL recommended for flexible graph queries.

### 4.2 Backend
- **Runtime**: Node.js with TypeScript (NestJS) or Python (FastAPI). Node.js integrates smoothly with frontend.  
- **Graph Database**: **Neo4j** (Community Edition). Query via **Cypher** directly or through an OGM (Neo4j‑GraphQL‑JS).  
- **API Layer**: GraphQL endpoint auto‑generated by `@neo4j/graphql` library – drastically reduces boilerplate. Enables queries like:
  ```graphql
  person(where: {name_en: "Umar ibn al-Khattab"}) {
    name_ar
    children { name_en }
    spouses { name_en }
  }
  ```
- **Authentication (future)**: JWT + OAuth2 if user accounts added.  
- **Caching**: Redis for heavy‑use queries (e.g., shortest path results).  
- **Data Import Pipeline**: Scripts (Python) to transform curated CSVs/JSON into Neo4j `LOAD CSV` commands.

### 4.3 Infrastructure & DevOps
- **Hosting**:  
  - Frontend: Vercel / Netlify (static site + serverless functions if needed).  
  - Backend + Database: single VPS (DigitalOcean / Hetzner) with Docker Compose (Neo4j + API server).  
- **CI/CD**: GitHub Actions to test, build, deploy.  
- **Monitoring**: Basic logging (Winston), error tracking (Sentry).

---

## 5. System Architecture Diagram (Logical)
```
[Browser] ──> [React App]
                ├─ Left Panel (Search/List)
                ├─ Graph Canvas (Cytoscape)
                └─ Right Panel (Detail)
                     ↓ GraphQL queries
                [GraphQL Gateway (Node.js)]
                     ↓ Cypher translation
                [Neo4j Database]
                     ↑
                [Data Import Service] ← [Curated Datasets (CSV/JSON)]
```

---

## 6. UI/UX Design Specifications

### Layout
- **Responsive**, but initially optimised for desktop (1440px+).  
- Three‑column layout:
  - **Left side panel** (w‑300px, collapsible): Search bar at top, scrollable list/grid of Sahabah with thumbnail (calligraphic name) and quick info.  
  - **Central canvas** (flex‑1): Full‑height graph with floating toolbar (zoom, layout controls, export, toggle relationship types).  
  - **Right detail panel** (w‑350px, collapsible): Sliding panel or permanent. Shows selected node’s biography.

### Interaction Flows
1. **Search & Add Node**  
   User types name → dropdown of matches → click “Add to Graph”. The graph zooms to the new node and immediately expands its 1st‑degree relations.

2. **Multiple Node Relationship Discovery**  
   - Ctrl+click (or toggle checkbox in list) to multi‑select.  
   - “Show Connections” button in toolbar.  
   - Graph updates: all nodes repositioned to fit the minimal connecting subgraph. Paths between selected nodes are highlighted (animated pulse).  
   - A “Connection Summary” panel appears at the bottom, listing textual chains.

3. **Node Expansion**  
   Right‑click or double‑click a node to “Expand” – fetches hidden relatives and renders them.

4. **Filtering & Customization**  
   Legend toggle to hide/show relationship types.  
   Slider to adjust node degree displayed (1–3 hops).

### Accessibility & Internationalisation
- Full Arabic interface with RTL switch.  
- Keyboard navigation for graph nodes (tab, enter to expand).  
- Colour scheme accessible (WCAG AA) and distinct enough for up to 7–8 relationship edge colours.

---

## 7. Development Phases & Milestones

### Phase 1: Foundation & Data Modeling (Weeks 1–3)
- **Tasks**  
  - Finalise ontology (person, relationship types, attributes).  
  - Gather initial dataset: start with the ~200 most prominent Sahabah (Ashara Mubashshara, Badr participants, close family of the Prophet). Source from works like “Al-Isabah” and existing digital libraries.  
  - Build data import scripts (Python) to clean, de‑duplicate, and load into Neo4j.  
  - Set up development environment (Docker with Neo4j + API scaffold).  
- **Milestone**: Seed database with 200+ nodes and 500+ relationships. Cypher queries return correct ego networks.

### Phase 2: Backend API & Graph Queries (Weeks 4–6)
- **Tasks**  
  - Define GraphQL schema using `@neo4j/graphql`.  
  - Implement custom resolvers for:  
    - Shortest path between two persons (weighted? unweighted).  
    - Search with fuzzy matching (using Neo4j’s `apoc.text.fuzzyMatch` or full‑text index).  
    - Ego‑network expansion (1–3 hops).  
  - Integrate Redis for caching frequent “path” requests.  
  - Create REST endpoints as fallback (e.g., `GET /search?q=...`).  
- **Milestone**: GraphQL playground returns all required data shapes. Unit tests for path algorithms pass.

### Phase 3: Frontend Core UI (Weeks 7–9)
- **Tasks**  
  - Bootstrap React app with MUI and RTL support.  
  - Build left panel with virtualised list (react‑window) and search component.  
  - Integrate `react-cytoscapejs` with a custom style sheet.  
  - Implement graph rendering: node/edge styling, initial layout (CoSE or dagre for family trees).  
  - Connect left panel “Add” to GraphQL mutation (actually just adding node ID to selection state, fetching data).  
  - Basic detail panel: click node → fetch details → show in right panel.  
- **Milestone**: User can search, add 2 Companions, see their individual networks, and pan/zoom.

### Phase 4: Multi‑Node Relationship & Path Visualisation (Weeks 10–11)
- **Tasks**  
  - Implement multi‑selection logic (Ctrl+click, checkbox).  
  - “Show Connections” triggers API call for all‑pairs shortest paths.  
  - Graph dynamically merges the new path data, highlights the path edges (animated), and fits bounds.  
  - Connection summary panel with textual description.  
  - Optimise layout transitions (animate positions smoothly).  
- **Milestone**: Selecting any two Companions reveals their full kinship path.

### Phase 5: Data Enrichment & Scale (Weeks 12–13)
- **Tasks**  
  - Scale dataset to 3000+ Companions (crowdsourced or manual entry team).  
  - Add event nodes (Battles) and link participants.  
  - Teacher–student relationships for major Hadith transmitters.  
  - Implement performance optimisations (virtualised graph for large networks, level‑of‑detail).  
  - User testing, bug fixes, and UI polish.  
- **Milestone**: Graph can handle ego‑networks up to 50 nodes without lag.

### Phase 6: Launch Preparation (Week 14)
- **Tasks**  
  - SEO & metadata, Open Graph tags for sharing.  
  - PWA setup (service worker for offline search).  
  - Write documentation, “How to use” overlay.  
  - Deploy to production, configure domain, SSL.  
- **Milestone**: Public beta release.

---

## 8. API Design (GraphQL Example)
```graphql
type Query {
  searchPersons(query: String!, limit: Int = 10): [Person!]!
  person(id: ID!): Person
  connections(ids: [ID!]!): ConnectionResult!
  expandNode(id: ID!, hops: Int = 1): [Person!]!
}

type Person {
  id: ID!
  name_ar: String!
  name_en: String!
  gender: Gender
  children: [Person!]!
  parents: [Person!]!
  spouses: [Person!]!
  siblings: [Person!]!
  teachers: [Person!]!
  students: [Person!]!
  # ... other fields
}

type ConnectionResult {
  paths: [Path!]!
  summary: String!
}

type Path {
  length: Int!
  nodes: [Person!]!
  edges: [Relationship!]!
}
```

---

## 9. Potential Challenges & Mitigations

| Challenge | Mitigation |
|-----------|------------|
| **Data accuracy & completeness** | Phase data roll‑out; collaborate with Islamic scholars & existing open‑source projects (e.g., Shamela, Sahabi.org). Implement a user‑feedback loop with “suggest edit” feature. |
| **Ambiguous relationships** (multiple persons with same name) | Use unique IDs; disambiguate via lineage (father’s name) in UI during search. |
| **Graph visualisation performance** | Leverage WebGL renderer (Cytoscape’s `canvas` or `webgl`), limit initial view to 50–100 nodes, lazy expand. |
| **Shortest path explosion** in dense networks | Cap path length (e.g., ≤ 6 edges); cache common paths; use bidirectional BFS in Cypher. |
| **RTL / Arabic font rendering in canvas** | Cytoscape supports labels as HTML via extensions; use proper Arabic web fonts and direction testing. |
| **Hosting cost of Neo4j** | Start with community edition on a modest VPS; for scaling, migrate to Neo4j AuraDB free tier or managed instance. |

---

## 10. Conclusion
This project plan lays out a comprehensive roadmap to create a unique, scholarly, and visually compelling tool that brings the interconnected lives of the Sahabah to a global audience. By combining robust graph database technology with an intuitive frontend, we can empower users—from students of Islamic history to researchers—to explore the rich human tapestry of early Islam. The phased approach ensures we deliver a functional MVP quickly while allowing for organic growth of data and features.

---
*Next steps: Assemble a multi-disciplinary team (developer, UI/UX designer, Islamic history data curator), set up the repository, and begin Phase 1 data modeling.*