#!/usr/bin/env python3
"""
Find people with multiple male parents (fathers) which indicates duplicate entries.

This script analyzes relationships.csv and sahabah.csv to find cases where:
- A person has more than one male parent (father)
- This indicates duplicate entries in the database that need to be merged
"""

import csv
from collections import defaultdict
from typing import Dict, List, Set


def load_sahabah_data(filename: str) -> Dict[str, Dict]:
    """Load sahabah data and create lookup by ID."""
    sahabah = {}
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sahabah[row['id']] = row
    return sahabah


def find_multiple_fathers(relationships_file: str, sahabah_file: str):
    """Find people who have multiple male parents."""
    
    # Load sahabah data
    print(f"Loading sahabah data from {sahabah_file}...")
    sahabah = load_sahabah_data(sahabah_file)
    print(f"Loaded {len(sahabah)} entries")
    
    # Track parents for each person
    # Structure: {child_id: [list of parent_ids]}
    parents_of = defaultdict(list)
    
    # Read relationships
    print(f"\nLoading relationships from {relationships_file}...")
    with open(relationships_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['type'] == 'PARENT_OF':
                parent_id = row['source_id']
                child_id = row['target_id']
                parents_of[child_id].append(parent_id)
    
    print(f"Found {len(parents_of)} people with recorded parents")
    
    # Find people with multiple male parents
    print("\n" + "=" * 80)
    print("PEOPLE WITH MULTIPLE MALE PARENTS (POTENTIAL DUPLICATES)")
    print("=" * 80 + "\n")
    
    issues_found = 0
    
    for child_id, parent_ids in sorted(parents_of.items()):
        # Get unique parents
        unique_parents = list(set(parent_ids))
        
        if len(unique_parents) < 2:
            continue
        
        # Count male parents
        male_parents = []
        female_parents = []
        
        for parent_id in unique_parents:
            if parent_id not in sahabah:
                print(f"Warning: Parent ID {parent_id} not found in sahabah.csv")
                continue
            
            parent = sahabah[parent_id]
            gender = parent.get('gender', '').strip().upper()
            
            if gender == 'M':
                male_parents.append(parent)
            elif gender == 'F':
                female_parents.append(parent)
        
        # Report if multiple male parents
        if len(male_parents) > 1:
            issues_found += 1
            
            child = sahabah.get(child_id, {})
            child_name = child.get('name_en', f'ID {child_id}')
            child_name_ar = child.get('name_ar', 'N/A')
            
            print(f"Issue #{issues_found}:")
            print(f"  Child: {child_name} (ID: {child_id})")
            print(f"  Arabic: {child_name_ar}")
            print(f"  Has {len(male_parents)} male parents (should have max 1):")
            
            for i, father in enumerate(male_parents, 1):
                father_id = father['id']
                father_name = father.get('name_en', 'Unknown')
                father_name_ar = father.get('name_ar', 'N/A')
                print(f"    Father {i}: {father_name} (ID: {father_id})")
                print(f"              Arabic: {father_name_ar}")
            
            if female_parents:
                print(f"  Also has {len(female_parents)} female parent(s):")
                for mother in female_parents:
                    mother_id = mother['id']
                    mother_name = mother.get('name_en', 'Unknown')
                    print(f"    Mother: {mother_name} (ID: {mother_id})")
            
            print()
    
    # Also check for duplicate parent entries (same person listed twice)
    print("\n" + "=" * 80)
    print("PEOPLE WITH DUPLICATE PARENT ENTRIES")
    print("=" * 80 + "\n")
    
    duplicate_entries = 0
    
    for child_id, parent_ids in sorted(parents_of.items()):
        # Check if any parent is listed multiple times
        parent_counts = defaultdict(int)
        for parent_id in parent_ids:
            parent_counts[parent_id] += 1
        
        duplicates = {pid: count for pid, count in parent_counts.items() if count > 1}
        
        if duplicates:
            duplicate_entries += 1
            
            child = sahabah.get(child_id, {})
            child_name = child.get('name_en', f'ID {child_id}')
            
            print(f"Duplicate #{duplicate_entries}:")
            print(f"  Child: {child_name} (ID: {child_id})")
            
            for parent_id, count in duplicates.items():
                parent = sahabah.get(parent_id, {})
                parent_name = parent.get('name_en', 'Unknown')
                print(f"  Parent {parent_name} (ID: {parent_id}) listed {count} times")
            
            print()
    
    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total people with multiple male parents: {issues_found}")
    print(f"Total people with duplicate parent entries: {duplicate_entries}")
    
    if issues_found > 0:
        print("\n⚠️  ACTION REQUIRED:")
        print("These entries need to be reviewed and merged in sahabah.csv")
        print("The duplicate fathers are likely the same person with different names/IDs")
    
    return issues_found


if __name__ == '__main__':
    relationships_file = 'relationships.csv'
    sahabah_file = 'sahabah.csv'
    
    issues = find_multiple_fathers(relationships_file, sahabah_file)
    
    if issues > 0:
        print("\nNext steps:")
        print("1. Review the duplicates listed above")
        print("2. Update deduplicate_sahabah.py to merge these entries")
        print("3. Run the deduplication again")
        print("4. Update relationship IDs to point to merged entries")
