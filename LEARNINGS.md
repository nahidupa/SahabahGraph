# Learnings - SahabahGraph Static Model Implementation

## Architectural Decisions
- Switched to a **static deployment model** for zero-cost hosting.
- Data is pre-computed and stored in `frontend/public/data/sahabah_data.json`.
- This avoids the need for a live Neo4j database in production, while still allowing for rich relationship mapping.

## Frontend Implementation
- **Cytoscape.js** was used for the graph visualization. It handles complex layouts (like `cose`) and custom styling well.
- **MUI** provided a clean 3-column layout (Search/List, Canvas, Detail).
- **Expand/Collapse Logic**: Instead of loading the entire graph at once, nodes are added dynamically when the user clicks on relationship categories (sons, daughters, etc.) in the detail panel. This keeps the visualization performant and readable.

## Data Pipeline
- A Python script `generate_mock_data.py` now generates both CSVs (for local Neo4j use) and the JSON required for the static frontend.
- Included special flags like `is_prophet` and `gender` to satisfy UI requirements (Star icon for Prophet PBUH, gender-specific avatars).

## Testing
- Playwright was set up for E2E testing.
- Verified that the main application loads and displays the list of Sahabah.

## Data Enrichment & Pipeline
- **Enrichment Process**: Data is enriched by identifying missing historical figures and events (e.g., from Wikipedia) and mapping them to the existing graph structure.
- **Governor Timelines**: The `city_governor_terms.csv` file serves as the source of truth for governance timelines, linking cities to political figures across different caliphates.
- **Pipeline Workflow**:
    1.  `generate_mock_data.py`: Central script to define nodes and relationships. It must be kept in sync with the CSVs to avoid data loss.
    2.  `export_json.py`: Synchronizes the source CSVs with the frontend JSON artifacts (`sahabah_data.json` and `political_terms.json`).
    3.  `validate_data.py`: Ensures data integrity, checking for broken links, date inconsistencies, and missing term data.
- **Handling Dates**: Pre-Hijri dates are represented as negative integers. Validation logic must account for this to correctly check birth/death order and parent-child age gaps.
- **Graph Expansion**: The UI uses `has_*` boolean flags on nodes to determine if expansion buttons should be enabled, improving performance by avoiding unnecessary link searches in the frontend.
## 2024-05-22 - Onboarding Tour UI Fix
**Learning:** Tooltips rendered inside containers with 'overflow: hidden' can be clipped. Moving them to a higher level in the component tree avoids this. React-Joyride's beacon can be disabled with 'disableBeacon: true' to show tooltips directly, and persistence should be handled by marking 'seen' status on both completion and manual closure (ACTIONS.CLOSE).
**Action:** Relocated OnboardingTour to a top-level 'tour' prop in MainLayout and updated callback logic.
