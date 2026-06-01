#!/usr/bin/env python3
import csv
from pathlib import Path
from collections import defaultdict

script_dir = Path(__file__).resolve().parent

def load_nodes():
    nodes = {}
    with open(script_dir / 'sahabah.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            nodes[int(row['id'])] = row
    return nodes

def load_relationships():
    parent_rels = set()
    children_with_parents = set()
    with open(script_dir / 'relationships.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['type'] == 'PARENT_OF':
                parent_rels.add((int(row['source_id']), int(row['target_id'])))
                children_with_parents.add(int(row['target_id']))
    return parent_rels, children_with_parents

def load_documented_parents():
    documented = defaultdict(list)
    with open(script_dir / 'sahabi_children_and_spouses.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            child_id = int(row['child_id'])
            parents_str = row['parents']
            if not parents_str or parents_str.lower() == 'unknown': continue
            parent_names = [p.strip() for p in parents_str.split('|')]
            documented[child_id] = parent_names
    return documented

def find_node_by_name(nodes, name):
    name_lower = name.lower()
    for node_id, node_data in nodes.items():
        if node_data['name_en'].lower() == name_lower: return node_id
    for node_id, node_data in nodes.items():
        if name_lower in node_data['name_en'].lower(): return node_id
    return None

def create_parent_node(node_id, parent_name, gender='M'):
    return {
        'id': str(node_id), 'name_ar': parent_name, 'name_en': parent_name, 'kunyah': '', 'laqab': '',
        'gender': gender, 'is_prophet': 'False', 'node_type': 'PoliticalFigure', 'prominence': '1',
        'biography_short': 'Pre-Islamic parent', 'biography_source': 'Sahabah genealogy', 'tribe': '', 'clan': '',
        'birth_year_hijri': '0', 'death_year_hijri': '0', 'has_parents': 'False', 'has_children': 'True',
        'has_spouses': 'True', 'has_siblings': 'False', 'has_uncles': 'False', 'has_cousins': 'False',
        'has_companions': 'False', 'has_teachers': 'False', 'has_students': 'False', 'has_battles': 'False', 'has_participants': 'False',
    }

def main():
    nodes = load_nodes()
    parent_rels, children_with_parents = load_relationships()
    documented = load_documented_parents()
    
    new_nodes_needed = {}
    new_relationships = []
    
    for child_id, parent_names in documented.items():
        if child_id not in nodes: continue
        for parent_name in parent_names:
            parent_id = find_node_by_name(nodes, parent_name)
            if parent_id is None:
                for nid, n in new_nodes_needed.items():
                    if n['name_en'] == parent_name:
                        parent_id = nid
                        break
            if parent_id is None:
                parent_id = max(list(nodes.keys()) + list(new_nodes_needed.keys()) + [0]) + 1
                gender = 'female' if 'bint' in parent_name.lower() or parent_name.endswith('a') else 'male'
                new_nodes_needed[parent_id] = create_parent_node(parent_id, parent_name, gender)
                print(f"Created node for {parent_name}")
            
            if (parent_id, child_id) not in parent_rels:
                new_relationships.append((parent_id, child_id))
                parent_rels.add((parent_id, child_id))

    if not new_nodes_needed and not new_relationships:
        print("Nothing to update.")
        return

    # Update sahabah.csv
    with open(script_dir / 'sahabah.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    for nid, node in sorted(new_nodes_needed.items()):
        rows.append(node)
    
    child_ids = [c for p, c in new_relationships]
    for row in rows:
        if int(row['id']) in child_ids:
            row['has_parents'] = 'True'

    with open(script_dir / 'sahabah.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Update relationships.csv
    with open(script_dir / 'relationships.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rel_rows = list(reader)
    
    for pid, cid in new_relationships:
        rel_rows.append({'source_id': str(pid), 'target_id': str(cid), 'type': 'PARENT_OF', 'category': 'family'})
    
    with open(script_dir / 'relationships.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rel_rows)
    
    print(f"Added {len(new_nodes_needed)} nodes and {len(new_relationships)} relationships.")

if __name__ == '__main__': main()
