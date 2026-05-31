# SahabahGraph

## Project Overview

**SahabahGraph** is a knowledge graph project designed to map and visualize the relationships between the Sahabah (Companions of Prophet Muhammad ﷺ). This project aims to create a comprehensive relational database and visualization tool that helps users understand the interconnected history, social networks, and relationships of the early Muslim community.

## Vision & Purpose

The primary objective of SahabahGraph is to:

- **Document Relationships**: Create a structured representation of family ties, marriages, mentor-student relationships, and close companionships among the Sahabah
- **Preserve Historical Knowledge**: Maintain accurate historical records of the Sahabah's connections and interactions during the Islamic Golden Age
- **Enable Research**: Provide researchers, historians, and Islamic scholars with a powerful tool to explore complex relationship patterns
- **Enhance Learning**: Help students and enthusiasts of Islamic history better understand the social fabric of early Muslim society
- **Visualize Networks**: Generate interactive visualizations of relationship networks to reveal patterns and connections not easily apparent in traditional texts

## Key Relationship Types

The graph will track various types of relationships between Sahabah:

1. **Family Relations**
   - Parent-child relationships
   - Sibling connections
   - Marriage relationships
   - Extended family ties

2. **Companionship & Mentorship**
   - Teacher-student relationships
   - Close companions (Khalilah)
   - Spiritual guide relationships

3. **Military & Political Connections**
   - Battle participation together
   - Military leadership hierarchies
   - Political alliances and groups

4. **Social Networks**
   - Migration companions
   - Neighborhood relationships
   - Trade and business partnerships

## Project Goals

### Phase 1: Foundation
- [ ] Compile comprehensive data on major Sahabah
- [ ] Define relationship schema and data structure
- [ ] Create initial dataset with verified historical information

### Phase 2: Development
- [ ] Build graph database infrastructure
- [ ] Implement data import and management systems
- [ ] Develop API for querying relationships

### Phase 3: Visualization
- [ ] Create interactive relationship visualizations
- [ ] Develop web-based interface
- [ ] Implement filtering and search capabilities

### Phase 4: Enhancement
- [ ] Add biographical information
- [ ] Include historical timeline integration
- [ ] Support advanced analytics and insights

## Target Users

- **Islamic Scholars & Researchers**: For academic and research purposes
- **Students & Educators**: For learning about early Islamic history
- **Historians**: For understanding social dynamics of the early Muslim community
- **General Enthusiasts**: For exploring Islamic history interactively

## Expected Benefits

- Comprehensive reference for Sahabah relationships
- Visual understanding of social networks
- Research tool for academic and historical studies
- Educational resource for Islamic knowledge seekers
- Preservation of historical knowledge in digital form

## Technologies & Approach

This project will utilize:
- Graph database technology for relationship modeling
- Data visualization frameworks for network representation
- Web technologies for user interface and accessibility
- Historical sources and Islamic texts for data verification
## Static Model & Data Updates

This project uses a static architecture to ensure zero hosting costs.

### How it works
1.  **Data Generation**: The source data is defined in `data-pipeline/sahabah.csv` and `relationships.csv`.
2.  **JSON Export**: The script `data-pipeline/generate_mock_data.py` processes these CSVs and generates `frontend/public/data/sahabah_data.json`.
3.  **Frontend**: The React application loads this JSON at runtime and performs all search and graph computations in the browser.

### Updating Data
To update the graph data:
1.  Modify `data-pipeline/sahabah.csv` or `data-pipeline/relationships.csv`.
2.  Run the generator script:
    ```bash
    python3 data-pipeline/generate_mock_data.py
    ```
3.  Rebuild and deploy the frontend.
