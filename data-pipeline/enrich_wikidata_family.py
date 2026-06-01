#!/usr/bin/env python3
"""Enrich family relationships and temporal data from Wikidata into local CSV/JSON graph data."""

from __future__ import annotations
import csv
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

ROOT = Path(__file__).resolve().parents[1]
SAHABAH_CSV = ROOT / "data-pipeline" / "sahabah.csv"
REL_CSV = ROOT / "data-pipeline" / "relationships.csv"
GRAPH_JSON = ROOT / "frontend" / "public" / "data" / "sahabah_data.json"
REPORT_JSON = ROOT / "data-pipeline" / "enrichment_report.json"

WIKIDATA_ENTITY_URL = "https://www.wikidata.org/wiki/Special:EntityData/{qid}.json"
WIKIDATA_SEARCH_URL = "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&limit=5&search={query}"
USER_AGENT = "SahabahGraphEnrichment/1.5 (comprehensive enrichment pipeline)"

SEED_QIDS: Dict[str, str] = {
    "Muhammad (PBUH)": "Q9458",
    "Abu Bakr as-Siddiq": "Q1841",
    "Umar ibn al-Khattab": "Q8462",
    "Uthman ibn Affan": "Q45711",
    "Ali ibn Abi Talib": "Q35610",
    "Aisha bint Abi Bakr": "Q235313",
    "Fatima bint Muhammad": "Q185560",
    "Hasan ibn Ali": "Q22250",
    "Husayn ibn Ali": "Q52117",
    "Khadija bint Khuwaylid": "Q47277",
    "Zubayr ibn al-Awwam": "Q318786",
    "Talha ibn Ubaydullah": "Q316917",
    "Muawiyah ibn Abi Sufyan": "Q245839",
    "Yazid ibn Muawiya": "Q312334",
    "Abdullah ibn Abbas": "Q329314",
    "Abdullah ibn Umar": "Q316958",
    "Abu Hurairah": "Q310417",
    "Anas ibn Malik": "Q324117",
    "Abu Sufyan ibn Harb": "Q282102",
    "Asma bint Abi Bakr": "Q242867",
    "Hafsa bint Umar": "Q241128",
    "Umm Salama": "Q241547",
    "Safiyya bint Huyayy": "Q241685",
    "Zaynab bint Jahsh": "Q241658",
    "Abbas ibn Abd al-Muttalib": "Q311320",
    "Hamza ibn Abd al-Muttalib": "Q213000",
    "Bilal ibn Rabah": "Q161014",
    "Sa'd ibn Abi Waqqas": "Q312214",
    "Ja'far ibn Abi Talib": "Q332614",
    "Khalid ibn al-Walid": "Q193635",
    "Abu Ubaydah ibn al-Jarrah": "Q311311",
    "Amr ibn al-Aas": "Q311288",
    "Usama ibn Zayd": "Q637775",
    "Zayd ibn Harithah": "Q318357",
    "Abdullah ibn Mas'ud": "Q332644",
    "Jabir ibn Abdullah": "Q324147",
    "Abu Sa'id al-Khudri": "Q311330",
    "Mu'adh ibn Jabal": "Q311338",
    "Ubayy ibn Ka'b": "Q311332",
    "Zayd ibn Thabit": "Q311334",
    "Abu Dharr al-Ghifari": "Q334346",
    "Salman al-Farsi": "Q252172",
    "Ammar ibn Yasir": "Q263659",
    "Miqdad ibn Aswad": "Q161021",
    "Hudhayfa ibn al-Yaman": "Q311336",
    "Marwan ibn al-Hakam": "Q161012",
}

NAME_STOPWORDS = {"ibn", "bint", "bin", "abu", "umm", "al"}
BIOGRAPHY_BLACKLIST = {"ice hockey", "football club", "american editor", "american", "village", "municipality", "album", "film", "company", "organization"}

