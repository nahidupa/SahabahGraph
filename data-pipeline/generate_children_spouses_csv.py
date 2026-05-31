#!/usr/bin/env python3
"""
Generate sahabi_children_and_spouses.csv with all Sahabah

This script creates a complete sahabi_children_and_spouses.csv file
with entries for all 217 Sahabah, extracting parent information
from existing relationships.csv where available.
"""

import csv
from pathlib import Path
from collections import defaultdict

script_dir = Path(__file__).resolve().parent


def load_nodes():
    """Load all Sahabi nodes"""
    nodes = {}
    with open(script_dir / 'sahabah.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['node_type'] == 'Sahabi':
                nodes[int(row['id'])] = row
    return nodes


def load_relationships_and_parents():
    """Load parent relationships from relationships.csv"""
    parents_map = defaultdict(list)  # child_id -> [parent_ids]
    parent_names = {}  # id -> name_en
    
    with open(script_dir / 'relationships.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['type'] == 'PARENT_OF':
                parent_id = int(row['source_id'])
                child_id = int(row['target_id'])
                parents_map[child_id].append(parent_id)
    
    # Get parent names from sahabah.csv
    with open(script_dir / 'sahabah.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            parent_names[int(row['id'])] = row['name_en']
    
    return parents_map, parent_names


def load_existing_children_and_spouses():
    """Load existing data if it exists"""
    spouses_map = defaultdict(str)  # id -> spouse_string
    
    try:
        with open(script_dir / 'sahabi_children_and_spouses.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                child_id = int(row['child_id'])
                spouses_map[child_id] = row.get('wives_or_husbands', '')
    except FileNotFoundError:
        pass
    
    return spouses_map


def main():
    print("=" * 70)
    print("GENERATING COMPLETE sahabi_children_and_spouses.csv")
    print("=" * 70)
    print()
    
    nodes = load_nodes()
    parents_map, parent_names = load_relationships_and_parents()
    spouses_map = load_existing_children_and_spouses()
    
    print(f"Loading {len(nodes)} Sahabah nodes...")
    print(f"Found {sum(1 for p in parents_map if p)} Sahabah with parents")
    print()
    
    # Create CSV rows
    rows = []
    for sahabi_id in sorted(nodes.keys()):
        node = nodes[sahabi_id]
        
        # Get parents if they exist
        parent_ids = parents_map.get(sahabi_id, [])
        if parent_ids:
            parent_names_list = [parent_names.get(pid, f"ID_{pid}") for pid in sorted(parent_ids)]
            parents_str = ' | '.join(parent_names_list)
        else:
            parents_str = ''
        
        # Get spouses if they exist
        spouses_str = spouses_map.get(sahabi_id, '')
        
        rows.append({
            'child_id': sahabi_id,
            'child_name_en': node['name_en'],
            'child_name_ar': node['name_ar'],
            'parents': parents_str,
            'wives_or_husbands': spouses_str,
        })
    
    # Write CSV
    with open(script_dir / 'sahabi_children_and_spouses.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['child_id', 'child_name_en', 'child_name_ar', 'parents', 'wives_or_husbands'])
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✅ Created sahabi_children_and_spouses.csv with {len(rows)} entries")
    print()
    print("Statistics:")
    with_parents = sum(1 for r in rows if r['parents'])
    print(f"  Sahabah with parents: {with_parents}")
    print(f"  Sahabah without parents: {len(rows) - with_parents}")
    print()
    print("Now you can:")
    print("  1. Review the file for missing parent information")
    print("  2. Research and add parents for those without documentation")
    print("  3. Run: python3 add_discovered_parents.py")
    print("  4. Commit with: git add -A && git commit -m '...'")


if __name__ == '__main__':
    main()
