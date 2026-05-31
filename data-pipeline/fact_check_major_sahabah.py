#!/usr/bin/env python3
"""
Improved fact-check script: searches for correct QIDs by name, then fetches family data
"""

import json
import urllib.request
import urllib.error
import urllib.parse
import time
from pathlib import Path
from typing import Dict, List, Optional

# The 10 promised paradise (Ashara Mubashshara) + Prophet
MAJOR_SAHABAH_NAMES = {
    "Muhammad": ["Muhammad", "prophet of islam"],
    "Abu Bakr as-Siddiq": ["Abu Bakr", "first caliph"],
    "Umar ibn al-Khattab": ["Umar", "second caliph"],
    "Uthman ibn Affan": ["Uthman", "third caliph"],
    "Ali ibn Abi Talib": ["Ali ibn Abi Talib", "fourth caliph"],
    "Talha ibn Ubaydullah": ["Talha ibn Ubaydullah"],
    "Zubayr ibn al-Awwam": ["Zubayr ibn al-Awwam"],
    "Abdur Rahman ibn Awf": ["Abdur Rahman ibn Awf"],
    "Sa'd ibn Abi Waqqas": ["Sa'd ibn Abi Waqqas", "Sa'ad"],
    "Sa'id ibn Zayd": ["Sa'id ibn Zayd", "Said ibn Zayd"],
    "Abu Ubaydah ibn al-Jarrah": ["Abu Ubaydah"],
}

HEADERS = {
    "User-Agent": "SahabahGraph fact-check/1.0 (+https://github.com/sahabahgraph)"
}

