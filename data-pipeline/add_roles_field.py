#!/usr/bin/env python3
"""
Add a 'roles' field to sahabah.csv for multiple classifications.

This allows people to have multiple roles:
- CALIPH (Rashidun Caliphs, Umayyad Caliphs, etc.)
- GOVERNOR (provincial governors)
- MILITARY_COMMANDER (generals, army leaders)
- SCHOLAR (hadith scholars, jurists)
- FAMILY_MEMBER (family of the Prophet)
- MARTYR (shaheed)
"""

import csv
import re

# Define role detection rules
ROLE_RULES = {
    'CALIPH': [
        lambda row: 'caliph' in row.get('biography_short', '').lower(),
        lambda row: 'khalifa' in row.get('biography_short', '').lower(),
        lambda row: row.get('prominence') in ['RASHIDUN_CALIPH', 'UMAYYAD_CALIPH', 'ABBASID_CALIPH'],
        lambda row: 'خليفة' in row.get('name_ar', ''),
    ],
    'GOVERNOR': [
        lambda row: 'governor' in row.get('biography_short', '').lower(),
        lambda row: 'served as governor' in row.get('biography_short', '').lower(),
    ],
    'MILITARY_COMMANDER': [
        lambda row: 'commander' in row.get('biography_short', '').lower(),
        lambda row: 'general' in row.get('biography_short', '').lower(),
        lambda row: 'conquest' in row.get('biography_short', '').lower(),
        lambda row: 'military' in row.get('biography_short', '').lower(),
        lambda row: 'battle' in row.get('biography_short', '').lower() and row.get('prominence') != 'BATTLE',
    ],
    'SCHOLAR': [
        lambda row: 'scholar' in row.get('biography_short', '').lower(),
        lambda row: 'hadith' in row.get('biography_short', '').lower(),
        lambda row: 'narrator' in row.get('biography_short', '').lower(),
        lambda row: 'jurist' in row.get('biography_short', '').lower(),
        lambda row: 'faqih' in row.get('biography_short', '').lower(),
    ],
    'MARTYR': [
        lambda row: 'martyr' in row.get('biography_short', '').lower(),
        lambda row: 'shaheed' in row.get('biography_short', '').lower(),
        lambda row: 'martyred' in row.get('biography_short', '').lower(),
        lambda row: 'شهيد' in row.get('biography_short', ''),
    ],
    'FAMILY_OF_PROPHET': [
        lambda row: row.get('id') in ['0', '11', '12', '13', '14', '15', '20', '21', '22'],  # Prophet's immediate family
        lambda row: row.get('prominence') == 'AHL_AL_BAYT',
        lambda row: "Prophet's" in row.get('biography_short', '') and 'daughter' in row.get('biography_short', '').lower(),
        lambda row: "Prophet's" in row.get('biography_short', '') and 'wife' in row.get('biography_short', '').lower(),
    ],
}

# Manual overrides for well-known figures
MANUAL_ROLES = {
    '0': ['PROPHET'],
    '1': ['CALIPH', 'SAHABI', 'ASHARA_MUBASHSHARA'],
    '2': ['CALIPH', 'SAHABI', 'ASHARA_MUBASHSHARA'],
    '3': ['CALIPH', 'SAHABI', 'ASHARA_MUBASHSHARA'],
    '4': ['CALIPH', 'SAHABI', 'ASHARA_MUBASHSHARA', 'FAMILY_OF_PROPHET'],
    '19': ['MILITARY_COMMANDER', 'SAHABI'],  # Khalid ibn al-Walid
    '42': ['CALIPH', 'SAHABI'],  # Muawiyah I
}


def detect_roles(row):
    """Detect all applicable roles for a person."""
    person_id = row.get('id', '')
    
    # Check manual overrides first
    if person_id in MANUAL_ROLES:
        return MANUAL_ROLES[person_id]
    
    roles = set()
    
    # Apply role detection rules
    for role_name, conditions in ROLE_RULES.items():
        for condition in conditions:
            try:
                if condition(row):
                    roles.add(role_name)
                    break  # One match is enough for this role
            except Exception:
                pass
    
    # Always include the original node_type if it's meaningful
    node_type = row.get('node_type', '').strip()
    if node_type and node_type not in ['False', 'Various', '0', '60', '77', '']:
        # Use prominence if it's more specific
        prominence = row.get('prominence', '').strip()
        if prominence and prominence != node_type:
            roles.add(prominence)
        else:
            roles.add(node_type)
    
    return sorted(list(roles))


def add_roles_field(input_file, output_file):
    """Add roles field to sahabah.csv."""
    
    print(f"Reading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"Loaded {len(rows)} entries")
    
    # Add 'roles' field after 'prominence'
    new_fieldnames = []
    for field in fieldnames:
        new_fieldnames.append(field)
        if field == 'prominence':
            new_fieldnames.append('roles')
    
    print("\nDetecting roles...")
    
    # Detect roles for each entry
    role_counts = {}
    for row in rows:
        roles = detect_roles(row)
        row['roles'] = ','.join(roles) if roles else ''
        
        # Count for statistics
        for role in roles:
            role_counts[role] = role_counts.get(role, 0) + 1
    
    # Write output
    print(f"\nWriting to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=new_fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print("\n" + "=" * 80)
    print("ROLES STATISTICS")
    print("=" * 80)
    for role, count in sorted(role_counts.items(), key=lambda x: -x[1]):
        print(f"  {role:<30} {count:>4} people")
    
    print("\n" + "=" * 80)
    print("SUCCESS!")
    print("=" * 80)
    print(f"Output written to: {output_file}")
    print(f"\nNew 'roles' field contains comma-separated values like:")
    print("  - CALIPH,SAHABI,ASHARA_MUBASHSHARA")
    print("  - MILITARY_COMMANDER,SAHABI")
    print("  - SCHOLAR,SAHABI")
    print("\nThis allows people to have multiple classifications!")


if __name__ == '__main__':
    import shutil
    from datetime import datetime
    
    input_file = 'sahabah.csv'
    output_file = 'sahabah_with_roles.csv'
    
    # Create backup
    backup_file = f'sahabah.csv.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    print(f"Creating backup: {backup_file}")
    shutil.copy(input_file, backup_file)
    
    # Add roles field
    add_roles_field(input_file, output_file)
    
    print("\nTo apply changes:")
    print(f"  mv {output_file} {input_file}")
