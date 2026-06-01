#!/usr/bin/env python3
import csv
import json
from pathlib import Path

SAHABAH_CSV = "sahabah.csv"
RELATIONSHIPS_CSV = "relationships.csv"
CITIES_CSV = "cities.csv"
GOVERNOR_TERMS_CSV = "city_governor_terms.csv"
OUTPUT_JSON = "../frontend/public/data/sahabah_data.json"
POLITICAL_JSON = "../frontend/public/data/political_terms.json"

def load_data():
    sahabah_data, relationships_data, cities_data, terms_data = [], [], [], []
    with open(SAHABAH_CSV, 'r', encoding='utf-8') as f:
        sahabah_data = list(csv.DictReader(f))
    with open(RELATIONSHIPS_CSV, 'r', encoding='utf-8') as f:
        relationships_data = list(csv.DictReader(f))
    if Path(CITIES_CSV).exists():
        with open(CITIES_CSV, 'r', encoding='utf-8') as f:
            cities_data = list(csv.DictReader(f))
    if Path(GOVERNOR_TERMS_CSV).exists():
        with open(GOVERNOR_TERMS_CSV, 'r', encoding='utf-8') as f:
            terms_data = list(csv.DictReader(f))
    return sahabah_data, relationships_data, cities_data, terms_data

def export_to_json(sahabah_data, relationships_data):
    nodes = []
    person_id_map = {}
    for person in sahabah_data:
        person_id = int(person['id'])
        person_id_map[person_id] = len(nodes)
        node = {
            'id': str(person_id),
            'name_en': person['name_en'],
            'name_ar': person['name_ar'],
            'name_bn': person.get('name_bn', ''),
            'name_de': person.get('name_de', ''),
            'kunyah': person.get('kunyah', ''),
            'laqab': person.get('laqab', ''),
            'gender': 'male' if person.get('gender', '').upper() == 'M' else ('female' if person.get('gender', '').upper() == 'F' else person.get('gender', '').lower()),
            'is_prophet': person.get('is_prophet', '').lower() == 'true',
            'node_type': person.get('node_type', ''),
            'prominence': person.get('prominence', ''),
            'biography_short': person.get('biography_short', ''),
            'biography_bn': person.get('biography_bn', ''),
            'biography_de': person.get('biography_de', ''),
            'biography_source': person.get('biography_source', ''),
            'tribe': person.get('tribe', ''),
            'clan': person.get('clan', ''),
            'birth_year_hijri': person.get('birth_year_hijri', ''),
            'death_year_hijri': person.get('death_year_hijri', ''),
            'has_children': person.get('has_children', '').lower() == 'true',
            'has_parents': person.get('has_parents', '').lower() == 'true',
            'has_spouses': person.get('has_spouses', '').lower() == 'true',
            'has_siblings': person.get('has_siblings', '').lower() == 'true',
            'has_uncles': person.get('has_uncles', '').lower() == 'true',
            'has_cousins': person.get('has_cousins', '').lower() == 'true',
            'has_companions': person.get('has_companions', '').lower() == 'true',
            'has_teachers': person.get('has_teachers', '').lower() == 'true',
            'has_students': person.get('has_students', '').lower() == 'true',
            'has_battles': person.get('has_battles', '').lower() == 'true',
            'has_participants': person.get('has_participants', '').lower() == 'true',
        }
        nodes.append(node)
    
    links = []
    for rel in relationships_data:
        try:
            source_id = int(rel['source_id'])
            target_id = int(rel['target_id'])
            if source_id in person_id_map and target_id in person_id_map:
                links.append({
                    'source': source_id, 'target': target_id,
                    'source_id': source_id, 'target_id': target_id,
                    'type': rel['type'], 'category': rel.get('category', '')
                })
        except: pass
    return {'nodes': nodes, 'links': links}

def export_political_to_json(cities_data, terms_data):
    cities = []
    for city in cities_data:
        cities.append({
            'id': city['city_id'], 'name_ar': city['city_name_ar'], 'name_en': city['city_name_en'],
            'lat': float(city['lat']), 'lng': float(city['lng']), 'x': int(city['map_x']), 'y': int(city['map_y'])
        })
    terms = []
    for term in terms_data:
        terms.append({
            'id': term['term_id'], 'city_id': term['city_id'], 'governor_name': term['governor_name'],
            'governor_id': int(term['governor_id']) if term['governor_id'] else None,
            'caliph_name': term['caliph_name'], 'caliph_id': int(term['caliph_id']) if term['caliph_id'] else None,
            'start_year_ce': int(term['start_year_ce']) if term['start_year_ce'] else 0,
            'end_year_ce': int(term['end_year_ce']) if term['end_year_ce'] else 0,
            'start_year_hijri': int(term['start_year_hijri']) if term['start_year_hijri'] else 0,
            'end_year_hijri': int(term['end_year_hijri']) if term['end_year_hijri'] else 0,
            'termination': term['termination_type'], 'notes': term['notes'], 'source_ref': term['source_ref'],
            'vacancy': not term['governor_name']
        })
    return {'cities': cities, 'terms': terms}

def main():
    sahabah_data, relationships_data, cities_data, terms_data = load_data()
    graph_data = export_to_json(sahabah_data, relationships_data)
    output_path = Path(OUTPUT_JSON)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, ensure_ascii=False, indent=2)
    if cities_data or terms_data:
        political_data = export_political_to_json(cities_data, terms_data)
        with open(POLITICAL_JSON, 'w', encoding='utf-8') as f:
            json.dump(political_data, f, ensure_ascii=False, indent=2)
    print("Export complete.")

if __name__ == '__main__': main()
