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
