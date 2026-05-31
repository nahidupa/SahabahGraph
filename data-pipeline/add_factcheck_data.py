#!/usr/bin/env python3
"""
Add missing family data from fact-check report into sahabah.csv and relationships.csv
Processes comprehensive genealogical data and integrates missing people and relationships.
"""

import csv
import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

# ====== CONFIG ======
FACTCHECK_FILE = "fact_check_report.json"
SAHABAH_CSV = "sahabah.csv"
RELATIONSHIPS_CSV = "relationships.csv"

# Next ID sequence for new people entries
NEXT_PERSON_ID = 200

# ====== HELPER FUNCTIONS ======

def normalize_name(name: str) -> str:
    """Normalize name for comparison"""
    return name.lower().replace(" (pbuh)", "").strip()

def load_csv_dict(filename: str) -> Tuple[List[Dict], List[str]]:
    """Load CSV into list of dicts, return fieldnames too"""
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)
        return data, reader.fieldnames

def save_csv_dict(filename: str, data: List[Dict], fieldnames: List[str]):
    """Save list of dicts to CSV"""
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

def find_person_id(name: str, sahabah_data: List[Dict]) -> int:
    """Find person ID by normalized name"""
    norm_search = normalize_name(name)
    for person in sahabah_data:
        if normalize_name(person.get('name_en', '')) == norm_search:
            return int(person['id'])
    return -1

def load_json(filename: str) -> dict:
    """Load JSON file"""
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)

# ====== MAIN LOGIC ======

