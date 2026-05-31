# SahabahGraph Data Enrichment Specification (v1)

## Goal
Increase family-data completeness in the existing schema without breaking current frontend/backend consumers.

This spec is designed for the current files:
- `data-pipeline/sahabah.csv`
- `data-pipeline/relationships.csv`
- `frontend/public/data/sahabah_data.json`

## Current Schema Contract

### Person table (`sahabah.csv`)
Required identity columns already in use:
- `id`
- `name_en`
- `name_ar`
- `kunyah`
- `laqab`
- `gender`
- `node_type`

Family completeness flags already available:
- `has_parents`
- `has_children`
- `has_spouses`
- `has_siblings`

### Relationship table (`relationships.csv`)
Columns:
- `source_id`
- `target_id`
- `type`
- `category`

Family relation types currently accepted by graph + validators:
- `PARENT_OF`
- `SON_OF`
- `DAUGHTER_OF`
- `SPOUSE_OF`
- `SIBLING_OF`
- `UNCLE_OF`
- `COUSIN_OF`

## Enrichment Policy

### Source policy
- Primary structured source: Wikidata (CC0).
- Enrichment scope in v1: family only.
- Only import a relation when both endpoints can be mapped to existing local IDs.

### Confidence policy
- `high`: subject is mapped with a curated `name_en -> QID` seed and relative maps uniquely to one local person by normalized labels/aliases.
- `skip`: no unique local mapping for relative.

### Name matching policy
Normalize all candidate names before matching:
- lowercase
- remove punctuation
- collapse whitespace
- keep Arabic and Latin characters

Alias pool for each person:
- `name_en`
- `name_ar`
- `kunyah`
- `laqab`

A relative is considered mapped only if normalization resolves to exactly one local person ID.

### Import rules
From Wikidata claims:
- `P40` (child): add `PARENT_OF` (`subject -> child`)
- `P26` (spouse): add `SPOUSE_OF` (`subject -> spouse`)
- `P22` (father), `P25` (mother): add child-to-parent edge using gender-aware type:
  - `SON_OF` if child is male
  - `DAUGHTER_OF` if child is female
  - plus reverse `PARENT_OF` (`parent -> child`) for traversal completeness

### Deduplication
- Exact relation dedupe key: `(source_id, target_id, type, category)`.
- Spouse pair dedupe should treat reversed duplicates as equivalent.

## Pipeline Steps
1. Read `sahabah.csv` and `relationships.csv`.
2. Build alias index from local person records.
3. Resolve each seeded person to Wikidata QID.
4. Pull entity JSON from `Special:EntityData/{QID}.json`.
5. Extract family claims (`P22`, `P25`, `P26`, `P40`).
6. Map relatives to local IDs using alias index.
7. Merge new edges into `relationships.csv`.
8. Recompute `has_*` family flags for all rows in `sahabah.csv`.
9. Regenerate `frontend/public/data/sahabah_data.json` from CSVs.
10. Emit enrichment report (`data-pipeline/enrichment_report.json`).

## Non-goals (v1)
- Auto-creating new people not already in local dataset.
- Importing uncertain matches.
- Overwriting biography text/tribe/clan fields.

## QA Checks
- Run `python3 data-pipeline/validate_data.py` after enrichment.
- Validate no broken edges.
- Validate no gender mismatch for `SON_OF` / `DAUGHTER_OF`.

## Operational Notes
- Keep an explicit curated `name_en -> QID` seed list in code for deterministic runs.
- Run enrichment periodically (for example, weekly/monthly) and review the generated report.
- If Wikidata data quality is contested, keep local data unchanged and add that case to manual review backlog.
