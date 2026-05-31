# Parent Relationships Specification

This document defines all required parent-child relationships in the Sahabah database. These relationships must be maintained in `relationships.csv` and verified by `validate_data.py`.

## Purpose
Ensures data integrity by:
1. Serving as the source of truth for family relationships
2. Preventing accidental loss of parent relationship data during updates
3. Enabling automated validation of parent-child links
4. Documenting historical and genealogical sources

## Statistics

- **Total Parent Relationships**: 75 PARENT_OF links
- **Nodes with Parents**: 47
- **Parent Nodes**: 36 (added for major Sahabah)
- **Source**: Al-Isabah, Tabaqat al-Kubra, Ansab al-Ashraf

## Required Parent Relationships (75 total)

### Prophet Muhammad's Children (4)

| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 0 | Muhammad (PBUH) | 13 | Fatima bint Muhammad | Prophet's daughter |
| 0 | Muhammad (PBUH) | 20 | Zaynab bint Muhammad | Prophet's daughter |
| 0 | Muhammad (PBUH) | 21 | Ruqayya bint Muhammad | Prophet's daughter |
| 0 | Muhammad (PBUH) | 22 | Umm Kulthum bint Muhammad | Prophet's daughter |

### The Ten Promised Paradise - Parents (19)

| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 1025 | Uthman Abu Quhafa | 1 | Abu Bakr as-Siddiq | 1st Caliph's father |
| 1026 | Salma (Umm al-Khair) | 1 | Abu Bakr as-Siddiq | 1st Caliph's mother |
| 1027 | Al-Khattab ibn Nufayl | 2 | Umar ibn al-Khattab | 2nd Caliph's father |
| 1028 | Hantamah bint Hisham | 2 | Umar ibn al-Khattab | 2nd Caliph's mother |
| 1029 | Affan ibn Abi al-As | 3 | Uthman ibn Affan | 3rd Caliph's father |
| 1030 | Arwa bint Kurayz | 3 | Uthman ibn Affan | 3rd Caliph's mother |
| 1023 | Abu Talib ibn Abd al-Muttalib | 4 | Ali ibn Abi Talib | 4th Caliph's father |
| 1031 | Ubaydullah ibn Uthman | 5 | Talha ibn Ubaydullah | Talha's father |
| 1032 | Salma bint Wuhayb | 5 | Talha ibn Ubaydullah | Talha's mother |
| 1033 | Al-Awwam ibn Khuwaylid | 6 | Zubayr ibn al-Awwam | Zubayr's father |
| 1034 | Safiyyah bint Abd al-Muttalib | 6 | Zubayr ibn al-Awwam | Zubayr's mother (Prophet's aunt) |
| 1035 | Awf ibn Abd Harith | 7 | Abdur Rahman ibn Awf | Abdur Rahman's father |
| 1036 | Umm Kulthum al-Ansariyya | 7 | Abdur Rahman ibn Awf | Abdur Rahman's mother |
| 1037 | Abi Waqqas Malik | 8 | Sa'd ibn Abi Waqqas | Sa'd's father |
| 1038 | Hamimah bint Sufyan | 8 | Sa'd ibn Abi Waqqas | Sa'd's mother |
| 1039 | Zayd ibn Amr ibn Nufayl | 9 | Sa'id ibn Zayd | Sa'id's father |
| 1040 | Safiyyah bint Umayyah | 9 | Sa'id ibn Zayd | Sa'id's mother |
| 1041 | Abdullah ibn al-Jarrah | 10 | Abu Ubaydah ibn al-Jarrah | Abu Ubaydah's father |
| 1042 | Umayya bint Abdullah | 10 | Abu Ubaydah ibn al-Jarrah | Abu Ubaydah's mother |

### Prophet's First Wife & Her Lineage (8)

| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 1043 | Khuwaylid ibn Asad | 11 | Khadija bint Khuwaylid | Khadija's father |
| 1044 | Fatima bint Za'idah | 11 | Khadija bint Khuwaylid | Khadija's mother |
| 1 | Abu Bakr as-Siddiq | 12 | Aisha bint Abi Bakr | Prophet's wife, Caliph's daughter |
| 1024 | Umm Ruman bint Amir | 12 | Aisha bint Abi Bakr | Aisha's mother |
| 4 | Ali ibn Abi Talib | 14 | Hasan ibn Ali | Grandson of Prophet |
| 4 | Ali ibn Abi Talib | 15 | Husayn ibn Ali | Grandson of Prophet |
| 1 | Abu Bakr as-Siddiq | 75 | Umm Kulthum bint Abi Bakr | Abu Bakr's daughter |
| 1024 | Umm Ruman bint Amir | 75 | Umm Kulthum bint Abi Bakr | Umm Kulthum's mother |

