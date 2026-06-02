#!/usr/bin/env python3
"""
Clean up the tribe field in sahabah.csv.

The tribe column has corrupted data including:
- "companions of the Prophet" (biography text)
- "False", "Various" (invalid values)
- Biography snippets, source citations, etc.

Valid tribes: Quraish, Ansar, Aws, Khazraj, etc.
"""

import csv
import shutil
from datetime import datetime

# Valid tribe names (add more as discovered)
VALID_TRIBES = {
    'Quraish', 'Quraysh', 'Ansar', 'Aws', 'Khazraj', 'Thaqif', 
    'Banu Hashim', 'Banu Umayyah', 'Banu Tamim', 'Banu Asad',
    'Banu Makhzum', 'Banu Zahrah', 'Banu Taym', 'Banu Adi',
    'Banu Sahm', 'Banu Jumah', 'Banu Nawfal'
}

# Phrases that indicate corrupted data
INVALID_INDICATORS = [
    'companions of the Prophet',
    'Wikipedia', 'Wikidata',
    'Ibn Hajar', 'Tabari', 'Hisham',  # Source citations
    'caliph', 'Caliph',  # Biography text
    'born', 'wife', 'son', 'daughter',  # Relationship text
    'was a', 'was one', 'was the',  # Biography phrases
    'False', 'True',
    'Various',
    'SAHABI', 'SCHOLAR', 'MILITARY',  # Prominence values
    'governor', 'General History',
]


def is_valid_tribe(tribe_value):
    """Check if a tribe value is valid."""
    if not tribe_value or tribe_value.strip() == '':
        return False
    
    tribe_clean = tribe_value.strip().strip('"')
    
    # Check if it's a known valid tribe
    if tribe_clean in VALID_TRIBES:
        return True
    
    # Check for invalid indicators
    for indicator in INVALID_INDICATORS:
        if indicator.lower() in tribe_clean.lower():
            return False
    
    # If it's longer than 30 characters, likely corrupted
    if len(tribe_clean) > 30:
        return False
    
    return False  # Conservative: reject by default


def clean_tribe_field(input_file='sahabah.csv', output_file='sahabah_clean_tribes.csv'):
    """Clean the tribe field."""
    
    print("=" * 80)
    print("CLEANING TRIBE FIELD")
    print("=" * 80)
    
    # Create backup
    backup_file = f'sahabah.csv.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    print(f"\n📦 Creating backup: {backup_file}")
    shutil.copy(input_file, backup_file)
    
    # Read data
    print(f"\n📖 Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"   Loaded {len(rows)} entries")
    
    # Clean tribe field
    print("\n🧹 Cleaning tribe field...")
    cleaned_count = 0
    tribe_distribution = {}
    
    for row in rows:
        original_tribe = row.get('tribe', '')
        
        if not is_valid_tribe(original_tribe):
            if original_tribe.strip():
                print(f"   ❌ Clearing invalid tribe for {row['name_en'][:30]}: '{original_tribe[:50]}'")
                cleaned_count += 1
            row['tribe'] = ''  # Clear invalid values
        
        # Count distribution
        final_tribe = row['tribe'].strip()
        if final_tribe:
            tribe_distribution[final_tribe] = tribe_distribution.get(final_tribe, 0) + 1
        else:
            tribe_distribution['(empty)'] = tribe_distribution.get('(empty)', 0) + 1
    
    # Write output
    print(f"\n💾 Writing cleaned data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    # Report
    print("\n" + "=" * 80)
    print("CLEANUP REPORT")
    print("=" * 80)
    print(f"Invalid tribe values cleared:  {cleaned_count}")
    print(f"\nTribe distribution after cleanup:")
    for tribe, count in sorted(tribe_distribution.items(), key=lambda x: -x[1]):
        print(f"  {tribe:<30} {count:>4} entries")
    
    print("\n" + "=" * 80)
    print("✅ SUCCESS!")
    print("=" * 80)
    print(f"Output written to: {output_file}")
    print(f"\nTo apply changes:")
    print(f"  mv {output_file} {input_file}")
    print(f"  python3 export_json.py")
    
    return cleaned_count


if __name__ == '__main__':
    cleaned = clean_tribe_field()
    print(f"\n✨ Cleaned {cleaned} invalid tribe entries")
    print("\n💡 Suggestion: Hide the tribe field in UI when it's empty")
    print("   The code already does this with: {selectedNode.tribe && (...)}")
