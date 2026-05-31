#!/usr/bin/env python3
"""
Export updated sahabah.csv and relationships.csv to frontend JSON format
Used after CSV updates to sync with frontend application
"""

import csv
import json
from pathlib import Path

SAHABAH_CSV = "sahabah.csv"
RELATIONSHIPS_CSV = "relationships.csv"
OUTPUT_JSON = "../frontend/public/data/sahabah_data.json"

def load_data():
    """Load CSV files"""
    sahabah_data = []
    relationships_data = []
    
    with open(SAHABAH_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        sahabah_data = list(reader)
    
    with open(RELATIONSHIPS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        relationships_data = list(reader)
    
    return sahabah_data, relationships_data

def export_to_json(sahabah_data, relationships_data):
    """Export to frontend JSON format"""
    
    # Create nodes from sahabah data
    nodes = []
    person_id_map = {}
    
    for person in sahabah_data:
        person_id = int(person['id'])
        person_id_map[person_id] = len(nodes)
        
        node = {
            'id': str(person_id),
            'name_en': person['name_en'],
            'name_ar': person['name_ar'],
            'kunyah': person.get('kunyah', ''),
            'laqab': person.get('laqab', ''),
            'gender': person.get('gender', ''),
            'is_prophet': person.get('is_prophet', '').lower() == 'true',
            'node_type': person.get('node_type', ''),
            'prominence': person.get('prominence', ''),
            'biography_short': person.get('biography_short', ''),
            'biography_source': person.get('biography_source', ''),
            'tribe': person.get('tribe', ''),
            'clan': person.get('clan', ''),
            'birth_year_hijri': person.get('birth_year_hijri', ''),
            'death_year_hijri': person.get('death_year_hijri', ''),
            'has_children': person.get('has_children', '').lower() == 'true',
            'has_parents': person.get('has_parents', '').lower() == 'true',
            'has_spouses': person.get('has_spouses', '').lower() == 'true',
            'has_siblings': person.get('has_siblings', '').lower() == 'true',
            'has_uncles': person.get('has_uncles', '').lower() == 'true',
            'has_cousins': person.get('has_cousins', '').lower() == 'true',
            'has_companions': person.get('has_companions', '').lower() == 'true',
            'has_teachers': person.get('has_teachers', '').lower() == 'true',
            'has_students': person.get('has_students', '').lower() == 'true',
            'has_battles': person.get('has_battles', '').lower() == 'true',
        }
        nodes.append(node)
    
    # Create links from relationships
    links = []
    for rel in relationships_data:
        source_id = int(rel['source_id'])
        target_id = int(rel['target_id'])
        
        if source_id in person_id_map and target_id in person_id_map:
            link = {
                'source': source_id,
                'target': target_id,
                'type': rel['type'],
                'category': rel.get('category', '')
            }
            links.append(link)
    
    return {'nodes': nodes, 'links': links}

def main():
    print("=" * 70)
    print("EXPORTING TO FRONTEND JSON")
    print("=" * 70)
    
    print("\n📂 Loading CSV data...")
    sahabah_data, relationships_data = load_data()
    print(f"✓ Loaded {len(sahabah_data)} people")
    print(f"✓ Loaded {len(relationships_data)} relationships")
    
    print("\n📦 Exporting to JSON...")
    graph_data = export_to_json(sahabah_data, relationships_data)
    
    # Create output directory if needed
    output_path = Path(OUTPUT_JSON)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Exported {len(graph_data['nodes'])} nodes")
    print(f"✓ Exported {len(graph_data['links'])} links")
    
    # Print statistics
    print("\n" + "=" * 70)
    print("📊 EXPORT STATISTICS")
    print("=" * 70)
    
    rel_types = {}
    for link in graph_data['links']:
        rel_type = link['type']
        rel_types[rel_type] = rel_types.get(rel_type, 0) + 1
    
    print("\nRelationship Types:")
    for rel_type in sorted(rel_types.keys()):
        print(f"  • {rel_type}: {rel_types[rel_type]}")
    
    node_types = {}
    for node in graph_data['nodes']:
        node_type = node['node_type']
        node_types[node_type] = node_types.get(node_type, 0) + 1
    
    print("\nNode Types:")
    for node_type in sorted(node_types.keys()):
        print(f"  • {node_type}: {node_types[node_type]}")
    
    print(f"\n✅ Successfully exported to: {OUTPUT_JSON}")

if __name__ == '__main__':
    main()
