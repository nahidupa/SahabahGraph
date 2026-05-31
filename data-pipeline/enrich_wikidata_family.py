#!/usr/bin/env python3
"""Enrich family relationships from Wikidata into local CSV/JSON graph data.

This script only adds high-confidence relations where both endpoints already
exist in the local dataset.
"""

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
USER_AGENT = "SahabahGraphEnrichment/1.0 (research enrichment pipeline)"

# Curated seed set. This keeps runs deterministic and prevents low-confidence matching.
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
}

NAME_STOPWORDS = {"ibn", "bint", "bin", "abu", "umm", "al"}
BIOGRAPHY_BLACKLIST = {
    "ice hockey",
    "football club",
    "american editor",
    "american",
    "village",
    "municipality",
    "album",
    "film",
    "company",
    "organization",
}


def normalize_name(value: str) -> str:
    value = value.strip().lower()
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
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def search_wikidata_entities(query: str) -> List[dict]:
    encoded_query = urllib.parse.quote(query)
    url = WIKIDATA_SEARCH_URL.format(query=encoded_query)
    try:
        payload = fetch_json(url)
        return payload.get("search", [])
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return []


def get_entity(qid: str) -> Optional[dict]:
    url = WIKIDATA_ENTITY_URL.format(qid=urllib.parse.quote(qid))
    try:
        payload = fetch_json(url)
        return payload.get("entities", {}).get(qid)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None


def pick_best_qid_for_name(name_en: str) -> Optional[str]:
    target = normalize_name(name_en)
    if not target:
        return None

    candidates = search_wikidata_entities(name_en)
    if not candidates:
        return None

    for cand in candidates:
        label = normalize_name(cand.get("label", ""))
        desc = normalize_name(cand.get("description", ""))
        if label != target:
            continue

        is_relevant = any(
            kw in desc
            for kw in (
                "companion",
                "sahabi",
                "caliph",
                "islam",
                "umayyad",
                "daughter",
                "wife of",
                "son of",
            )
        )
        if is_relevant:
            qid = cand.get("id")
            if isinstance(qid, str) and qid.startswith("Q"):
                return qid

    return None


def qid_from_claim(claim_obj: dict) -> Optional[str]:
    try:
        datavalue = claim_obj["mainsnak"]["datavalue"]["value"]
        if datavalue.get("entity-type") == "item":
            return "Q" + str(datavalue["numeric-id"])
        return None
    except (KeyError, TypeError):
        return None


def labels_for_entity(entity: dict) -> Set[str]:
    labels: Set[str] = set()
    for lang in ("en", "ar"):
        val = entity.get("labels", {}).get(lang, {}).get("value")
        if val:
            labels.add(val)
    aliases = entity.get("aliases", {})
    for lang in ("en", "ar"):
        for item in aliases.get(lang, []):
            if item.get("value"):
                labels.add(item["value"])
    return labels


def person_name_tokens(name: str) -> Set[str]:
    normalized = normalize_name(name)
    tokens = {t for t in normalized.split() if len(t) > 1 and t not in NAME_STOPWORDS}
    return tokens


def is_entity_match_for_person(person_name: str, entity: dict) -> bool:
    p_tokens = person_name_tokens(person_name)
    if not p_tokens:
        return False

    for label in labels_for_entity(entity):
        l_tokens = person_name_tokens(label)
        if len(p_tokens & l_tokens) >= 2:
            return True
    return False


def is_person_like_description(description: str) -> bool:
    lowered = normalize_name(description)
    if not lowered:
        return False
    return not any(term in lowered for term in BIOGRAPHY_BLACKLIST)


def sanitize_biography(text: str) -> str:
    parts = [p.strip() for p in text.split(".") if p.strip()]
    kept: List[str] = []
    for part in parts:
        lowered = normalize_name(part)
        if any(term in lowered for term in BIOGRAPHY_BLACKLIST):
            continue
        kept.append(part)
    if not kept:
        return ""
    return ". ".join(kept).strip() + "."


def build_alias_index(rows: List[dict]) -> Dict[str, Set[int]]:
    idx: Dict[str, Set[int]] = defaultdict(set)
    for r in rows:
        try:
            pid = int(r["id"])
        except (TypeError, ValueError):
            continue
        for col in ("name_en", "name_ar", "kunyah", "laqab"):
            raw = (r.get(col) or "").strip()
            if not raw:
                continue
            idx[normalize_name(raw)].add(pid)
    return idx