### Prophet's Descendants & Abd al-Muttalib's Lineage (12)

| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 0 | Abd al-Muttalib | 16 | Hamza ibn Abd al-Muttalib | Prophet's uncle |
| 1045 | Hala bint Whayb | 16 | Hamza ibn Abd al-Muttalib | Hamza's mother |
| 0 | Abd al-Muttalib | 17 | Abbas ibn Abd al-Muttalib | Prophet's uncle |
| 1046 | Nuwaylah | 17 | Abbas ibn Abd al-Muttalib | Abbas's mother |
| 1045 | Hala bint Whayb | 16 | Hamza ibn Abd al-Muttalib | Hamza's mother |
| 16 | Hamza ibn Abd al-Muttalib | 74 | Umamah bint Hamza | Hamza's daughter |
| 17 | Abbas ibn Abd al-Muttalib | 27 | Abdullah ibn Abbas | Abbas's son |
| 84 | Umm al-Fadl | 27 | Abdullah ibn Abbas | Abdullah's mother |
| 17 | Abbas ibn Abd al-Muttalib | 173 | Fadl ibn Abbas | Abbas's son |
| 84 | Umm al-Fadl | 173 | Fadl ibn Abbas | Fadl's mother |
| 1033 | Al-Awwam ibn Khuwaylid | 6 | Zubayr ibn al-Awwam | Zubayr's father |
| 1034 | Safiyyah bint Abd al-Muttalib | 6 | Zubayr ibn al-Awwam | Zubayr's mother |

### Other Major Sahabah (15)

| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 1047 | Harithah ibn Sharahil | 24 | Zayd ibn Harithah | Zayd's father |
| 1048 | Su'da | 24 | Zayd ibn Harithah | Zayd's mother |
| 24 | Zayd ibn Harithah | 25 | Usama ibn Zayd | Zayd's adopted son |
| 57 | Umm Ayman | 25 | Usama ibn Zayd | Usama's mother |
| 2 | Umar ibn al-Khattab | 26 | Abdullah ibn Umar | Umar's son |
| 1049 | Thabit ibn Dahdah | 35 | Zayd ibn Thabit | Zayd's father |
| 1050 | Layla bint Abd al-Muttalib | 35 | Zayd ibn Thabit | Zayd's mother (Prophet's uncle's daughter) |
| 1051 | Yasir ibn Amir | 38 | Ammar ibn Yasir | Ammar's father |
| 1052 | Sumayya bint Khayyat | 38 | Ammar ibn Yasir | Ammar's mother (first woman martyr) |
| 1053 | Mu'adh ibn an-Nu'man | 45 | Sa'd ibn Mu'adh | Sa'd's father |
| 1054 | Kab'ah bint Abd Harith | 45 | Sa'd ibn Mu'adh | Sa'd's mother |
| 1055 | al-Samit ibn Qays | 47 | Ubadah ibn al-Samit | Ubadah's father |
| 1056 | Umama bint Abdullah | 47 | Ubadah ibn al-Samit | Ubadah's mother |
| 1057 | Umayya ibn Khalaf | 90 | Safwan ibn Umayya | Safwan's father |
| 1058 | Safinah bint al-Harith | 90 | Safwan ibn Umayya | Safwan's mother |

### Pre-Islamic & Early Islamic Leaders (10)

| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 1059 | Harb ibn Umayya | 93 | Abu Sufyan ibn Harb | Abu Sufyan's father |
| 1060 | Safiyyah bint Hajaj | 93 | Abu Sufyan ibn Harb | Abu Sufyan's mother |
| 93 | Abu Sufyan ibn Harb | 42 | Muawiyah ibn Abi Sufyan | Muawiyah's father |
| 87 | Hind bint Utba | 42 | Muawiyah ibn Abi Sufyan | Muawiyah's mother |
| 93 | Abu Sufyan ibn Harb | 105 | Yazid ibn Abi Sufyan | Muawiyah's brother |
| 6 | Zubayr ibn al-Awwam | 117 | Abdullah ibn al-Zubayr | Zubayr's son |
| 85 | Asma bint Umays | 118 | Muhammad ibn Abi Bakr | Asma's son |
| 1 | Abu Bakr as-Siddiq | 118 | Muhammad ibn Abi Bakr | Abu Bakr's son |
| 23 | Ja'far ibn Abi Talib | 119 | Abdullah ibn Ja'far | Ja'far's son |
| 85 | Asma bint Umays | 119 | Abdullah ibn Ja'far | Asma's son |

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
