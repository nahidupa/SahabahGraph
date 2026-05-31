# Data Pipeline Integrity System

## Overview

This system ensures that genealogical and family relationships are always maintained in the SahabahGraph database. It provides:

1. **Specification Document** - Single source of truth
2. **Automated Validation** - Catches missing or broken relationships
3. **Frontend Tests** - Verifies data displays correctly
4. **Documentation** - Clear processes for maintaining data

## How It Works

### 1. Specification (PARENT_RELATIONSHIPS_SPEC.md)

All required parent-child relationships are documented in a table:

```
| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 0 | Muhammad (PBUH) | 13 | Fatima bint Muhammad | Prophet's daughter |
```

**When to update:**
- Adding a new parent node to the database
- Establishing a new family relationship
- Discovering missing relationships

### 2. Data Pipeline Validation

Three layers of validation ensure data integrity:

#### A. CSV Files (`data-pipeline/`)

- `sahabah.csv` - Person nodes (has `has_parents` flag for each person)
- `relationships.csv` - Parent-child links (`source_id, target_id, PARENT_OF, family`)
- `sahabi_children_and_spouses.csv` - Documentation of relationships

#### B. Validation Script (`validate_data.py`)

Runs before export. Check it with:

```bash
cd data-pipeline
python3 validate_data.py
```

**Validations performed:**
1. All nodes in spec exist in sahabah.csv
2. All relationships in spec exist in relationships.csv
3. All children have `has_parents=True` if they have parents
4. No broken links (referencing non-existent IDs)
5. No duplicate relationships

**Example error output:**
```
Validation failed with the following errors:
- Missing parent relationship: 93 (parent) -> 42 (child). See PARENT_RELATIONSHIPS_SPEC.md for details.
- Flag mismatch: Muawiyah ibn Abi Sufyan (42) has parent relationships but has_parents=False. Should be True.
```

#### C. Frontend Tests (`parent-relationships.test.ts`)

Automated tests run as part of `npm test`:

```bash
cd frontend
npm test -- --run
```

**Tests verify:**
1. All required parent relationships exist in exported JSON
2. No duplicate relationships
3. Parent-child age consistency (no child born before parent)

## Adding New Parent Relationships

### Step-by-Step Process

#### 1. Add Parent Node (if needed)

If the parent doesn't exist in `sahabah.csv`:

```bash
cd data-pipeline
# Find next available ID
tail -2 sahabah.csv | head -1 | cut -d, -f1  # Get last ID

# Add new parent (append to sahabah.csv)
echo 'NEW_ID,name_ar,name_en,...' >> sahabah.csv
```

#### 2. Document in Spec

Update `data-pipeline/PARENT_RELATIONSHIPS_SPEC.md`:

```markdown
| Parent ID | Parent Name | Child ID | Child Name | Notes |
|-----------|------------|----------|-----------|-------|
| 1024 | New Parent | 42 | Child Name | Historical context |
```

#### 3. Add Relationship Entry

Add to `data-pipeline/sahabi_children_and_spouses.csv`:

```csv
child_id,child_name_en,child_name_ar,parents,wives_or_husbands
42,Child Name,child_name_ar,New Parent Name,
```

#### 4. Add Relationship Link

Add to `data-pipeline/relationships.csv`:

```csv
parent_id,child_id,PARENT_OF,family
1024,42,PARENT_OF,family
```

#### 5. Update has_parents Flag

Edit `data-pipeline/sahabah.csv` - set the child's `has_parents` field to `True`

#### 6. Validate

```bash
cd data-pipeline
python3 validate_data.py
```

Should output: `Validation successful! No inconsistencies found.`

#### 7. Export and Test

```bash
python3 export_json.py
cd ../frontend
npm test -- --run
```

All tests should pass.

#### 8. Commit

```bash
git add -A
git commit -m "feat: add parent relationship for [Child Name] to [Parent Name]

- Add [Parent Name] node (ID: XXXX)
- Create PARENT_OF link
- Update has_parents flag
- All validation passing"
```

## Workflow for Data Pipeline Changes

### Making any data modification:

1. **Edit CSV files** (sahabah.csv, relationships.csv, etc.)
2. **Run validation**: `python3 validate_data.py`
3. **Export**: `python3 export_json.py`
4. **Test frontend**: `cd ../frontend && npm test -- --run`
5. **Commit** with clear message about what changed

### Example workflow:

```bash
# 1. Navigate to pipeline
cd data-pipeline

# 2. Make changes to CSV files
# (edit sahabah.csv, relationships.csv, etc.)

# 3. Validate changes
python3 validate_data.py

# 4. Export to frontend
python3 export_json.py

# 5. Test frontend
cd ../frontend
npm test -- --run

# 6. If all pass, commit
git add -A
git commit -m "docs: update parent relationships for [reason]"
```

## Files Involved

```
SahabahGraph/
├── data-pipeline/
│   ├── PARENT_RELATIONSHIPS_SPEC.md      ← Source of truth
│   ├── validate_data.py                  ← Validation logic
│   ├── export_json.py                    ← Export to frontend
│   ├── sahabah.csv                       ← Person nodes
│   ├── relationships.csv                 ← Relationship links
│   └── sahabi_children_and_spouses.csv   ← Documentation
│
└── frontend/
    └── src/
        ├── parent-relationships.test.ts  ← Automated tests
        └── public/data/sahabah_data.json ← Exported data
```

## Troubleshooting

### Validation fails: "Missing parent relationship"

**Cause:** Relationship documented in spec but not in relationships.csv

**Fix:**
```bash
# Add missing relationship to relationships.csv
echo "parent_id,child_id,PARENT_OF,family" >> relationships.csv
```

### Validation fails: "Flag mismatch"

**Cause:** Child has parents but `has_parents=False`

**Fix:**
```bash
# Edit sahabah.csv, find the child ID, set has_parents to True
```

### Tests fail: "Missing PARENT_OF link"

**Cause:** Frontend data doesn't have relationship (or spec is wrong)

**Fix:**
1. Check spec is accurate in PARENT_RELATIONSHIPS_SPEC.md
2. Ensure relationship exists in relationships.csv
3. Re-run: `python3 export_json.py`
4. Check frontend JSON: `grep "parent_id,child_id" ../frontend/public/data/sahabah_data.json`

### Duplicate relationships detected

**Fix:**
```bash
# Remove duplicates (built into validate_data.py)
python3 << 'EOF'
import csv

seen = set()
unique_rows = []

with open('relationships.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        key = (row['source_id'], row['target_id'], row['type'])
        if key not in seen:
            seen.add(key)
            unique_rows.append(row)

with open('relationships.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=reader.fieldnames)
    writer.writeheader()
    writer.writerows(unique_rows)
EOF
```

## Performance Notes

- Validation runs in < 1 second
- Frontend tests run in ~3 seconds
- Full pipeline export in ~2 seconds
- Total test suite: ~8 seconds

## Best Practices

✅ **Do:**
- Always run validation after CSV edits
- Run frontend tests before committing
- Update SPEC document when adding relationships
- Write clear commit messages

❌ **Don't:**
- Edit relationships.csv without updating sahabi_children_and_spouses.csv
- Commit without running tests
- Edit sahabah.csv directly without also updating relationships.csv if needed
- Ignore validation warnings

## References

- [PARENT_RELATIONSHIPS_SPEC.md](./PARENT_RELATIONSHIPS_SPEC.md) - Full relationship specification
- [validate_data.py](./validate_data.py) - Validation logic
- [parent-relationships.test.ts](../frontend/src/parent-relationships.test.ts) - Frontend tests