def resolve_local_id(candidate_names: Set[str], alias_index: Dict[str, Set[int]]) -> Optional[int]:
    matched: Set[int] = set()
    for name in candidate_names:
        normalized = normalize_name(name)
        if not normalized:
            continue
        matched |= alias_index.get(normalized, set())
    if len(matched) == 1:
        return next(iter(matched))
    return None


def relation_exists(edges: Set[Tuple[int, int, str, str]], source_id: int, target_id: int, rel_type: str, category: str) -> bool:
    return (source_id, target_id, rel_type, category) in edges


def add_relation(
    edges: Set[Tuple[int, int, str, str]],
    rows: List[dict],
    source_id: int,
    target_id: int,
    rel_type: str,
    category: str,
) -> bool:
    key = (source_id, target_id, rel_type, category)
    if key in edges:
        return False

    # Spouse dedupe for inverse direction.
    if rel_type == "SPOUSE_OF":
        reverse = (target_id, source_id, rel_type, category)
        if reverse in edges:
            return False

    edges.add(key)
    rows.append({
        "source_id": str(source_id),
        "target_id": str(target_id),
        "type": rel_type,
        "category": category,
    })
    return True


def infer_family_closure(
    person_by_id: Dict[int, dict],
    edges: Set[Tuple[int, int, str, str]],
    rel_rows: List[dict],
) -> Dict[str, int]:
    counts = {
        "inferred_parent_from_child": 0,
        "inferred_child_from_parent": 0,
        "inferred_reverse_spouse": 0,
    }

    # Work on a snapshot so newly appended rows do not cause repeated inference in the same pass.
    snapshot = list(rel_rows)

    for rel in snapshot:
        try:
            source_id = int(rel["source_id"])
            target_id = int(rel["target_id"])
        except (TypeError, ValueError):
            continue

        rel_type = rel.get("type", "")

        if rel_type in {"SON_OF", "DAUGHTER_OF"}:
            if add_relation(edges, rel_rows, target_id, source_id, "PARENT_OF", "family"):
                counts["inferred_parent_from_child"] += 1

        if rel_type == "PARENT_OF":
            child = person_by_id.get(target_id)
            if not child:
                continue
            child_gender = (child.get("gender") or "").strip().lower()
            child_rel = "DAUGHTER_OF" if child_gender == "female" else "SON_OF"
            if add_relation(edges, rel_rows, target_id, source_id, child_rel, "family"):
                counts["inferred_child_from_parent"] += 1

        if rel_type == "SPOUSE_OF":
            if add_relation(edges, rel_rows, target_id, source_id, "SPOUSE_OF", "family"):
                counts["inferred_reverse_spouse"] += 1

    return counts


def relation_stats_for_person(pid: int, rel_rows: List[dict]) -> Dict[str, int]:
    children = 0
    parents = 0
    battles = 0
    spouses: Set[int] = set()

    for rel in rel_rows:
        try:
            source_id = int(rel["source_id"])
            target_id = int(rel["target_id"])
        except (TypeError, ValueError):
            continue

        rel_type = rel.get("type", "")
        if rel_type == "PARENT_OF" and source_id == pid:
            children += 1
        if rel_type in {"SON_OF", "DAUGHTER_OF"} and source_id == pid:
            parents += 1
        if rel_type == "PARTICIPATED_IN" and source_id == pid:
            battles += 1
        if rel_type == "SPOUSE_OF":
            if source_id == pid:
                spouses.add(target_id)
            elif target_id == pid:
                spouses.add(source_id)

    return {
        "children": children,
        "parents": parents,
        "spouses": len(spouses),
        "battles": battles,
    }


def append_sentence(base: str, sentence: str) -> str:
    base = base.strip()
    sentence = sentence.strip()
    if not sentence:
        return base
    if not base:
        return sentence
    if not base.endswith("."):
        base += "."
    return f"{base} {sentence}".strip()


