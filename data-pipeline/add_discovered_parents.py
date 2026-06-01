#!/usr/bin/env python3
"""
Add Discovered Parents to Sahabah Database

This script automates the process of adding newly discovered parent relationships:
1. Reads sahabi_children_and_spouses.csv for parent names
2. Checks if parent nodes exist in sahabah.csv
3. Creates new parent nodes if missing
4. Creates PARENT_OF relationships
5. Updates has_parents flags
6. Validates consistency

Usage:
    python3 add_discovered_parents.py

Workflow:
    1. Edit sahabi_children_and_spouses.csv with newly discovered parent names
    2. Run this script
    3. Review output for any warnings
    4. Commit changes
"""

import csv
from pathlib import Path
from collections import defaultdict

script_dir = Path(__file__).resolve().parent


def load_nodes():
    """Load all existing nodes from sahabah.csv"""
    nodes = {}
    with open(script_dir / 'sahabah.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            nodes[int(row['id'])] = row
    return nodes


def load_relationships():
    """Load existing parent-child relationships"""
    parent_rels = set()
    children_with_parents = set()

    with open(script_dir / 'relationships.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['type'] == 'PARENT_OF':
                parent_id = int(row['source_id'])
                child_id = int(row['target_id'])
                parent_rels.add((parent_id, child_id))
                children_with_parents.add(child_id)

    return parent_rels, children_with_parents


def load_documented_parents():
    """Load parent names from sahabi_children_and_spouses.csv"""
    documented = defaultdict(list)

    with open(script_dir / 'sahabi_children_and_spouses.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            child_id = int(row['child_id'])
            parents_str = row['parents']

            if not parents_str or parents_str.lower() == 'unknown':
                continue

            parent_names = [p.strip() for p in parents_str.split('|')]
            documented[child_id] = parent_names

    return documented


def find_node_by_name(nodes, name):
    """Find a node ID by name (fuzzy matching)"""
    name_lower = name.lower()

    # First try exact match
    for node_id, node_data in nodes.items():
        if node_data['name_en'].lower() == name_lower:
            return node_id

    # Then try substring match
    for node_id, node_data in nodes.items():
        node_name_lower = node_data['name_en'].lower()
        if name_lower in node_name_lower or node_name_lower in name_lower:
            return node_id

    return None


def get_next_id(nodes):
    """Get the next available node ID"""
    return max(int(node_id) for node_id in nodes.keys()) + 1


def create_parent_node(node_id, parent_name, gender='M'):
    """Create a new parent node"""
    return {
        'id': str(node_id),
        'name_ar': parent_name,
        'name_en': parent_name,
        'kunyah': '',
        'laqab': '',
        'gender': gender,
        'is_prophet': 'False',
        'node_type': 'PoliticalFigure',
        'prominence': '1',
        'biography_short': 'Pre-Islamic parent',
        'biography_source': 'Sahabah genealogy',
        'tribe': '',
        'clan': '',
        'birth_year_hijri': '0',
        'death_year_hijri': '0',
        'has_parents': 'False',
        'has_children': 'True',
        'has_spouses': 'True',
        'has_siblings': 'False',
        'has_uncles': 'False',
        'has_cousins': 'False',
        'has_companions': 'False',
        'has_teachers': 'False',
        'has_students': 'False',
        'has_battles': 'False',
        'has_participants': 'False',
    }

def main():
    print("=" * 60)
    print("DISCOVERING AND ADDING NEW PARENT RELATIONSHIPS")
    print("=" * 60)
    print()

    # Load existing data
    nodes = load_nodes()
    parent_rels, children_with_parents = load_relationships()
    documented = load_documented_parents()

    print(f"Loaded {len(nodes)} nodes")
    print(f"Loaded {len(parent_rels)} existing parent relationships")
    print(f"Loaded {len(documented)} sahabah with documented parents")
    print()

    # Find missing relationships
    new_nodes_needed = {}
    new_relationships = []
    stats = {
        'existing_nodes_linked': 0,
        'new_nodes_created': 0,
        'new_relationships': 0,
    }

    print("Checking for missing relationships...")
    print()
    
    for child_id, parent_names in documented.items():
        # Check if child exists
        if child_id not in nodes:
            print(f"⚠️  Child ID {child_id} not found in nodes")
            continue

        child_name = nodes[child_id]['name_en']

        for parent_name in parent_names:
            # Try to find existing parent node
            parent_id = find_node_by_name(nodes, parent_name)

            if parent_id is None:
                # Check if we already planned to create this parent
                for new_id, new_node in new_nodes_needed.items():
                    if new_node['name_en'] == parent_name:
                        parent_id = new_id
                        break

            if parent_id is None:
                # Create new parent node
                next_id = get_next_id(nodes) if not new_nodes_needed else max(new_nodes_needed.keys()) + 1

                # Guess gender from name (simple heuristic)
                gender = 'F' if parent_name.endswith('a') or 'bint' in parent_name.lower() else 'M'

                new_parent = create_parent_node(next_id, parent_name, gender)
                new_nodes_needed[next_id] = new_parent
                parent_id = next_id
                stats['new_nodes_created'] += 1
                print(f"  ✓ Create: {parent_name} (ID: {parent_id})")
            else:
                stats['existing_nodes_linked'] += 1

            # Check if relationship exists
            if (parent_id, child_id) not in parent_rels:
                new_relationships.append((parent_id, child_id))
                stats['new_relationships'] += 1
                print(f"  ✓ Link: {parent_name} ({parent_id}) → {child_name} ({child_id})")

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Existing parent nodes linked: {stats['existing_nodes_linked']}")
    print(f"New parent nodes to create: {stats['new_nodes_created']}")
    print(f"New relationships to create: {stats['new_relationships']}")
    print()

    if stats['new_relationships'] == 0:
        print("✅ No new parent relationships to add!")
        print("   All documented parents are already in the system.")
        return

    # Write updates
    print("Updating database...")

    # Update sahabah.csv
    with open(script_dir / 'sahabah.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    # Add new nodes
    for node_id, node_data in sorted(new_nodes_needed.items()):
        rows.append(node_data)

    with open(script_dir / 'sahabah.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Update relationships.csv
    with open(script_dir / 'relationships.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rel_rows = list(reader)

    # Add new relationships
    for parent_id, child_id in new_relationships:
        rel_rows.append({
            'source_id': str(parent_id),
            'target_id': str(child_id),
            'type': 'PARENT_OF',
            'category': 'family',
        })

    with open(script_dir / 'relationships.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rel_rows)

    # Update has_parents flags
    with open(script_dir / 'sahabah.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    for row in rows:
        node_id = int(row['id'])
        if node_id in [child for parent, child in new_relationships]:
            row['has_parents'] = 'True'

    with open(script_dir / 'sahabah.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print()
    print("✅ Database updated successfully!")
    print()
    print("Next steps:")
    print("  1. python3 validate_data.py  # Verify consistency")
    print("  2. python3 export_json.py    # Export to frontend")
    print("  3. cd ../frontend && npm test  # Run tests")
    print("  4. git add -A && git commit  # Commit changes")


if __name__ == '__main__':
    main()
