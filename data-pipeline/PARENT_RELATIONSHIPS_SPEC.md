# Parent Relationships Specification

This document defines all required parent-child relationships in the Sahabah database. These relationships must be maintained in `relationships.csv` and verified by `validate_data.py`.

## Purpose
Ensures data integrity by:
1. Serving as the source of truth for family relationships
2. Preventing accidental loss of parent relationship data during updates
3. Enabling automated validation of parent-child links
4. Documenting historical and genealogical sources

## Required Parent Relationships

Format: `Parent ID | Parent Name → Child ID | Child Name`

### Core Sahabah Family

| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 0 | Muhammad (PBUH) | 13 | Fatima bint Muhammad | Prophet's daughter |
| 0 | Muhammad (PBUH) | 20 | Zaynab bint Muhammad | Prophet's daughter |
| 0 | Muhammad (PBUH) | 21 | Ruqayya bint Muhammad | Prophet's daughter |
| 0 | Muhammad (PBUH) | 22 | Umm Kulthum bint Muhammad | Prophet's daughter |
| 1 | Abu Bakr as-Siddiq | 12 | Aisha bint Abi Bakr | First Caliph's daughter |
| 1 | Abu Bakr as-Siddiq | 75 | Umm Kulthum bint Abi Bakr | First Caliph's daughter |
| 1024 | Umm Ruman bint Amir | 12 | Aisha bint Abi Bakr | Aisha's mother |
| 1024 | Umm Ruman bint Amir | 75 | Umm Kulthum bint Abi Bakr | Umm Kulthum's mother |
| 4 | Ali ibn Abi Talib | 14 | Hasan ibn Ali | Grandson of Prophet |
| 4 | Ali ibn Abi Talib | 15 | Husayn ibn Ali | Grandson of Prophet |
| 1023 | Abu Talib ibn Abd al-Muttalib | 4 | Ali ibn Abi Talib | Ali's father |
| 6 | Zubayr ibn al-Awwam | 117 | Abdullah ibn al-Zubayr | Zubayr's son |
| 17 | Abbas ibn Abd al-Muttalib | 173 | Fadl ibn Abbas | Abbas's son |

### Secondary Family Relationships

| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 24 | Zayd ibn Harithah | 25 | Usama ibn Zayd | Zayd's adopted son |
| 57 | Umm Ayman | 25 | Usama ibn Zayd | Usama's mother |
| 2 | Umar ibn al-Khattab | 26 | Abdullah ibn Umar | Umar's son |
| 17 | Abbas ibn Abd al-Muttalib | 27 | Abdullah ibn Abbas | Abbas's son |
| 84 | Umm al-Fadl | 27 | Abdullah ibn Abbas | Abdullah's mother |
| 87 | Hind bint Utba | 42 | Muawiyah ibn Abi Sufyan | Muawiyah's mother |
| 93 | Abu Sufyan ibn Harb | 42 | Muawiyah ibn Abi Sufyan | Muawiyah's father |
| 16 | Hamza ibn Abd al-Muttalib | 74 | Umamah bint Hamza | Hamza's daughter |
| 85 | Asma bint Umays | 118 | Muhammad ibn Abi Bakr | Asma's son |
| 23 | Ja'far ibn Abi Talib | 119 | Abdullah ibn Ja'far | Ja'far's son |
| 85 | Asma bint Umays | 119 | Abdullah ibn Ja'far | Asma's son |
| 84 | Umm al-Fadl | 173 | Fadl ibn Abbas | Fadl's mother |

**Total: 24 required PARENT_OF relationships**

## Validation Rules

1. All relationships listed above MUST exist in `relationships.csv`
2. Each relationship MUST have:
   - Valid source_id (parent exists in sahabah.csv)
   - Valid target_id (child exists in sahabah.csv)
   - type = "PARENT_OF"
   - category = "family"
3. Child nodes MUST have `has_parents = True` if they have parents listed

## Data Pipeline Steps

1. **generate_mock_data.py**: Programmatically creates all relationships in this spec
2. **validate_data.py**: Verifies all required relationships exist
3. **export_json.py**: Exports verified relationships to frontend JSON

## Process for Adding New Parents

When adding new parent relationships:

1. Add parent node to sahabah.csv (if parent doesn't exist)
2. Add entry to `sahabi_children_and_spouses.csv` with `parents` field
3. Add row to this spec document
4. Add relationship to relationships.csv: `parent_id,child_id,PARENT_OF,family`
5. Update child's `has_parents` field to True in sahabah.csv
6. Run `validate_data.py` to confirm all relationships exist
7. Run `export_json.py` to export to frontend
8. Commit with message: "docs: update parent relationships spec" and code changes

## References

- [Al-Isabah fi Tamyiz al-Sahaba](https://en.wikipedia.org/wiki/Al-Isabah) - Islamic biographical reference
- [Sirat Ibn Hisham](https://en.wikipedia.org/wiki/Ibn_Hisham) - Prophet Muhammad's biography
- [Wikipedia - Islamic History](https://en.wikipedia.org/wiki/Islam)