def search_wikidata_sparql(name: str) -> Optional[str]:
    """Search for person by name using SPARQL."""
    # SPARQL query to find Islamic historical figures
    sparql_query = f"""
    SELECT ?item ?itemLabel ?description WHERE {{
      ?item wdt:P31 wd:Q5 .
      ?item rdfs:label "{name}"@en .
      ?item schema:description ?description .
      FILTER (LANG(?description) = "en")
      FILTER (REGEX(?description, "Islamic|Sahab|companion|caliph|Arab", "i"))
    }}
    LIMIT 5
    """
    
    try:
        url = "https://query.wikidata.org/sparql"
        params = urllib.parse.urlencode({
            'query': sparql_query,
            'format': 'json'
        })
        
        req = urllib.request.Request(
            f"{url}?{params}",
            headers=HEADERS
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            if data.get('results', {}).get('bindings'):
                # Return the first result's QID
                qid = data['results']['bindings'][0]['item']['value'].split('/')[-1]
                description = data['results']['bindings'][0].get('description', {}).get('value', '')
                print(f"    Found: {qid} - {description[:80]}")
                return qid
    except Exception as e:
        print(f"    SPARQL Search Error: {e}")
    
    return None

def fetch_json(url: str, max_retries: int = 3) -> Optional[Dict]:
    """Fetch JSON from URL with retry logic."""
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait_time = 2 ** attempt
                print(f"      Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                return None
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(0.5)
    return None

def get_entity(qid: str) -> Optional[Dict]:
    """Fetch full entity from Wikidata."""
    url = f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json"
    return fetch_json(url)

def extract_claims_by_property(entity: Dict, property_id: str) -> List[str]:
    """Extract claim values by property ID."""
    results = []
    if 'claims' not in entity:
        return results
    
    claims = entity.get('claims', {}).get(property_id, [])
    for claim in claims:
        try:
            if claim.get('mainsnak', {}).get('snaktype') == 'value':
                target = claim['mainsnak'].get('datavalue', {}).get('value', {})
                if isinstance(target, dict) and 'id' in target:
                    results.append(target['id'])
        except:
            pass
    return results

def get_label(entity: Dict, language: str = 'en') -> str:
    """Get label in preferred language."""
    labels = entity.get('labels', {})
    if language in labels:
        return labels[language]['value']
    elif 'en' in labels:
        return labels['en']['value']
    return entity.get('id', 'Unknown')

def get_description(entity: Dict) -> str:
    """Get description."""
    descriptions = entity.get('descriptions', {})
    if 'en' in descriptions:
        return descriptions['en']['value']
    return ''

def fetch_person_family_data(qid: str, person_name: str) -> Optional[Dict]:
    """Fetch comprehensive family data for a person."""
    print(f"\n  Fetching: {person_name} ({qid})...")
    
    entity_data = get_entity(qid)
    if not entity_data:
        print(f"    ERROR: Could not fetch entity")
        return None
    
    entity = entity_data['entities'][qid]
    label = get_label(entity)
    description = get_description(entity)
    
    print(f"    Label: {label}")
    print(f"    Description: {description[:100]}")
    
    # P22=father, P25=mother, P40=child, P26=spouse, P3373=sibling
    children_qids = extract_claims_by_property(entity, 'P40')
    spouse_qids = extract_claims_by_property(entity, 'P26')
    parents_qids = extract_claims_by_property(entity, 'P22') + extract_claims_by_property(entity, 'P25')
    sibling_qids = extract_claims_by_property(entity, 'P3373')
    
    print(f"    Found {len(children_qids)} children, {len(spouse_qids)} spouses, {len(parents_qids)} parents")
    
    # Fetch details for children
    children_details = []
    for child_qid in children_qids:
        time.sleep(0.2)
        child_entity_data = get_entity(child_qid)
        if child_entity_data:
            child = child_entity_data['entities'][child_qid]
            child_details = {
                'qid': child_qid,
                'label': get_label(child),
                'description': get_description(child)
            }
            children_details.append(child_details)
            print(f"      ✓ Child: {child_details['label']}")
    
    # Fetch details for spouses and their other marriages
    spouse_details_list = []
    for spouse_qid in spouse_qids:
        time.sleep(0.2)
        spouse_entity_data = get_entity(spouse_qid)
        if spouse_entity_data:
            spouse = spouse_entity_data['entities'][spouse_qid]
            spouse_label = get_label(spouse)
            spouse_description = get_description(spouse)
            
            # Get spouse's other spouses
            other_spouse_qids = extract_claims_by_property(spouse, 'P26')
            other_spouses = [s for s in other_spouse_qids if s != qid]
            
            # Get spouse's children
            spouse_children_qids = extract_claims_by_property(spouse, 'P40')
            
            spouse_details = {
                'qid': spouse_qid,
                'label': spouse_label,
                'description': spouse_description,
                'other_spouses_qids': other_spouses,
                'children_qids': spouse_children_qids,
                'other_spouses': [],
                'children': []
            }
            
            # Fetch other spouses details
            for other_spouse_qid in other_spouses:
                time.sleep(0.2)
                other_spouse_data = get_entity(other_spouse_qid)
                if other_spouse_data:
                    other = other_spouse_data['entities'][other_spouse_qid]
                    spouse_details['other_spouses'].append({
                        'qid': other_spouse_qid,
                        'label': get_label(other),
                        'description': get_description(other)
                    })
            
            # Fetch children details
            for child_qid in spouse_children_qids:
                time.sleep(0.2)
                child_data = get_entity(child_qid)
                if child_data:
                    child = child_data['entities'][child_qid]
                    spouse_details['children'].append({
                        'qid': child_qid,
                        'label': get_label(child),
                        'description': get_description(child)
                    })
            
            spouse_details_list.append(spouse_details)
            print(f"      ✓ Spouse: {spouse_label} ({len(other_spouses)} other marriages, {len(spouse_details['children'])} children)")
    
    return {
        'qid': qid,
        'label': label,
        'description': description,
        'children': children_details,
        'spouses': spouse_details_list,
        'parents': parents_qids,
        'siblings': sibling_qids
    }

def generate_markdown_report(report: Dict) -> str:
    """Generate markdown report."""
    markdown = f"""# FACT-CHECK REPORT: 10 MAJOR SAHABAH

**Generated:** {report['timestamp']}

## Summary Statistics
- **Total Subjects Found:** {report['statistics']['subjects_found']}
- **Total Spouses Documented:** {report['statistics']['total_spouses']}
- **Total Children Documented:** {report['statistics']['total_children']}
- **Wives with Multiple Marriages:** {report['statistics']['wives_with_multiple_marriages']}

## QID Mapping (Wikidata References)

"""
    
    for person_name, qid in report['qid_map'].items():
        markdown += f"- **{person_name}**: {qid}\n"
    
    markdown += "\n---\n"
    
    for person_name, data in report['sahabah'].items():
        if data is None:
            continue
        markdown += f"\n## {person_name}\n"
        markdown += f"**QID:** {data['qid']}\n"
        markdown += f"**Description:** {data['description']}\n\n"
        
        # Children
        markdown += f"### Children ({len(data['children'])} documented)\n"
        if data['children']:
            for child in data['children']:
                markdown += f"- **{child['label']}** ({child['qid']})\n"
                if child['description']:
                    markdown += f"  - {child['description']}\n"
        else:
            markdown += "- None documented\n"
        
        # Spouses
        markdown += f"\n### Spouses ({len(data['spouses'])} documented)\n"
        if data['spouses']:
            for i, spouse in enumerate(data['spouses'], 1):
                markdown += f"\n#### {i}. {spouse['label']} ({spouse['qid']})\n"
                if spouse['description']:
                    markdown += f"**Description:** {spouse['description']}\n\n"
                
                # Other marriages
                if spouse['other_spouses']:
                    markdown += f"**Other Marriages ({len(spouse['other_spouses'])}):**\n"
                    for other_spouse in spouse['other_spouses']:
                        markdown += f"- {other_spouse['label']} ({other_spouse['qid']})\n"
                else:
                    markdown += "No other marriages documented\n"
                
                # Children from all marriages
                if spouse['children']:
                    markdown += f"\n**Children from All Marriages ({len(spouse['children'])}):**\n"
                    for child in spouse['children']:
                        markdown += f"- {child['label']} ({child['qid']})\n"
                        if child['description']:
                            markdown += f"  - {child['description']}\n"
                else:
                    markdown += "\nNo children documented\n"
        else:
            markdown += "- None documented\n"
        
        markdown += "\n---\n"
    
    markdown += """
## Notes

1. **Data Source:** Wikidata (CC0 licensed)
2. **Cross-Reference:** Always verify with traditional Islamic historical sources:
   - Tabaqat al-Kubra by Ibn Sa'd
   - Ansab al-Ashraf by al-Baladhuri
   - Al-Isabah by Ibn Hajar al-Asqalani
   - Sirat Ibn Hisham (Sira of the Prophet)
3. **Limitations:** Some historical figures may have incomplete records in Wikidata
4. **Multiple Marriages:** Some spouses' marriage records may not be complete in Wikidata
"""
    
    return markdown

def main():
    """Main execution."""
    
    print("=" * 90)
    print("IMPROVED FACT-CHECK REPORT: 10 MAJOR SAHABAH (ASHARA MUBASHSHARA)")
    print("=" * 90)
    print("\nStep 1: Searching for correct Wikidata QIDs by name...")
    
    qid_map = {}
    for person_name, search_terms in MAJOR_SAHABAH_NAMES.items():
        print(f"\n  Searching: {person_name}")
        for search_term in search_terms:
            qid = search_wikidata_sparql(search_term)
            if qid:
                qid_map[person_name] = qid
                break
        
        if person_name not in qid_map:
            print(f"    WARNING: Could not find QID for {person_name}")
    
    print(f"\n\nStep 2: Fetching family data for {len(qid_map)} subjects...")
    
    report = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'qid_map': qid_map,
        'sahabah': {},
        'statistics': {
            'subjects_found': len(qid_map),
            'total_spouses': 0,
            'total_children': 0,
            'wives_with_multiple_marriages': 0,
        }
    }
    
    for person_name, qid in qid_map.items():
        family_data = fetch_person_family_data(qid, person_name)
        if family_data:
            report['sahabah'][person_name] = family_data
            
            # Update stats
            report['statistics']['total_spouses'] += len(family_data['spouses'])
            total_children = len(family_data['children'])
            for spouse in family_data['spouses']:
                total_children += len(spouse['children'])
            report['statistics']['total_children'] += total_children
            
            for spouse in family_data['spouses']:
                if spouse['other_spouses']:
                    report['statistics']['wives_with_multiple_marriages'] += 1
    
    # Save reports
    report_json_path = Path(__file__).parent / 'fact_check_report.json'
    with open(report_json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n✓ JSON report saved: {report_json_path}")
    
    # Generate markdown
    markdown = generate_markdown_report(report)
    markdown_path = Path(__file__).parent / 'fact_check_report.md'
    with open(markdown_path, 'w', encoding='utf-8') as f:
        f.write(markdown)
    print(f"✓ Markdown report saved: {markdown_path}")
    
    print("\n" + "=" * 90)
    print("SUMMARY")
    print("=" * 90)
    print(f"Subjects Found: {report['statistics']['subjects_found']}")
    print(f"Total Spouses: {report['statistics']['total_spouses']}")
    print(f"Total Children: {report['statistics']['total_children']}")
    print(f"Wives with Multiple Marriages: {report['statistics']['wives_with_multiple_marriages']}")

if __name__ == '__main__':
    main()
