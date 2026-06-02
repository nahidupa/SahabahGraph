#!/usr/bin/env python3
import csv
import json
import sys
import urllib.request
import urllib.parse
import re
import time
from pathlib import Path
from collections import defaultdict

# Constants
SAHABAH_CSV = Path("sahabah.csv")
REL_CSV = Path("relationships.csv")

HEADERS = {"User-Agent": "SahabahGraphEnrichmentBot/1.0 (https://github.com/your-repo)"}

def call_api(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req) as response:
            data = response.read().decode()
            return json.loads(data)
    except Exception as e:
        return None

def search_wikidata(name, is_prophet=False):
    search_query = name
    if is_prophet: search_query += " Prophet"
    url = f"https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&search={urllib.parse.quote(search_query)}&limit=10"
    data = call_api(url)
    if not data or not data.get("search"): return None

    best_match = None
    for result in data["search"]:
        desc = result.get("description", "").lower()
        if is_prophet and "prophet" in desc: return result["id"]
        relevance_keywords = ["companion", "sahaba", "sahabi", "muhammad", "prophet", "caliph", "islam", "muslim", "early islamic"]
        if any(kw in desc for kw in relevance_keywords):
            if not best_match: best_match = result["id"]
            if "daughter of muhammad" in desc or "son of muhammad" in desc: return result["id"]
    return best_match or data["search"][0]["id"]

def get_wikidata_item(qid):
    url = f"https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids={qid}"
    data = call_api(url)
    if data and "entities" in data: return data["entities"].get(qid)
    return None

def get_wikipedia_summary(title, lang="en"):
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title.replace(' ', '_'))}"
    data = call_api(url)
    if data and "extract" in data: return data["extract"]
    return ""

def translate_text(text, target_lang):
    if not text: return ""
    url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(text[:500])}&langpair=en|{target_lang}"
    data = call_api(url)
    if data and "responseData" in data: return data["responseData"].get("translatedText") or ""
    return ""

def ce_to_hijri(ce_year):
    if ce_year == 0: return 0
    return int((ce_year - 622) * (33 / 32))

def parse_wikidata_year(claims):
    if not claims: return 0
    try:
        for claim in claims:
            if "mainsnak" in claim and "datavalue" in claim["mainsnak"]:
                time_str = claim["mainsnak"]["datavalue"]["value"]["time"]
                match = re.search(r"([+-]\d+)", time_str)
                if match: return int(match.group(1))
    except: pass
    return 0

def get_qid_from_claim(claims):
    if not claims: return None
    try:
        return claims[0]["mainsnak"]["datavalue"]["value"]["id"]
    except: return None

def get_label(entity, lang):
    return entity.get("labels", {}).get(lang, {}).get("value")

def normalize_name(name):
    if not name: return ""
    return re.sub(r"[^\w\s]", "", name.lower()).strip()

