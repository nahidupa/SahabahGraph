# SahabahGraph

## Project Overview

**SahabahGraph** is an interactive knowledge graph and visualization platform mapping the relationships, governance networks, and historical timelines of early Islamic history, centered on the Sahabah (Companions of Prophet Muhammad ﷺ) and the early Umayyad political structure. 

The application provides three primary viewing modes:
- **Graph View**: Interactive network graph showing relationships between entities
- **Timeline View**: Chronological visualization of historical events and figure birth/death dates
- **Political View**: Interactive governance history with city-based governor timelines

## Current Implementation Status

### ✅ Completed Features

#### Core Data
- **206+ Person Entities**: Sahabah, Umayyad governors, family members
- **140+ Relationship Edges**: Family (SON_OF, SPOUSE_OF, SIBLING_OF), Governance (APPOINTED_GOVERNOR_OF, GOVERNOR_UNDER), Battles (PARTICIPATED_IN), Mentorship (TEACHER_OF), and Companionship relationships
- **8 Historical Battle Events**: Badr, Uhud, Trench, Khaibar, Mu'tah, Hunayn, Yarmouk, Qadisiyyah

#### Political Feature (NEW)
- **6 Major Cities**: Medina, Mecca, Damascus, Kufa, Basra, Fustat (Egypt)
- **21 Governor Terms**: Complete governorship history from 660–683 CE
- **10 Unique Governors**: Including Muawiya I (founder of Umayyad dynasty), Marwan ibn al-Hakam, Said ibn al-As, Al-Mughira ibn Shu'ba, Ziyad ibn Abih, and others
- **2 Caliphates**: Muawiya I era (661–680 CE) and Yazid I era (680–683 CE)
- **Interactive City Map**: Position-absolute markers for each city with geographic coordinates
- **Governor Details Panel**: Filtering by city, caliph, and termination type; links to detail view