def add_missing_data():
    """Main function to add missing data"""
    global NEXT_PERSON_ID
    
    print("=" * 70)
    print("FACT-CHECK DATA INTEGRATION")
    print("=" * 70)
    
    # Load all data
    factcheck_data = load_json(FACTCHECK_FILE)
    sahabah_data, sahabah_fields = load_csv_dict(SAHABAH_CSV)
    rel_data, rel_fields = load_csv_dict(RELATIONSHIPS_CSV)
    
    # Set starting ID based on existing data
    existing_ids = set(int(p['id']) for p in sahabah_data)
    NEXT_PERSON_ID = max(existing_ids) + 1 if existing_ids else 200
    
    print(f"\n✓ Loaded {len(sahabah_data)} people")
    print(f"✓ Loaded {len(rel_data)} relationships")
    print(f"✓ Next available ID: {NEXT_PERSON_ID}")
    
    new_people = []  # Track new people added
    new_relationships = []  # Track new relationships
    
    # Process each Sahabi from fact-check
    sahabah_list = factcheck_data.get('fact_check_report', {}).get('sahabah', [])
    
    for sahabi in sahabah_list:
        sahabi_name = sahabi.get('name', '')
        print(f"\n─ Processing: {sahabi_name}")
        
        # Find this person in current data
        sahabi_id = find_person_id(sahabi_name, sahabah_data)
        if sahabi_id < 0:
            print(f"  ⚠ Warning: {sahabi_name} not found in current data")
            continue
        
        # Process wives
        wives = sahabi.get('wives', [])
        for wife_info in wives:
            wife_name = wife_info.get('name', '')
            if not wife_name:
                continue
            
            # Check if wife already exists
            wife_id = find_person_id(wife_name, sahabah_data)
            
            if wife_id < 0:
                # Create new entry for wife
                print(f"  → Adding wife: {wife_name}")
                new_wife_id = NEXT_PERSON_ID
                NEXT_PERSON_ID += 1
                
                new_people.append({
                    'id': str(new_wife_id),
                    'name_ar': '',
                    'name_en': wife_name,
                    'kunyah': '',
                    'laqab': '',
                    'gender': 'female',
                    'is_prophet': 'False',
                    'node_type': 'Sahabi',
                    'prominence': 'SAHABI',
                    'biography_short': f"Wife of {sahabi_name}. Graph profile: {wife_info.get('children', 0)} documented children.",
                    'biography_source': 'Fact-Check Report',
                    'tribe': '',
                    'clan': '',
                    'birth_year_hijri': '',
                    'death_year_hijri': '',
                    'has_parents': 'False',
                    'has_children': str(wife_info.get('children', 0) > 0).lower(),
                    'has_spouses': 'True',
                    'has_siblings': 'False',
                    'has_uncles': 'False',
                    'has_cousins': 'False',
                    'has_companions': 'False',
                    'has_teachers': 'False',
                    'has_students': 'False',
                    'has_battles': 'False',
                    'has_participants': 'False'
                })
                
                wife_id = new_wife_id
            
            # Add SPOUSE_OF relationship
            spouse_rel_exists = any(
                int(r['source_id']) == sahabi_id and int(r['target_id']) == wife_id and r['type'] == 'SPOUSE_OF'
                for r in rel_data + new_relationships
            )
            
            if not spouse_rel_exists:
                new_relationships.append({
                    'source_id': str(sahabi_id),
                    'target_id': str(wife_id),
                    'type': 'SPOUSE_OF',
                    'category': 'family'
                })
                # Reverse relationship
                new_relationships.append({
                    'source_id': str(wife_id),
                    'target_id': str(sahabi_id),
                    'type': 'SPOUSE_OF',
                    'category': 'family'
                })
                print(f"    + Added SPOUSE_OF relationship")
            
            # Process wife's other marriages
            other_marriages = wife_info.get('other_marriages', [])
            for other_husband_name in other_marriages:
                other_husband_id = find_person_id(other_husband_name, sahabah_data)
                
                if other_husband_id >= 0:
                    # Add relationship to other husband
                    spouse_rel_exists = any(
                        int(r['source_id']) == other_husband_id and int(r['target_id']) == wife_id and r['type'] == 'SPOUSE_OF'
                        for r in rel_data + new_relationships
                    )
                    
                    if not spouse_rel_exists:
                        new_relationships.append({
                            'source_id': str(other_husband_id),
                            'target_id': str(wife_id),
                            'type': 'SPOUSE_OF',
                            'category': 'family'
                        })
                        new_relationships.append({
                            'source_id': str(wife_id),
                            'target_id': str(other_husband_id),
                            'type': 'SPOUSE_OF',
                            'category': 'family'
                        })
                        print(f"    + Added SPOUSE_OF to {other_husband_name}")
        
        # Process children
        children = sahabi.get('children', [])
        for child_info in children:
            child_name = child_info.get('name', '')
            if not child_name:
                continue
            
            # Check if child already exists
            child_id = find_person_id(child_name, sahabah_data)
            
            if child_id < 0:
                # Create new entry for child
                print(f"  → Adding child: {child_name}")
                new_child_id = NEXT_PERSON_ID
                NEXT_PERSON_ID += 1
                
                child_status = child_info.get('status', 'Sahabi')
                new_people.append({
                    'id': str(new_child_id),
                    'name_ar': '',
                    'name_en': child_name,
                    'kunyah': '',
                    'laqab': '',
                    'gender': 'male' if child_info.get('gender', '').lower() != 'f' else 'female',
                    'is_prophet': 'False',
                    'node_type': 'Sahabi',
                    'prominence': 'SAHABI',
                    'biography_short': f"Child of {sahabi_name}. {child_info.get('notes', '')}",
                    'biography_source': 'Fact-Check Report',
                    'tribe': '',
                    'clan': '',
                    'birth_year_hijri': '',
                    'death_year_hijri': '',
                    'has_parents': 'True',
                    'has_children': 'False',
                    'has_spouses': 'False',
                    'has_siblings': 'False',
                    'has_uncles': 'False',
                    'has_cousins': 'False',
                    'has_companions': 'False',
                    'has_teachers': 'False',
                    'has_students': 'False',
                    'has_battles': 'False',
                    'has_participants': 'False'
                })
                
                child_id = new_child_id
            
            # Add PARENT_OF relationship
            parent_rel_exists = any(
                int(r['source_id']) == sahabi_id and int(r['target_id']) == child_id and r['type'] == 'PARENT_OF'
                for r in rel_data + new_relationships
            )
            
            if not parent_rel_exists:
                new_relationships.append({
                    'source_id': str(sahabi_id),
                    'target_id': str(child_id),
                    'type': 'PARENT_OF',
                    'category': 'family'
                })
                new_relationships.append({
                    'source_id': str(child_id),
                    'target_id': str(sahabi_id),
                    'type': 'SON_OF',
                    'category': 'family'
                })
                print(f"    + Added PARENT_OF relationship")
            
            # Add mother relationship if documented
            mother_name = child_info.get('mother', '')
            if mother_name:
                mother_id = find_person_id(mother_name, sahabah_data)
                
                if mother_id >= 0:
                    parent_rel_exists = any(
                        int(r['source_id']) == mother_id and int(r['target_id']) == child_id and r['type'] == 'PARENT_OF'
                        for r in rel_data + new_relationships
                    )
                    
                    if not parent_rel_exists:
                        new_relationships.append({
                            'source_id': str(mother_id),
                            'target_id': str(child_id),
                            'type': 'PARENT_OF',
                            'category': 'family'
                        })
                        new_relationships.append({
                            'source_id': str(child_id),
                            'target_id': str(mother_id),
                            'type': 'DAUGHTER_OF',
                            'category': 'family'
                        })
                        print(f"    + Added mother relationship to {mother_name}")
    
    # Merge new data with existing
    print("\n" + "=" * 70)
    print(f"NEW DATA TO ADD:")
    print(f"  • New people: {len(new_people)}")
    print(f"  • New relationships: {len(new_relationships)}")
    
    if new_people:
        sahabah_data.extend(new_people)
        print(f"\n✓ Extended sahabah.csv from {len(sahabah_data) - len(new_people)} to {len(sahabah_data)} rows")
    
    if new_relationships:
        rel_data.extend(new_relationships)
        print(f"✓ Extended relationships.csv from {len(rel_data) - len(new_relationships)} to {len(rel_data)} rows")
    
    # Save updated files
    if new_people or new_relationships:
        print("\n" + "=" * 70)
        print("SAVING UPDATED DATA...")
        save_csv_dict(SAHABAH_CSV, sahabah_data, sahabah_fields)
        print(f"✓ Saved {SAHABAH_CSV}")
        
        save_csv_dict(RELATIONSHIPS_CSV, rel_data, rel_fields)
        print(f"✓ Saved {RELATIONSHIPS_CSV}")
        
        print("\n✅ Data integration complete!")
        print(f"\n📊 Summary:")
        print(f"   • Added {len(new_people)} new people (wives & children)")
        print(f"   • Added {len(new_relationships)} new relationships")
    else:
        print("\n⚠ No new data to add (all data already present)")

if __name__ == '__main__':
    add_missing_data()