def enhance_biography(person: dict, entity: dict, rel_rows: List[dict]) -> bool:
    current = sanitize_biography((person.get("biography_short") or "").strip())
    stats = relation_stats_for_person(int(person["id"]), rel_rows)

    enriched = current

    stat_parts: List[str] = []
    if stats["children"] > 0:
        label = "child" if stats["children"] == 1 else "children"
        stat_parts.append(f"{stats['children']} documented {label}")
    if stats["spouses"] > 0:
        label = "spouse" if stats["spouses"] == 1 else "spouses"
        stat_parts.append(f"{stats['spouses']} documented {label}")
    if stats["parents"] > 0:
        label = "parent" if stats["parents"] == 1 else "parents"
        stat_parts.append(f"{stats['parents']} linked {label}")
    if stats["battles"] > 0:
        label = "battle" if stats["battles"] == 1 else "battles"
        stat_parts.append(f"{stats['battles']} linked {label}")

    if stat_parts:
        enriched = append_sentence(enriched, "Graph profile: " + ", ".join(stat_parts) + ".")

    if len(enriched) > 320:
        enriched = enriched[:317].rstrip() + "..."

    if enriched != current:
        person["biography_short"] = enriched
        source = (person.get("biography_source") or "").strip()
        if "Wikidata" not in source:
            person["biography_source"] = f"{source}; Wikidata structured data".strip("; ")
        return True

    return False


def enrich_biography_from_graph_only(person: dict, rel_rows: List[dict]) -> bool:
    current = sanitize_biography((person.get("biography_short") or "").strip())
    stats = relation_stats_for_person(int(person["id"]), rel_rows)

    stat_parts: List[str] = []
    if stats["children"] > 0:
        label = "child" if stats["children"] == 1 else "children"
        stat_parts.append(f"{stats['children']} documented {label}")
    if stats["spouses"] > 0:
        label = "spouse" if stats["spouses"] == 1 else "spouses"
        stat_parts.append(f"{stats['spouses']} documented {label}")
    if stats["parents"] > 0:
        label = "parent" if stats["parents"] == 1 else "parents"
        stat_parts.append(f"{stats['parents']} linked {label}")
    if stats["battles"] > 0:
        label = "battle" if stats["battles"] == 1 else "battles"
        stat_parts.append(f"{stats['battles']} linked {label}")

    if not stat_parts:
        return False

    if "graph profile" in normalize_name(current):
        return False

    enriched = append_sentence(current, "Graph profile: " + ", ".join(stat_parts) + ".")
    if len(enriched) > 320:
        enriched = enriched[:317].rstrip() + "..."

    if enriched != current:
        person["biography_short"] = enriched
        return True

    return False


def recompute_flags(person_rows: List[dict], rel_rows: List[dict]) -> None:
    by_source: Dict[int, List[dict]] = defaultdict(list)
    by_target: Dict[int, List[dict]] = defaultdict(list)

    for rel in rel_rows:
        try:
            s = int(rel["source_id"])
            t = int(rel["target_id"])
        except (TypeError, ValueError):
            continue
        by_source[s].append(rel)
        by_target[t].append(rel)

    for row in person_rows:
        try:
            pid = int(row["id"])
        except (TypeError, ValueError):
            continue

        src = by_source.get(pid, [])
        tgt = by_target.get(pid, [])
        all_rels = src + tgt

        row["has_parents"] = to_bool_string(any(r["type"] in {"SON_OF", "DAUGHTER_OF"} for r in src))
        row["has_children"] = to_bool_string(any(r["type"] == "PARENT_OF" for r in src))
        row["has_spouses"] = to_bool_string(any(r["type"] == "SPOUSE_OF" for r in all_rels))
        row["has_siblings"] = to_bool_string(any(r["type"] == "SIBLING_OF" for r in all_rels))
        row["has_uncles"] = to_bool_string(any(r["type"] == "UNCLE_OF" for r in src))
        row["has_cousins"] = to_bool_string(any(r["type"] == "COUSIN_OF" for r in all_rels))
        row["has_companions"] = to_bool_string(any(r["type"] == "COMPANION_OF" for r in all_rels))
        row["has_teachers"] = to_bool_string(any(r["type"] == "TEACHER_OF" for r in tgt))
        row["has_students"] = to_bool_string(any(r["type"] == "TEACHER_OF" for r in src))
        row["has_battles"] = to_bool_string(any(r["type"] == "PARTICIPATED_IN" for r in src))
        row["has_participants"] = to_bool_string(any(r["type"] == "PARTICIPATED_IN" for r in tgt))


