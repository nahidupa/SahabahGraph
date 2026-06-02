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

## 2026-06-02 - React-Joyride v3 Migration
**Problem:** Build failed in CI/CD with TypeScript errors after merging PR #32 tour improvements. The @types/react-joyride package was a stub - react-joyride v3.1.0 provides built-in TypeScript definitions.
**Breaking Changes in v3:**
- `disableBeacon` → `skipBeacon`
- `callback` prop → `onEvent` prop
- `CallBackProps` type → `EventData` type
- `disableOverlayClose` prop → `overlayClickAction: false`
- Callback signature changed from `(data: CallBackProps) => void` to `(data: EventData) => void`
**Solution:** Removed @types/react-joyride package, updated OnboardingTour.tsx to use v3 API with correct property names and types.
**Result:** Build passes, all tests green, deployment successful.

## 2026-06-02 - Initial Graph Load Optimization
**Problem:** App was loading Prophet + 4 major Sahabah + ALL their family members on initial load, resulting in 20-30+ nodes displayed at once. This created visual clutter and poor first impression.
**Solution:** Implemented balanced initial load strategy:
- Reduced core nodes from 5 to 3 (Prophet, Abu Bakr, Umar)
- Added node limit of 10 maximum for initial display
- Prioritized Prophet's family relationships over others
- Added logic to only include edges when both nodes are present
**Result:** Clean, focused initial view with 8-10 nodes showing the most important figures and their key relationships. Users can expand to explore more through the detail panel.

## 2026-06-02 - Tour Timing Fix (Critical)
**Problem:** Tour was not appearing on first visit - "initially nothing show up". The tour component was trying to target DOM elements (like `#tour-sidebar`) before they were rendered, causing the tour to fail silently.
**Root Cause:** Tour's `run` state was set to `true` immediately on mount when `!localStorage.getItem('hasSeenTour')`, but graph data was still loading asynchronously.
**Solution:** Implemented data-driven tour initialization:
1. Added `dataLoaded` state that tracks when graph initialization completes
2. Tour only starts via `useEffect` after `dataLoaded === true` AND `!hasSeenTour`
3. Added 500ms delay after data loads to ensure DOM is fully ready
4. Set `dataLoaded = true` after `setElements()` completes
**Tour Positioning Improvements:**
- Changed placement from `'right'` → `'bottom'` → `'right-start'` for better positioning
- Reduced tooltip width to 320px (from 360px) for narrower footprint
- Added `spotlightClicks={false}`, `hideCloseButton={false}`, `disableScrolling={false}`
- Added semi-transparent overlay styling `rgba(0, 0, 0, 0.5)`
**Result:** Tour now appears reliably on first visit after a brief loading period, with proper positioning at top-right of sidebar.

## 2026-06-02 - Prophet Node Star Rendering (Type Mismatch Bug)
**Problem:** Prophet Muhammad (PBUH) node was rendering as a gray circle instead of a gold star. When clearing canvas and re-adding the Prophet from sidebar, it stayed gray instead of becoming a star.
**Root Cause:** Cytoscape.js CSS selector type mismatch:
- Data has `is_prophet: true` (boolean)
- GraphCanvas.tsx selector: `node[is_prophet = "true"]` (string comparison)
- Boolean `true` !== string `"true"` → selector never matched → Prophet styling not applied
**Solution:** Convert `is_prophet` to string in ALL node creation paths:
1. `addNodeToGraph` - sidebar + button (was missing, caused re-add bug)
2. Initial load - 3 places where nodes are created
3. `expandRelationships` - 2 places (selected node + related nodes)  
4. `handleShowConnections` - pathfinding results
Add `is_prophet: String(node.is_prophet)` when creating Cytoscape element data.
**Lesson:** Cytoscape attribute selectors perform strict type matching. Always convert boolean/number attributes to strings when using them in selectors.
**Result:** Prophet node now consistently renders as ⭐ gold star (80px, #ffd700) regardless of how it's added to the canvas.

## 2026-06-02 - Canvas State Persistence with localStorage
**Problem:** Users modify the canvas (add/remove nodes, arrange layout), but changes disappear on page refresh. Each reload resets to default initial view, losing all work.
**Requirements:**
- Save canvas state automatically when user makes changes
- Restore saved state on page reload
- Preserve node positions (not just which nodes, but their layout)
- Clear saved state when user explicitly clears canvas
- Debounce saves to avoid performance issues
**Solution:** Implement localStorage persistence with smart save/restore:
1. **Auto-save on change:** useEffect monitors `elements` state, saves to localStorage after 500ms debounce
2. **Position preservation:** Extract positions from Cytoscape instance before saving
3. **Restore on load:** Check localStorage before loading default data in `initializeData()`
4. **Clear on reset:** `removeAllNodes()` and `removeNodesFromGraph()` clear localStorage when canvas emptied
5. **Fallback:** If localStorage empty or corrupted, fall back to default initial load
**Implementation Details:**
- Storage key: `'sahabahgraph_canvas_state'`
- Save trigger: elements array changes AND dataLoaded is true
- Saved data: Full Cytoscape element definitions including positions
- Debounce: 500ms delay prevents excessive writes during rapid changes
**Edge Cases Handled:**
- First visit: No localStorage → load default initial view
- Corrupted data: Try/catch with fallback to default
- All nodes removed: Clear localStorage (empty canvas shouldn't persist)
- Position updates: Pull latest positions from Cytoscape before save
**User Experience:**
- Transparent: No UI changes, just works in background
- Add nodes → refresh → nodes still there
- Arrange graph → refresh → layout preserved
- Clear canvas (trash icon) → localStorage cleared
- AI command "clear" → also clears localStorage
**Lesson:** localStorage is ideal for persisting UI state, but requires careful error handling and debouncing. Always save both data AND positions for graph visualizations.
**Result:** Canvas modifications now persist across browser sessions automatically, dramatically improving UX for exploratory workflows.