class SahabahEnricher:
    def __init__(self):
        self.load_data()
        self.new_nodes = []
        self.new_rels = []

    def load_data(self):
        with open(SAHABAH_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            self.fieldnames = list(reader.fieldnames)
            for lang in ["bn", "de"]:
                if f"name_{lang}" not in self.fieldnames: self.fieldnames.append(f"name_{lang}")
                if f"biography_{lang}" not in self.fieldnames: self.fieldnames.append(f"biography_{lang}")
            self.sahabah = list(reader)

        with open(REL_CSV, "r", encoding="utf-8") as f:
            self.relationships = list(csv.DictReader(f))
            self.rel_fieldnames = ["source_id", "target_id", "type", "category"]

        self.id_map = {row["id"]: row for row in self.sahabah}
        self.name_map = {normalize_name(row["name_en"]): row["id"] for row in self.sahabah}
        ids = [int(row["id"]) for row in self.sahabah if row["id"].isdigit()]
        self.next_id = max(ids) + 1 if ids else 1

    def save_data(self):
        self.recompute_flags()
        for node in self.new_nodes: self.sahabah.append(node)
        for rel in self.new_rels: self.relationships.append(rel)

        with open(SAHABAH_CSV, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=self.fieldnames)
            writer.writeheader()
            writer.writerows(self.sahabah)

        with open(REL_CSV, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=self.rel_fieldnames)
            writer.writeheader()
            writer.writerows(self.relationships)

    def find_or_create_person(self, qid, relation_name=None):
        entity = get_wikidata_item(qid)
        if not entity: return None
        name_en = get_label(entity, "en") or relation_name
        if not name_en: return None
        norm_name = normalize_name(name_en)
        if norm_name in self.name_map: return self.name_map[norm_name]
        for node in self.new_nodes:
            if normalize_name(node["name_en"]) == norm_name: return node["id"]

        new_id = str(self.next_id)
        self.next_id += 1
        claims = entity.get("claims", {})
        gender_qid = get_qid_from_claim(claims.get("P21"))
        gender = "M" if gender_qid == "Q6581097" else "F" if gender_qid == "Q6581072" else "M"

        new_node = {col: "" for col in self.fieldnames}
        new_node.update({
            "id": new_id, "name_ar": get_label(entity, "ar") or "", "name_en": name_en,
            "name_bn": get_label(entity, "bn") or "", "name_de": get_label(entity, "de") or "",
            "gender": gender, "is_prophet": "False", "prominence": "SAHABI",
            "node_type": "Sahabi" if any(kw in (entity.get("descriptions", {}).get("en", {}).get("value") or "").lower() for kw in ["companion", "sahaba", "sahabi"]) else "PoliticalFigure",
            "biography_short": get_wikipedia_summary(name_en) or "", "biography_source": "Wikidata/Wikipedia",
            "birth_year_hijri": str(ce_to_hijri(parse_wikidata_year(claims.get("P569")))),
            "death_year_hijri": str(ce_to_hijri(parse_wikidata_year(claims.get("P570")))),
        })
        for col in self.fieldnames:
            if col.startswith("has_") and not new_node[col]: new_node[col] = "False"

        self.new_nodes.append(new_node)
        self.name_map[norm_name] = new_id
        self.id_map[new_id] = new_node
        return new_id

    def enrich_person(self, person_id):
        person = self.id_map.get(person_id)
        if not person: return
        print(f"Enriching {person['name_en']} (ID: {person_id})...")
        qid = search_wikidata(person["name_en"], person.get("is_prophet") == "True")
        if not qid: return
        entity = get_wikidata_item(qid)
        if not entity: return
        claims = entity.get("claims", {})
        person["name_ar"] = get_label(entity, "ar") or person.get("name_ar", "")
        person["name_bn"] = get_label(entity, "bn") or person.get("name_bn", "")
        person["name_de"] = get_label(entity, "de") or person.get("name_de", "")
        wiki_title = entity.get("sitelinks", {}).get("enwiki", {}).get("title")
        if wiki_title:
            bio_en = get_wikipedia_summary(wiki_title, "en")
            if bio_en:
                person["biography_short"] = bio_en
                person["biography_source"] = f"Wikipedia ({wiki_title})"
                person["biography_bn"] = get_wikipedia_summary(wiki_title, "bn") or translate_text(bio_en, "bn")
                person["biography_de"] = get_wikipedia_summary(wiki_title, "de") or translate_text(bio_en, "de")
        b_ce = parse_wikidata_year(claims.get("P569"))
        if b_ce: person["birth_year_hijri"] = str(ce_to_hijri(b_ce))
        d_ce = parse_wikidata_year(claims.get("P570"))
        if d_ce: person["death_year_hijri"] = str(ce_to_hijri(d_ce))
        tribe_qid = get_qid_from_claim(claims.get("P361")) or get_qid_from_claim(claims.get("P463"))
        if tribe_qid:
            tribe_ent = get_wikidata_item(tribe_qid)
            if tribe_ent: person["tribe"] = get_label(tribe_ent, "en") or person.get("tribe", "")
        for p_claim in (claims.get("P22", []) + claims.get("P25", [])):
            p_qid = get_qid_from_claim([p_claim])
            if p_qid:
                parent_id = self.find_or_create_person(p_qid)
                if parent_id: self.add_rel(parent_id, person_id, "PARENT_OF")
        for c_claim in claims.get("P40", []):
            c_qid = get_qid_from_claim([c_claim])
            if c_qid:
                child_id = self.find_or_create_person(c_qid)
                if child_id: self.add_rel(person_id, child_id, "PARENT_OF")
        for s_claim in claims.get("P26", []):
            s_qid = get_qid_from_claim([s_claim])
            if s_qid:
                spouse_id = self.find_or_create_person(s_qid)
                if spouse_id: self.add_rel(person_id, spouse_id, "SPOUSE_OF")

    def add_rel(self, source, target, rel_type):
        all_rels = self.relationships + self.new_rels
        for rel in all_rels:
            if rel["source_id"] == str(source) and rel["target_id"] == str(target) and rel["type"] == rel_type: return
        self.new_rels.append({"source_id": str(source), "target_id": str(target), "type": rel_type, "category": "family"})

    def recompute_flags(self):
        by_source, by_target = defaultdict(list), defaultdict(list)
        for rel in (self.relationships + self.new_rels):
            by_source[rel["source_id"]].append(rel)
            by_target[rel["target_id"]].append(rel)
        for row in (self.sahabah + self.new_nodes):
            pid = row["id"]
            src, tgt = by_source[pid], by_target[pid]
            row["has_parents"] = "True" if any(r["type"] == "PARENT_OF" and r["target_id"] == pid for r in tgt) else "False"
            row["has_children"] = "True" if any(r["type"] == "PARENT_OF" and r["source_id"] == pid for r in src) else "False"
            row["has_spouses"] = "True" if any(r["type"] == "SPOUSE_OF" for r in (src + tgt)) else "False"
            row["has_battles"] = "True" if any(r["type"] == "PARTICIPATED_IN" and r["source_id"] == pid for r in src) else "False"

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 enrich_sahabah.py <id1> <id2> ...")
        return
    enricher = SahabahEnricher()
    for pid in sys.argv[1:]:
        enricher.enrich_person(pid)
        time.sleep(1)
    enricher.save_data()
    print("Enrichment complete.")

if __name__ == "__main__": main()
