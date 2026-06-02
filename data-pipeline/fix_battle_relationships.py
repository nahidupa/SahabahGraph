#!/usr/bin/env python3
"""
Fix incorrect family relationships involving Battle nodes.

Battle nodes should ONLY have PARTICIPATED_IN relationships, not family relationships
like PARENT_OF, SON_OF, DAUGHTER_OF, SPOUSE_OF, SIBLING_OF, etc.
"""

import csv
import shutil
from datetime import datetime

# Battle node IDs
BATTLE_NODE_IDS = {'243', '244', '245', '246', '247', '248', '249', '250'}

# Family relationship types that should NOT involve battles
FAMILY_RELATIONSHIP_TYPES = {
    'PARENT_OF', 'SON_OF', 'DAUGHTER_OF', 'SPOUSE_OF', 
    'SIBLING_OF', 'UNCLE_OF', 'COUSIN_OF'
}

def fix_battle_relationships(input_file='relationships.csv', output_file='relationships_fixed.csv'):
    """Remove incorrect family relationships involving Battle nodes."""
    
    print("=" * 80)
    print("FIXING BATTLE NODE RELATIONSHIPS")
    print("=" * 80)
    
    # Create backup
    backup_file = f'relationships.csv.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    print(f"\n📦 Creating backup: {backup_file}")
    shutil.copy(input_file, backup_file)
    
    # Read relationships
    print(f"\n📖 Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        relationships = list(reader)
    
    print(f"   Loaded {len(relationships)} relationships")
    
    # Find and remove incorrect relationships
    incorrect_relationships = []
    valid_relationships = []
    
    for rel in relationships:
        source_id = rel['source_id']
        target_id = rel['target_id']
        rel_type = rel['type']
        
        # Check if either source or target is a Battle node AND it's a family relationship
        if (source_id in BATTLE_NODE_IDS or target_id in BATTLE_NODE_IDS) and rel_type in FAMILY_RELATIONSHIP_TYPES:
            incorrect_relationships.append(rel)
            print(f"   ❌ Found incorrect relationship: {source_id} --[{rel_type}]--> {target_id}")
        else:
            valid_relationships.append(rel)
    
    # Write cleaned relationships
    print(f"\n💾 Writing cleaned relationships to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['source_id', 'target_id', 'type', 'category']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(valid_relationships)
    
    # Report
    print("\n" + "=" * 80)
    print("CLEANUP REPORT")
    print("=" * 80)
    print(f"Original relationships:     {len(relationships)}")
    print(f"Incorrect relationships:    {len(incorrect_relationships)}")
    print(f"Valid relationships:        {len(valid_relationships)}")
    print(f"Removed:                    {len(incorrect_relationships)}")
    
    if incorrect_relationships:
        print("\n" + "=" * 80)
        print("REMOVED RELATIONSHIPS")
        print("=" * 80)
        for rel in incorrect_relationships:
            print(f"  {rel['source_id']} --[{rel['type']}]--> {rel['target_id']} (category: {rel['category']})")
    
    print("\n" + "=" * 80)
    print("✅ SUCCESS!")
    print("=" * 80)
    print(f"Output written to: {output_file}")
    print(f"\nTo apply changes:")
    print(f"  mv {output_file} {input_file}")
    
    return len(incorrect_relationships)


if __name__ == '__main__':
    removed_count = fix_battle_relationships()
    
    if removed_count == 0:
        print("\n✨ No incorrect relationships found! Data is clean.")
    else:
        print(f"\n⚠️  Removed {removed_count} incorrect relationship(s)")
        print("\nNext steps:")
        print("  1. Review the changes above")
        print("  2. Apply: mv relationships_fixed.csv relationships.csv")
        print("  3. Re-export: python3 export_json.py")