def normalize_name(value: str) -> str:
    value = str(value).strip().lower()
    value = re.sub(r"[^\w\s\u0600-\u06FF]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value

def parse_bool(value: str) -> bool:
    return str(value).strip().lower() in {"true", "1", "yes"}

def to_bool_string(value: bool) -> str:
    return "True" if value else "False"

def read_csv_rows(path: Path) -> List[dict]:
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))

def write_csv_rows(path: Path, rows: List[dict], fieldnames: List[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return {}

def search_wikidata_entities(query: str) -> List[dict]:
    encoded_query = urllib.parse.quote(query)
    url = WIKIDATA_SEARCH_URL.format(query=encoded_query)
    payload = fetch_json(url)
    return payload.get("search", [])

def get_entity(qid: str) -> Optional[dict]:
    url = WIKIDATA_ENTITY_URL.format(qid=urllib.parse.quote(qid))
    payload = fetch_json(url)
    return payload.get("entities", {}).get(qid)

def ce_to_hijri(year_ce: int) -> int:
    if year_ce == 0 or year_ce > 1500: return 0
    return int((year_ce - 622) * (33 / 32))

def parse_wikidata_year(claim_list: list) -> Optional[int]:
    for claim in claim_list:
        try:
            time_val = claim["mainsnak"]["datavalue"]["value"]["time"]
            match = re.search(r"([+-]\d+)", time_val)
            if match:
                y = int(match.group(1))
                if -1000 < y < 1500: return y
        except (KeyError, TypeError, ValueError):
            continue
    return None

def pick_best_qid_for_name(name_en: str) -> Optional[str]:
    target = normalize_name(name_en)
    if not target: return None
    candidates = search_wikidata_entities(name_en)
    for cand in candidates:
        label = normalize_name(cand.get("label", ""))
        desc = normalize_name(cand.get("description", ""))
        if label != target: continue
        is_relevant = any(kw in desc for kw in ("companion", "sahabi", "caliph", "islam", "umayyad", "daughter", "wife of", "son of"))
        if is_relevant:
            qid = cand.get("id")
            if isinstance(qid, str) and qid.startswith("Q"): return qid
    return None

def qid_from_claim(claim_obj: dict) -> Optional[str]:
    try:
        datavalue = claim_obj["mainsnak"]["datavalue"]["value"]
        if datavalue.get("entity-type") == "item":
            return "Q" + str(datavalue["numeric-id"])
        return None
    except Exception: return None

def labels_for_entity(entity: dict) -> Set[str]:
    labels: Set[str] = set()
    for lang in ("en", "ar"):
        val = entity.get("labels", {}).get(lang, {}).get("value")
        if val: labels.add(val)
    aliases = entity.get("aliases", {})
    for lang in ("en", "ar"):
        for item in aliases.get(lang, []):
            if item.get("value"): labels.add(item["value"])
    return labels

def person_name_tokens(name: str) -> Set[str]:
    normalized = normalize_name(name)
    return {t for t in normalized.split() if len(t) > 1 and t not in NAME_STOPWORDS}

def is_entity_match_for_person(person_name: str, entity: dict) -> bool:
    p_tokens = person_name_tokens(person_name)
    if not p_tokens: return False
    for label in labels_for_entity(entity):
        l_tokens = person_name_tokens(label)
        if len(p_tokens & l_tokens) >= 2: return True
    return False

def sanitize_biography(text: str) -> str:
    parts = [p.strip() for p in text.split(".") if p.strip()]
    kept = [part for part in parts if not any(term in normalize_name(part) for term in BIOGRAPHY_BLACKLIST)]
    return ". ".join(kept).strip() + "." if kept else ""

def build_alias_index(rows: List[dict]) -> Dict[str, Set[int]]:
    idx = defaultdict(set)
    for r in rows:
        try: pid = int(r["id"])
        except: continue
        for col in ("name_en", "name_ar", "kunyah", "laqab"):
            raw = (r.get(col) or "").strip()
            if raw: idx[normalize_name(raw)].add(pid)
    return idx

def resolve_local_id(candidate_names: Set[str], alias_index: Dict[str, Set[int]]) -> Optional[int]:
    matched = set()
    for name in candidate_names:
        matched |= alias_index.get(normalize_name(name), set())
    return next(iter(matched)) if len(matched) == 1 else None

def add_relation(edges: Set[Tuple[int, int, str, str]], rows: List[dict], source_id: int, target_id: int, rel_type: str, category: str) -> bool:
    key = (source_id, target_id, rel_type, category)
    if key in edges: return False
    if rel_type == "SPOUSE_OF" and (target_id, source_id, rel_type, category) in edges: return False
    edges.add(key)
    rows.append({"source_id": str(source_id), "target_id": str(target_id), "type": rel_type, "category": category})
    return True

def infer_family_closure(person_by_id, edges, rel_rows):
    counts = {"inferred_parent_from_child": 0, "inferred_child_from_parent": 0, "inferred_reverse_spouse": 0}
    for rel in list(rel_rows):
        try:
            s, t = int(rel["source_id"]), int(rel["target_id"])
            rtype = rel.get("type", "")
            if rtype in {"SON_OF", "DAUGHTER_OF"}:
                if add_relation(edges, rel_rows, t, s, "PARENT_OF", "family"): counts["inferred_parent_from_child"] += 1
            if rtype == "PARENT_OF":
                child = person_by_id.get(t)
                if child:
                    c_rel = "DAUGHTER_OF" if (child.get("gender") or "").lower() == "female" else "SON_OF"
                    if add_relation(edges, rel_rows, t, s, c_rel, "family"): counts["inferred_child_from_parent"] += 1
            if rtype == "SPOUSE_OF":
                if add_relation(edges, rel_rows, t, s, "SPOUSE_OF", "family"): counts["inferred_reverse_spouse"] += 1
        except: continue
    return counts

def recompute_flags(person_rows, rel_rows):
    by_source = defaultdict(list)
    by_target = defaultdict(list)
    for rel in rel_rows:
        try:
            by_source[int(rel["source_id"])].append(rel)
            by_target[int(rel["target_id"])].append(rel)
        except: continue
    for row in person_rows:
        try:
            pid = int(row["id"])
            src, tgt = by_source[pid], by_target[pid]
            all_r = src + tgt
            row["has_parents"] = to_bool_string(any(r["type"] in {"SON_OF", "DAUGHTER_OF"} for r in src))
            row["has_children"] = to_bool_string(any(r["type"] == "PARENT_OF" for r in src))
            row["has_spouses"] = to_bool_string(any(r["type"] == "SPOUSE_OF" for r in all_r))
            row["has_siblings"] = to_bool_string(any(r["type"] == "SIBLING_OF" for r in all_r))
            row["has_uncles"] = to_bool_string(any(r["type"] == "UNCLE_OF" for r in src))
            row["has_cousins"] = to_bool_string(any(r["type"] == "COUSIN_OF" for r in all_r))
            row["has_companions"] = to_bool_string(any(r["type"] == "COMPANION_OF" for r in all_r))
            row["has_teachers"] = to_bool_string(any(r["type"] == "TEACHER_OF" for r in tgt))
            row["has_students"] = to_bool_string(any(r["type"] == "TEACHER_OF" for r in src))
            row["has_battles"] = to_bool_string(any(r["type"] == "PARTICIPATED_IN" for r in src))
            row["has_participants"] = to_bool_string(any(r["type"] == "PARTICIPATED_IN" for r in tgt))
        except: continue

def export_graph_json(person_rows, rel_rows):
    nodes = []
    for r in person_rows:
        node = dict(r)
        for col in ("id", "birth_year_hijri", "death_year_hijri"):
            try: node[col] = int(node[col])
            except: node[col] = 0
        node["is_prophet"] = to_bool_string(parse_bool(str(node.get("is_prophet", "False"))))
        for bc in ("has_parents", "has_children", "has_spouses", "has_siblings", "has_uncles", "has_cousins", "has_companions", "has_teachers", "has_students", "has_battles", "has_participants"):
            node[bc] = parse_bool(str(node.get(bc, "False")))
        nodes.append(node)
    links = []
    for rel in rel_rows:
        try: links.append({"source_id": int(rel["source_id"]), "target_id": int(rel["target_id"]), "type": rel["type"], "category": rel["category"]})
        except: continue
    links.sort(key=lambda x: (x["source_id"], x["target_id"], x["type"]))
    GRAPH_JSON.write_text(json.dumps({"nodes": nodes, "links": links}, ensure_ascii=False, indent=2), encoding="utf-8")

def main():
    person_rows = read_csv_rows(SAHABAH_CSV)
    rel_rows = read_csv_rows(REL_CSV)
    id_to_person = {int(r["id"]): r for r in person_rows}
    name_to_person = {r.get("name_en", ""): r for r in person_rows}
    alias_index = build_alias_index(person_rows)
    existing_edges = {(int(r["source_id"]), int(r["target_id"]), r["type"], r["category"]) for r in rel_rows if r.get("source_id") and r.get("target_id")}

    summary = {"years_updated": 0, "new_relations": 0}
    local_qid_to_id, subject_qid_by_id = {}, {}
    for name, qid in SEED_QIDS.items():
        if name in name_to_person:
            pid = int(name_to_person[name]["id"])
            subject_qid_by_id[pid] = qid
            local_qid_to_id[qid] = pid

    for pid, qid in subject_qid_by_id.items():
        person = id_to_person.get(pid)
        entity = get_entity(qid)
        if not entity or not is_entity_match_for_person(person["name_en"], entity): continue
        claims = entity.get("claims", {})

        # Temporal Data
        b_ce = parse_wikidata_year(claims.get("P569", []))
        d_ce = parse_wikidata_year(claims.get("P570", []))
        if b_ce:
            h = ce_to_hijri(b_ce)
            if h != 0 and (not person.get('birth_year_hijri') or person['birth_year_hijri'] == '0'):
                person['birth_year_hijri'] = str(h)
                summary['years_updated'] += 1
        if d_ce:
            h = ce_to_hijri(d_ce)
            if h != 0 and (not person.get('death_year_hijri') or person['death_year_hijri'] == '0'):
                person['death_year_hijri'] = str(h)
                summary['years_updated'] += 1

        # Family claims
        for claim in claims.get("P40", []):
            cid = local_qid_to_id.get(qid_from_claim(claim))
            if cid and add_relation(existing_edges, rel_rows, pid, cid, "PARENT_OF", "family"): summary["new_relations"] += 1
        for claim in claims.get("P26", []):
            sid = local_qid_to_id.get(qid_from_claim(claim))
            if sid and add_relation(existing_edges, rel_rows, pid, sid, "SPOUSE_OF", "family"): summary["new_relations"] += 1
        for pcode in ("P22", "P25"):
            for claim in claims.get(pcode, []):
                paid = local_qid_to_id.get(qid_from_claim(claim))
                if paid:
                    rtype = "DAUGHTER_OF" if (person.get("gender") or "").lower() == "female" else "SON_OF"
                    if add_relation(existing_edges, rel_rows, pid, paid, rtype, "family"): summary["new_relations"] += 1
                    if add_relation(existing_edges, rel_rows, paid, pid, "PARENT_OF", "family"): summary["new_relations"] += 1

    summary["inferred"] = infer_family_closure(id_to_person, existing_edges, rel_rows)
    recompute_flags(person_rows, rel_rows)
    write_csv_rows(SAHABAH_CSV, person_rows, list(person_rows[0].keys()))
    write_csv_rows(REL_CSV, rel_rows, ["source_id", "target_id", "type", "category"])
    export_graph_json(person_rows, rel_rows)
    print(json.dumps(summary, indent=2))

if __name__ == "__main__": main()