#### Relationship Enrichment
- **Family Lineages**: Complete patrilineal chains for Umayyad governors (Al-As ibn Wa'il → Said ibn al-As → Amr ibn Said; Utba → al-Walid; Muhammad → Uthman)
- **Battle Participation**: Governors and key figures linked to historical battles
- **Spiritual Connections**: All governors marked as companions of the Prophet
- **Governance Hierarchies**: Appointment chains from Caliph → Governor relationships

#### Frontend UI
- **Vite + React + TypeScript**: Modern, strict-mode development environment
- **Interactive Graph Canvas** (Cytoscape.js): Zoomable, pannable relationship visualization with color-coded relationship types
- **Detail Panel**: Shows entity information, relationships, battles, and biographies with i18n support
- **Sidebar Search**: Full-text search with entity type filtering
- **Timeline Visualization**: Birth/death dates and historical events plotted chronologically
- **4-Language Support**: English, Arabic, Bengali, German (i18n via i18next)
- **Material-UI Components**: Professional, accessible UI with dark/light theme support
- **AI Chat Assistant** (NEW): Chrome built-in AI (Gemini Nano) powered chat for exploring the graph and answering questions about Sahabah

#### Testing & Validation
- **Playwright E2E Tests**: Graph loading, sidebar navigation, detail panel interactions
- **Vitest Unit Tests**: Component logic and utility functions
- **Data Validation**: Python validators for graph JSON consistency and political CSV integrity
- **Type Safety**: Full TypeScript strict mode with no errors

#### Deployment
- **GitHub Pages**: Automated deployment via GitHub Actions (main branch)
- **Vercel**: SPA routing and monorepo support with production-ready configuration

### 📊 Data Statistics

| Metric | Count |
|--------|-------|
| Total Entities | 206+ |
| Person Nodes | 200+ |
| Battle Nodes | 8 |
| Relationship Edges | 140+ |
| Governor Terms | 21 |
| Cities | 6 |
| Governors | 10 |
| Supported Languages | 4 |
| Frontend Build Size | 1,239.99 kB (gzip: 386.26 kB) |

## Architecture

### Frontend (`/frontend`)
- **Framework**: Vite + React 18 + TypeScript
- **Visualization**: Cytoscape.js for graph rendering
- **UI Components**: Material-UI v5
- **Internationalization**: i18next with 4 language locales
- **Testing**: Playwright E2E, Vitest unit tests
- **Build**: TypeScript strict mode, ESLint

### Data Pipeline (`/data-pipeline`)
- **Source Format**: CSV (sahabah.csv, relationships.csv, cities.csv, city_governor_terms.csv)
- **Processing**: Python scripts for data validation and JSON generation
- **Validation**: Cross-reference checks for IDs, consistency, and referential integrity
- **Output**: JSON files for frontend consumption (sahabah_data.json, political_terms.json)

### Backend (Optional)
- **GraphQL Server**: Neo4j optional integration (docker-compose.yml included)
- **Fallback**: Static JSON data loading when GraphQL unavailable

## Key Features Explained

### Graph View
Interactive network visualization showing:
- Relationship types with color coding (family, governance, battles, mentorship)
- Expandable/collapsible edges for complex relationships
- Node detail view with biographical information and relationship lists
- Filter by relationship type or entity prominence

### Timeline View
Chronological display of:
- Figure birth/death dates on a scrollable timeline
- Historical battle events with date markers
- Era highlights (Sahabi period, Umayyad era)
- Interactive tooltips with entity details

### Political View (New)
Governance history explorer featuring:
- **City Selector**: Dropdown to switch between 6 major Islamic cities
- **Governor Terms**: Chronological list of governors for the selected city with:
  - Governor name and tenure dates
  - Caliph under whom they served
  - Termination reason (dismissed, replaced, continued, etc.)
  - Historical notes and source references
- **Governor Details**: Clicking a term shows the governor's:
  - Full relationships in the main graph
  - Family ties and ascendants
  - Battle participations
  - Political appointments

### AI Chat Assistant (New)
Interactive AI-powered help using Chrome's built-in Gemini Nano:
- **Floating Chat Panel**: Accessible from any view via chat button in bottom-right
- **Local Processing**: All AI queries run entirely in your browser (privacy-first)
- **Contextual Assistance**: AI understands the SahabahGraph domain and can help with:
  - Questions about specific Sahabah and their relationships
  - Historical context and battle information
  - Navigation guidance through the graph
  - Explaining relationships and lineages
- **No API Keys Required**: Uses Chrome's native AI (requires Chrome 127+ with flags enabled)
- **Session Memory**: Chat history persists during your session

For setup instructions, see [frontend/CHROME_AI_GUIDE.md](frontend/CHROME_AI_GUIDE.md).  
To test if Chrome AI is available in your browser, open: [test-chrome-ai.html](frontend/public/test-chrome-ai.html)

## File Structure

```
SahabahGraph/
├── frontend/                    # React web application
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── Graph/          # Graph visualization
│   │   │   ├── Timeline/       # Timeline view
│   │   │   ├── Political/      # Political/governance view (NEW)
│   │   │   ├── AIChat/         # AI chat panel (NEW)
│   │   │   ├── DetailPanel/    # Entity detail display
│   │   │   ├── Sidebar/        # Search and navigation
│   │   │   └── Layout/         # Main layout
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── App.tsx             # Main application
│   │   ├── i18n/               # Internationalization
│   │   └── main.tsx            # Entry point
│   ├── public/
│   │   ├── data/               # Static data files
│   │   └── test-chrome-ai.html # AI availability test page (NEW)
│   ├── tests/                  # E2E tests (Playwright)
│   ├── CHROME_AI_GUIDE.md      # Chrome AI setup guide (NEW)
│   └── package.json
├── data-pipeline/              # Data processing
│   ├── sahabah.csv            # Person registry (206+ entries)
│   ├── relationships.csv       # Edge definitions (140+ relationships)
│   ├── cities.csv             # City metadata (6 cities)
│   ├── city_governor_terms.csv# Governor terms (21 records)
│   ├── validate_data.py       # Data consistency validator
│   ├── load_neo4j.py          # Neo4j data loader (optional)
│   └── requirements.txt
├── docker-compose.yml          # Neo4j container setup
├── Makefile                    # Development commands
├── README.md                   # This file
└── LEARNINGS.md               # Session learnings and decisions
```

## Getting Started

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Python 3** (for data pipeline)
- **Docker** (optional, for Neo4j backend)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd SahabahGraph
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install data pipeline dependencies (optional):
   ```bash
   pip install -r data-pipeline/requirements.txt
   ```

### Running the Application

#### Development Server
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Opens at `http://127.0.0.1:5173`

#### Build for Production
```bash
cd frontend
npm run build
```
Outputs optimized build to `frontend/dist/`

#### Validate Data
```bash
python3 data-pipeline/validate_data.py
```
Checks graph JSON consistency and political CSV integrity

#### Run Tests
```bash
cd frontend
npm test                  # Unit tests (Vitest)
npx playwright test      # E2E tests (Playwright)
```

### Deployment

#### GitHub Pages
Push to `main` branch—GitHub Actions automatically builds and deploys to `gh-pages`.

#### Vercel
```bash
vercel deploy
```
Uses monorepo configuration in `vercel.json` with SPA routing enabled.

#### Docker (with Neo4j backend)
```bash
docker-compose up -d
python3 data-pipeline/load_neo4j.py
```

## Data Model

### Entities (sahabah.csv)
| Field | Type | Description |
|-------|------|-------------|
| id | int | Unique identifier |
| name_ar | string | Arabic name |
| name_en | string | English name |
| gender | enum | male/female |
| is_prophet | bool | Whether entity is Prophet Muhammad |
| node_type | enum | Sahabi, PoliticalFigure, Battle, Battle_Participant |
| prominence | enum | PROPHET, ASHARA_MUBASHSHARA, BADRI, SAHABI, UMAYYAD, EVENT |
| has_parents, has_children, has_spouses | bool | Relationship flags |

### Relationships (relationships.csv)
| Type | Category | Description |
|------|----------|-------------|
| PARENT_OF, SPOUSE_OF, SIBLING_OF, SON_OF | family | Family ties |
| APPOINTED_GOVERNOR_OF, GOVERNOR_UNDER | governance | Political appointment |
| PARTICIPATED_IN | battles | Battle participation |
| TEACHER_OF, COMPANION_OF | mentorship/others | Knowledge and spiritual ties |

### Cities (cities.csv)
| Field | Description |
|-------|-------------|
| city_id | Unique identifier (madina, makkah, damascus, kufa, basra, fustat) |
| city_name_ar/en | Arabic and English names |
| lat, lng | Geographic coordinates |
| map_x, map_y | UI canvas positions |
| region | Geographic region (Hijaz, Levant, Iraq, Egypt) |

### Governor Terms (city_governor_terms.csv)
| Field | Description |
|-------|-------------|
| term_id | Unique term identifier |
| city_id | Foreign key to cities |
| governor_id | Foreign key to sahabah (person entity) |
| caliph_id | Caliph under whom governor served |
| start_year_ce, end_year_ce | Common Era dates |
| termination_type | How term ended (Dismissed, Replaced, Continued, etc.) |

## Historical Period Covered

**Primary Focus**: Early Umayyad Era (660–683 CE / 40–63 AH)
- **Muawiya I**: First Umayyad Caliph (r. 661–680 CE), established dynasty from Damascus
- **Yazid I**: Second Umayyad Caliph (r. 680–683 CE), period of political instability

**Secondary Context**: Early Islamic Period (610–660 CE)
- Sahabi companions of Prophet Muhammad
- Four Rightly Guided Caliphs era
- First civil conflict period

## Future Enhancements

### Phase 2: Extended Coverage
- Additional cities (Baghdad, Kufah governor expansion, etc.)
- More governors and administrators
- Expanded family trees for major figures

### Phase 3: Advanced Features
- Political timeline lane in Timeline View showing governance tenure
- Search by relationships ("Who governed which cities?", "Show all descendants of X")
- Statistical analysis (most connected figures, governance patterns)
- Comparative governor analysis
- Animated timeline showing power transitions

### Phase 4: Enhanced Data
- Primary source citations and references
- Biographical text with era context
- Spouse and family enrichment for governors
- Battle participation for additional figures
- Regional and tribal alliance networks

## Technologies Used

| Category | Technologies |
|----------|---------------|
| **Frontend** | React 18, TypeScript, Vite, Material-UI 5, Cytoscape.js |
| **Internationalization** | i18next, React-i18next |
| **Testing** | Playwright, Vitest |
| **Data Processing** | Python 3, CSV, JSON |
| **Validation** | Custom Python validators |
| **Deployment** | GitHub Actions, GitHub Pages, Vercel |
| **Optional Backend** | Neo4j, Docker, GraphQL |
| **Development** | ESLint, TypeScript strict mode, Vite build system |

## Contributing

To contribute data, improvements, or features:

1. Verify data accuracy against historical sources
2. Update CSV files in `/data-pipeline/`
3. Run validation: `python3 data-pipeline/validate_data.py`
4. Ensure frontend builds: `cd frontend && npm run build`
5. Submit a pull request with description of changes

## Data Sources & References

Historical data sourced from:
- Islamic historical texts and biographies (Sirat Ibn Hisham, Al-Isabah)
- Wikipedia articles on Islamic governance and governors
- Scholarly references on early Islamic administration
- Academic works on Umayyad dynasty structure

## License

[Specify your project license here]

## Contact & Support

For questions, suggestions, or collaboration:
- Open an issue in the repository
- Provide historical sources for data accuracy
- Suggest features or improvements