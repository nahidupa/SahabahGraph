#!/usr/bin/env python3
"""
Update relationships.csv to use merged IDs after deduplication.

This script:
1. Reads the old and new sahabah.csv files
2. Creates a mapping of old IDs to new merged IDs
3. Updates relationships.csv to use the new IDs
"""

import csv
import shutil
from datetime import datetime
from collections import defaultdict


def load_sahabah(filename: str):
    """Load sahabah data indexed by Arabic name (most reliable identifier)."""
    by_arabic = {}
    by_id = {}
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            by_id[row['id']] = row
            arabic_name = row.get('name_ar', '').strip()
            if arabic_name:
                # Store the first occurrence (lowest ID) for each Arabic name
                if arabic_name not in by_arabic:
                    by_arabic[arabic_name] = row
    
    return by_id, by_arabic


def create_id_mapping(old_file: str, new_file: str):
    """
    Create a mapping from old IDs to new IDs.
    Returns dict: {old_id: new_id}
    """
    print(f"Loading old data from {old_file}...")
    old_by_id, old_by_arabic = load_sahabah(old_file)
    
    print(f"Loading new data from {new_file}...")
    new_by_id, new_by_arabic = load_sahabah(new_file)
    
    print(f"\nCreating ID mapping...")
    print(f"  Old entries: {len(old_by_id)}")
    print(f"  New entries: {len(new_by_id)}")
    print(f"  Removed: {len(old_by_id) - len(new_by_id)}")
    
    # Create mapping
    id_mapping = {}
    
    for old_id, old_row in old_by_id.items():
        arabic_name = old_row.get('name_ar', '').strip()
        
        if old_id in new_by_id:
            # ID still exists in new file
            id_mapping[old_id] = old_id
        elif arabic_name and arabic_name in new_by_arabic:
            # This entry was merged, map to the canonical entry
            new_id = new_by_arabic[arabic_name]['id']
            id_mapping[old_id] = new_id
            print(f"  Mapping {old_id} ({old_row.get('name_en', 'N/A')}) → {new_id}")
        else:
            # Entry was removed or can't be found
            print(f"  WARNING: Cannot find mapping for ID {old_id} ({old_row.get('name_en', 'N/A')})")
            # Map to itself as fallback
            id_mapping[old_id] = old_id
    
    return id_mapping


def update_relationships(relationships_file: str, id_mapping: dict, output_file: str):
    """Update relationships.csv with new IDs."""
    
    print(f"\nUpdating relationships in {relationships_file}...")
    
    # Read relationships
    relationships = []
    updates = 0
    
    with open(relationships_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            original_source = row['source_id']
            original_target = row['target_id']
            
            # Map to new IDs
            new_source = id_mapping.get(original_source, original_source)
            new_target = id_mapping.get(original_target, original_target)
            
            if new_source != original_source or new_target != original_target:
                updates += 1
            
            row['source_id'] = new_source
            row['target_id'] = new_target
            
            relationships.append(row)
    
    print(f"  Total relationships: {len(relationships)}")
    print(f"  Updated: {updates}")
    
    # Remove duplicate relationships after ID mapping
    print(f"\nRemoving duplicate relationships...")
    seen = set()
    unique_relationships = []
    duplicates_removed = 0
    
    for row in relationships:
        # Create a canonical key for this relationship
        # For bidirectional relationships, normalize the order
        rel_type = row['type']
        source = row['source_id']
        target = row['target_id']
        category = row['category']
        
        # For symmetric relationships, always store in sorted order
        symmetric_types = {'SIBLING_OF', 'SPOUSE_OF', 'COUSIN_OF', 'COMPANION_OF'}
        
        if rel_type in symmetric_types:
            # Sort IDs to create canonical key
            if int(source) > int(target):
                source, target = target, source
        
        key = (source, target, rel_type, category)
        
        if key not in seen:
            seen.add(key)
            unique_relationships.append(row)
        else:
            duplicates_removed += 1
    
    print(f"  Removed {duplicates_removed} duplicate relationships")
    print(f"  Final count: {len(unique_relationships)}")
    
    # Write updated relationships
    print(f"\nWriting to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(unique_relationships)
    
    return len(relationships), len(unique_relationships)


def main():
    old_sahabah = 'sahabah_original.csv'
    new_sahabah = 'sahabah.csv'
    relationships_file = 'relationships.csv'
    output_file = 'relationships_updated.csv'
    
    print("=" * 80)
    print("UPDATE RELATIONSHIPS TO USE MERGED IDS")
    print("=" * 80)
    
    # Create backup
    backup_file = f'relationships.csv.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    print(f"\nCreating backup: {backup_file}")
    shutil.copy(relationships_file, backup_file)
    
    # Create ID mapping
    id_mapping = create_id_mapping(old_sahabah, new_sahabah)
    
    # Update relationships
    original_count, final_count = update_relationships(relationships_file, id_mapping, output_file)
    
    print("\n" + "=" * 80)
    print("SUCCESS!")
    print("=" * 80)
    print(f"Original relationships: {original_count}")
    print(f"Final relationships: {final_count}")
    print(f"Removed: {original_count - final_count} duplicates")
    print(f"\nBackup: {backup_file}")
    print(f"Updated file: {output_file}")
    print("\nTo apply changes:")
    print(f"  mv {output_file} {relationships_file}")


if __name__ == '__main__':
    main()