def export_graph_json(person_rows: List[dict], rel_rows: List[dict]) -> None:
    nodes = []
    for row in person_rows:
        node = dict(row)

        for int_col in ("id", "birth_year_hijri", "death_year_hijri"):
            try:
                node[int_col] = int(node[int_col])
            except (TypeError, ValueError):
                node[int_col] = 0

        # Keep historical shape: is_prophet as "True"/"False" string, has_* as booleans.
        node["is_prophet"] = to_bool_string(parse_bool(str(node.get("is_prophet", "False"))))

        for bool_col in (
            "has_parents",
            "has_children",
            "has_spouses",
            "has_siblings",
            "has_uncles",
            "has_cousins",
            "has_companions",
            "has_teachers",
            "has_students",
            "has_battles",
            "has_participants",
        ):
            node[bool_col] = parse_bool(str(node.get(bool_col, "False")))

        nodes.append(node)

    links = []
    for rel in rel_rows:
        try:
            source_id = int(rel["source_id"])
            target_id = int(rel["target_id"])
        except (TypeError, ValueError):
            continue
        links.append({
            "source_id": source_id,
            "target_id": target_id,
            "type": rel["type"],
            "category": rel["category"],
        })

    links.sort(key=lambda x: (x["source_id"], x["target_id"], x["type"]))
    payload = {"nodes": nodes, "links": links}
    GRAPH_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    person_rows = read_csv_rows(SAHABAH_CSV)
    rel_rows = read_csv_rows(REL_CSV)

    id_to_person = {}
    name_to_person = {}
    for row in person_rows:
        try:
            pid = int(row["id"])
        except (TypeError, ValueError):
            continue
        id_to_person[pid] = row
        name_to_person[row.get("name_en", "")] = row

    alias_index = build_alias_index(person_rows)

    existing_edges: Set[Tuple[int, int, str, str]] = set()
    for r in rel_rows:
        try:
            existing_edges.add((int(r["source_id"]), int(r["target_id"]), r["type"], r["category"]))
        except (TypeError, ValueError):
            continue

    summary = {
        "seed_subjects": 0,
        "subjects_found": 0,
        "subjects_with_entity": 0,
        "auto_qid_mapped_subjects": 0,
        "new_relations": 0,
        "new_by_type": defaultdict(int),
        "inferred": {},
        "biographies_updated": 0,
        "mappings_rejected": 0,
        "skipped_unmapped_relatives": 0,
        "skipped_subject_not_in_csv": 0,
        "seed_not_found_in_csv": [],
    }

    local_qid_to_id: Dict[str, int] = {}
    subject_qid_by_id: Dict[int, str] = {}

    # First pass: seed mappings.
    for person_name, qid in SEED_QIDS.items():
        summary["seed_subjects"] += 1
        person = name_to_person.get(person_name)
        if not person:
            summary["skipped_subject_not_in_csv"] += 1
            summary["seed_not_found_in_csv"].append(person_name)
            continue

        summary["subjects_found"] += 1
        subject_id = int(person["id"])
        subject_qid_by_id[subject_id] = qid
        local_qid_to_id[qid] = subject_id

    # Second pass: strict auto-mapping for remaining people.
    for row in person_rows:
        try:
            pid = int(row["id"])
        except (TypeError, ValueError):
            continue
        if pid in subject_qid_by_id:
            continue

        candidate_name = (row.get("name_en") or "").strip()
        if not candidate_name:
            continue

        qid = pick_best_qid_for_name(candidate_name)
        if not qid:
            continue

        if qid in local_qid_to_id and local_qid_to_id[qid] != pid:
            continue

        subject_qid_by_id[pid] = qid
        local_qid_to_id[qid] = pid
        summary["auto_qid_mapped_subjects"] += 1

    for subject_id, qid in subject_qid_by_id.items():
        person = id_to_person.get(subject_id)
        if person is None:
            continue

        subject_gender = (person.get("gender") or "").strip().lower()

        entity = get_entity(qid)
        if not entity:
            continue

        if not is_entity_match_for_person(person.get("name_en", ""), entity):
            summary["mappings_rejected"] += 1
            continue

        summary["subjects_with_entity"] += 1
        claims = entity.get("claims", {})

        # Child claims: subject -> child (PARENT_OF)
        for claim in claims.get("P40", []):
            child_qid = qid_from_claim(claim)
            if not child_qid:
                continue
            child_id = local_qid_to_id.get(child_qid)
            if child_id is None:
                child_entity = get_entity(child_qid)
                if not child_entity:
                    continue
                child_id = resolve_local_id(labels_for_entity(child_entity), alias_index)
            if child_id is None:
                summary["skipped_unmapped_relatives"] += 1
                continue

            if add_relation(existing_edges, rel_rows, subject_id, child_id, "PARENT_OF", "family"):
                summary["new_relations"] += 1
                summary["new_by_type"]["PARENT_OF"] += 1

        # Spouse claims: subject -> spouse (SPOUSE_OF)
        for claim in claims.get("P26", []):
            spouse_qid = qid_from_claim(claim)
            if not spouse_qid:
                continue
            spouse_id = local_qid_to_id.get(spouse_qid)
            if spouse_id is None:
                spouse_entity = get_entity(spouse_qid)
                if not spouse_entity:
                    continue
                spouse_id = resolve_local_id(labels_for_entity(spouse_entity), alias_index)
            if spouse_id is None:
                summary["skipped_unmapped_relatives"] += 1
                continue

            if add_relation(existing_edges, rel_rows, subject_id, spouse_id, "SPOUSE_OF", "family"):
                summary["new_relations"] += 1
                summary["new_by_type"]["SPOUSE_OF"] += 1

        # Parent claims: subject -> parent (SON_OF/DAUGHTER_OF) + reverse PARENT_OF
        for pcode in ("P22", "P25"):
            for claim in claims.get(pcode, []):
                parent_qid = qid_from_claim(claim)
                if not parent_qid:
                    continue
                parent_id = local_qid_to_id.get(parent_qid)
                if parent_id is None:
                    parent_entity = get_entity(parent_qid)
                    if not parent_entity:
                        continue
                    parent_id = resolve_local_id(labels_for_entity(parent_entity), alias_index)
                if parent_id is None:
                    summary["skipped_unmapped_relatives"] += 1
                    continue

                rel_type = "DAUGHTER_OF" if subject_gender == "female" else "SON_OF"
                if add_relation(existing_edges, rel_rows, subject_id, parent_id, rel_type, "family"):
                    summary["new_relations"] += 1
                    summary["new_by_type"][rel_type] += 1

                if add_relation(existing_edges, rel_rows, parent_id, subject_id, "PARENT_OF", "family"):
                    summary["new_relations"] += 1
                    summary["new_by_type"]["PARENT_OF"] += 1

    # Normalize relationship ordering for stable diffs.
    inferred_counts = infer_family_closure(id_to_person, existing_edges, rel_rows)
    summary["inferred"] = inferred_counts
    summary["new_relations"] += sum(inferred_counts.values())

    for subject_id, qid in subject_qid_by_id.items():
        person = id_to_person.get(subject_id)
        if person is None:
            continue
        entity = get_entity(qid)
        if not entity:
            continue
        if not is_entity_match_for_person(person.get("name_en", ""), entity):
            continue
        if enhance_biography(person, entity, rel_rows):
            summary["biographies_updated"] += 1

    for row in person_rows:
        if enrich_biography_from_graph_only(row, rel_rows):
            summary["biographies_updated"] += 1

    # Final pass to clean any existing non-person biography artifacts.
    for row in person_rows:
        raw = (row.get("biography_short") or "").strip()
        cleaned = sanitize_biography(raw)
        if cleaned and cleaned != raw:
            row["biography_short"] = cleaned

    rel_rows.sort(key=lambda r: (int(r["source_id"]), int(r["target_id"]), r["type"], r["category"]))

    recompute_flags(person_rows, rel_rows)

    person_fields = list(person_rows[0].keys()) if person_rows else []
    rel_fields = ["source_id", "target_id", "type", "category"]

    write_csv_rows(SAHABAH_CSV, person_rows, person_fields)
    write_csv_rows(REL_CSV, rel_rows, rel_fields)
    export_graph_json(person_rows, rel_rows)

    summary["new_by_type"] = dict(summary["new_by_type"])
    REPORT_JSON.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
