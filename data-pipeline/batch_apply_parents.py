#!/usr/bin/env python3
"""
Batch Parent Processor - Apply all known parent relationships at once
Uses the parent_knowledge_base.py curated database
"""

import csv
import subprocess
from pathlib import Path
from parent_knowledge_base import get_all_parent_data, get_coverage_stats

script_dir = Path(__file__).resolve().parent


def apply_all_parents():
    """Apply all known parent relationships from the knowledge base"""
    
    print("=" * 80)
    print("🚀 BATCH PARENT PROCESSOR")
    print("=" * 80)
    print()
    
    # Get all parent data from knowledge base
    parent_data = get_all_parent_data()
    stats = get_coverage_stats()
    
    print(f"📚 Knowledge Base Status:")
    print(f"   • Total Sahabah: {stats['total_sahabah']}")
    print(f"   • Documented parents: {stats['with_parents']} ({stats['percentage']:.1f}%)")
    print(f"   • Ready to apply: {len(parent_data)} relationships")
    print()
    
    # Load current CSV
    print("📝 Loading sahabi_children_and_spouses.csv...")
    with open(script_dir / 'sahabi_children_and_spouses.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    
    # Apply parent data
    print("✏️  Updating parent information...")
    updated = 0
    skipped = 0
    
    for row in rows:
        child_id = int(row['child_id'])
        
        if child_id in parent_data:
            # Skip if already has parents
            if row['parents'] and row['parents'].lower() not in ['unknown', '']:
                skipped += 1
                continue
            
            father, mother = parent_data[child_id]
            
            # Build parents string
            parents_list = []
            if father and father.lower() != 'unknown':
                parents_list.append(father)
            if mother and mother.lower() != 'unknown':
                parents_list.append(mother)
            
            if parents_list:
                row['parents'] = ' | '.join(parents_list)
                updated += 1
                print(f"   ✓ ID {child_id}: {row['child_name_en']}")
    
    # Write back
    print(f"\n💾 Saving changes...")
    with open(script_dir / 'sahabi_children_and_spouses.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"   ✅ Updated {updated} Sahabah")
    print(f"   ⊘ Skipped {skipped} (already had parents)")
    print()
    
    if updated == 0:
        print("ℹ️  No new updates needed. All knowledge base entries already applied.")
        return False
    
    # Run the automation pipeline
    print("=" * 80)
    print("🤖 RUNNING AUTOMATION PIPELINE")
    print("=" * 80)
    print()
    
    print("Step 1: Creating parent nodes and relationships...")
    result = subprocess.run(['python3', 'add_discovered_parents.py'], 
                          capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"❌ Error: {result.stderr}")
        return False
    
    print("\nStep 2: Validating data...")
    result = subprocess.run(['python3', 'validate_data.py'], 
                          capture_output=True, text=True)
    if 'successful' in result.stdout.lower():
        print("   ✅ Validation passed")
    else:
        print(result.stdout)
        if result.returncode != 0:
            print(f"❌ Validation failed: {result.stderr}")
            return False
    
    print("\nStep 3: Exporting to JSON...")
    result = subprocess.run(['python3', 'export_json.py'], 
                          capture_output=True, text=True)
    if 'successfully exported' in result.stdout.lower():
        print("   ✅ Export successful")
    else:
        print(result.stdout[-500:])  # Last 500 chars
    
    print()
    print("=" * 80)
    print("✅ BATCH PROCESSING COMPLETE!")
    print("=" * 80)
    print()
    print("📊 Next Steps:")
    print("   1. Run tests: cd ../frontend && npm test -- --run")
    print("   2. Review changes: git diff")
    print("   3. Commit: git add -A && git commit -m 'feat: batch add parents for N Sahabah'")
    print()
    
    return True


if __name__ == '__main__':
    apply_all_parents()
