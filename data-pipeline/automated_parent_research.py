#!/usr/bin/env python3
"""
Automated Parent Research System
Discovers and adds parent relationships for all Sahabah using multiple sources
"""

import csv
import re
import time
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import requests

script_dir = Path(__file__).resolve().parent


def load_sahabah_without_parents() -> List[Dict]:
    """Load all Sahabah who don't have parent information yet"""
    with open(script_dir / 'sahabah.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        sahabah = [row for row in reader if row['node_type'] == 'Sahabi']
    
    without_parents = [s for s in sahabah if s.get('has_parents') not in ['True', 'TRUE']]
    return without_parents


def extract_parents_from_factcheck() -> Dict[str, Tuple[str, str]]:
    """Extract parent information from FACT_CHECK_COMPREHENSIVE.md"""
    parent_data = {}
    
    factcheck_path = script_dir / 'FACT_CHECK_COMPREHENSIVE.md'
    if not factcheck_path.exists():
        print("⚠️  FACT_CHECK_COMPREHENSIVE.md not found")
        return parent_data
    
    with open(factcheck_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse parent information from the markdown
    # Look for patterns like "Father: X" and "Mother: Y"
    lines = content.split('\n')
    current_person = None
    father = None
    mother = None
    
    for line in lines:
        # Detect person header
        if line.startswith('##') and not line.startswith('###'):
            # Save previous person if we have data
            if current_person and (father or mother):
                parent_data[current_person] = (father or '', mother or '')
            
            # Reset for new person
            current_person = line.replace('#', '').strip()
            father = None
            mother = None
        
        # Extract father
        if line.strip().startswith('**Father:**') or line.strip().startswith('Father:'):
            match = re.search(r'(?:Father:|Father:)\s*(.+?)(?:\*\*)?$', line)
            if match:
                father = match.group(1).strip().strip('*')
        
        # Extract mother
        if line.strip().startswith('**Mother:**') or line.strip().startswith('Mother:'):
            match = re.search(r'(?:Mother:|Mother:)\s*(.+?)(?:\*\*)?$', line)
            if match:
                mother = match.group(1).strip().strip('*')
    
    # Save last person
    if current_person and (father or mother):
        parent_data[current_person] = (father or '', mother or '')
    
    return parent_data


def query_wikidata_parents(name_en: str, name_ar: str = None) -> Optional[Tuple[str, str]]:
    """Query Wikidata for parent information"""
    try:
        # Search for entity by English name
        search_url = "https://www.wikidata.org/w/api.php"
        search_params = {
            'action': 'wbsearchentities',
            'format': 'json',
            'language': 'en',
            'search': name_en,
            'limit': 1
        }
        
        response = requests.get(search_url, params=search_params, timeout=5)
        if response.status_code != 200:
            return None
        
        data = response.json()
        if not data.get('search'):
            return None
        
        entity_id = data['search'][0]['id']
        
        # Get entity details including parents (P22=father, P25=mother)
        entity_url = "https://www.wikidata.org/w/api.php"
        entity_params = {
            'action': 'wbgetentities',
            'format': 'json',
            'ids': entity_id,
            'props': 'claims',
            'languages': 'en'
        }
        
        response = requests.get(entity_url, params=entity_params, timeout=5)
        if response.status_code != 200:
            return None
        
        entity_data = response.json()
        claims = entity_data['entities'][entity_id].get('claims', {})
        
        father = None
        mother = None
        
        # Extract father (P22)
        if 'P22' in claims:
            father_id = claims['P22'][0]['mainsnak']['datavalue']['value']['id']
            father = get_wikidata_label(father_id)
        
        # Extract mother (P25)
        if 'P25' in claims:
            mother_id = claims['P25'][0]['mainsnak']['datavalue']['value']['id']
            mother = get_wikidata_label(mother_id)
        
        if father or mother:
            return (father or '', mother or '')
        
    except Exception as e:
        # Silently fail on errors
        pass
    
    return None


def get_wikidata_label(entity_id: str) -> Optional[str]:
    """Get English label for a Wikidata entity"""
    try:
        url = "https://www.wikidata.org/w/api.php"
        params = {
            'action': 'wbgetentities',
            'format': 'json',
            'ids': entity_id,
            'props': 'labels',
            'languages': 'en'
        }
        
        response = requests.get(url, params=params, timeout=5)
        if response.status_code != 200:
            return None
        
        data = response.json()
        label = data['entities'][entity_id]['labels'].get('en', {}).get('value')
        return label
    except:
        return None


def research_all_parents(use_wikidata: bool = True, batch_size: int = 5) -> Dict[int, Tuple[str, str]]:
    """Research parents for all Sahabah without them"""
    
    print("=" * 80)
    print("🔍 AUTOMATED PARENT RESEARCH - STARTING")
    print("=" * 80)
    print()
    
    sahabah = load_sahabah_without_parents()
    print(f"📋 Sahabah needing research: {len(sahabah)}")
    print()
    
    # Step 1: Extract from FACT_CHECK_COMPREHENSIVE.md
    print("📚 Step 1: Extracting from FACT_CHECK_COMPREHENSIVE.md...")
    factcheck_parents = extract_parents_from_factcheck()
    print(f"   Found {len(factcheck_parents)} entries in fact check document")
    print()
    
    discovered = {}
    
    # Match Sahabah to fact check data
    for sahabi in sahabah:
        sahabi_id = int(sahabi['id'])
        name_en = sahabi['name_en']
        
        # Try exact match
        if name_en in factcheck_parents:
            discovered[sahabi_id] = factcheck_parents[name_en]
            print(f"   ✓ {sahabi_id}: {name_en} (from fact check)")
            continue
        
        # Try partial match (handle variations like "ibn" vs "bin")
        for fact_name, parents in factcheck_parents.items():
            if fact_name.lower() in name_en.lower() or name_en.lower() in fact_name.lower():
                discovered[sahabi_id] = parents
                print(f"   ✓ {sahabi_id}: {name_en} (matched: {fact_name})")
                break
    
    print(f"\n   Discovered from fact check: {len(discovered)}")
    
    # Step 2: Query Wikidata for remaining
    if use_wikidata:
        remaining = [s for s in sahabah if int(s['id']) not in discovered]
        print(f"\n📡 Step 2: Querying Wikidata for {len(remaining)} remaining Sahabah...")
        print(f"   (Processing in batches of {batch_size} with rate limiting)")
        print()
        
        for i, sahabi in enumerate(remaining[:50]):  # Limit to first 50 to avoid long runs
            sahabi_id = int(sahabi['id'])
            name_en = sahabi['name_en']
            name_ar = sahabi.get('name_ar', '')
            
            if (i + 1) % batch_size == 0:
                print(f"   Progress: {i + 1}/{min(len(remaining), 50)}...")
                time.sleep(1)  # Rate limit
            
            parents = query_wikidata_parents(name_en, name_ar)
            if parents:
                discovered[sahabi_id] = parents
                print(f"   ✓ {sahabi_id}: {name_en} - Father: {parents[0]}, Mother: {parents[1]}")
    
    print()
    print("=" * 80)
    print(f"✅ RESEARCH COMPLETE: Discovered parents for {len(discovered)} Sahabah")
    print("=" * 80)
    print()
    
    return discovered


def update_csv_with_parents(parent_data: Dict[int, Tuple[str, str]]) -> int:
    """Update sahabi_children_and_spouses.csv with discovered parents"""
    
    if not parent_data:
        print("⚠️  No parent data to update")
        return 0
    
    print("📝 Updating sahabi_children_and_spouses.csv...")
    
    with open(script_dir / 'sahabi_children_and_spouses.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    
    updated = 0
    for row in rows:
        child_id = int(row['child_id'])
        if child_id in parent_data:
            # Skip if already has parents
            if row['parents'] and row['parents'].lower() != 'unknown':
                continue
            
            father, mother = parent_data[child_id]
            parents_list = []
            if father:
                parents_list.append(father)
            if mother:
                parents_list.append(mother)
            
            if parents_list:
                row['parents'] = ' | '.join(parents_list)
                updated += 1
    
    with open(script_dir / 'sahabi_children_and_spouses.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"   ✅ Updated {updated} entries")
    return updated


def main():
    """Main automation workflow"""
    print()
    print("🤖 AUTOMATED PARENT RESEARCH SYSTEM")
    print("=" * 80)
    print("This script will:")
    print("  1. Research parents from FACT_CHECK_COMPREHENSIVE.md")
    print("  2. Query Wikidata API for additional data")
    print("  3. Update sahabi_children_and_spouses.csv")
    print("  4. Ready for add_discovered_parents.py to create nodes")
    print("=" * 80)
    print()
    
    # Research parents
    discovered = research_all_parents(use_wikidata=True, batch_size=5)
    
    if not discovered:
        print("\n⚠️  No new parent data discovered")
        return
    
    # Update CSV
    updated = update_csv_with_parents(discovered)
    
    if updated > 0:
        print()
        print("✅ NEXT STEPS:")
        print("   1. Run: python3 add_discovered_parents.py")
        print("   2. Run: python3 validate_data.py && python3 export_json.py")
        print("   3. Test: cd ../frontend && npm test -- --run")
        print("   4. Commit changes")
        print()


if __name__ == '__main__':
    main()
