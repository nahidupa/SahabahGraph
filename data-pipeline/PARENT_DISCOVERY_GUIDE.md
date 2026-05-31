# Parent Discovery & Addition Guide

## Current Status

✅ **All 23 documented Sahabah parents are already in the system**
- 75 total PARENT_OF relationships
- 47 nodes with parent relationships
- 304 total nodes with genealogical data

## How to Add More Sahabah Parents

### Quick Summary

To add parents that aren't currently documented:

1. **Research** - Find parent names from historical sources
2. **Edit** - Update `sahabi_children_and_spouses.csv`
3. **Run** - Execute `add_discovered_parents.py`
4. **Validate** - Check with `validate_data.py`
5. **Test** - Run `npm test` in frontend
6. **Commit** - Save changes to git

### Detailed Workflow

#### Step 1: Research Parent Information

Check these sources for Sahabah genealogies:

**Islamic Historical Sources:**
- **Al-Isabah fi Tamyiz al-Sahaba** (Ibn Hajar al-Asqalani) - Most authoritative
- **Tabaqat al-Kubra** (Ibn Sa'd) - Earliest systematic biography
- **Ansab al-Ashraf** (al-Baladhuri) - Detailed genealogies
- **Sirat Ibn Hisham** - Prophet's biography with companion genealogies
- **Al-Isti'ab** (Ibn 'Abd al-Barr) - Alphabetical Sahabi biographies

**Modern Resources:**
- **Wikidata** - API queries for parent relationships (property P25)
- **Wikipedia** - Islamic history articles
- **Online Islamic genealogy databases**

**Example: Looking up a Sahabi's parents**

Let's say we want to find parents for a Sahabi with ID 100 ("Example Sahabi"):

1. Check Al-Isabah for entry on "Example Sahabi"
2. Look for "Born to [Parent Name]"
3. Note both father and mother names
4. Record in format: "Father Name | Mother Name"

#### Step 2: Update sahabi_children_and_spouses.csv

Open `data-pipeline/sahabi_children_and_spouses.csv` and locate the child record:

**Current (Before):**
```csv
child_id,child_name_en,child_name_ar,parents,wives_or_husbands
100,Example Sahabi,example,Unknown,
```

**Updated (After):**
```csv
child_id,child_name_en,child_name_ar,parents,wives_or_husbands
100,Example Sahabi,example,Father Name | Mother Name,
```

**Important Notes:**
- Separate multiple parents with ` | ` (space-pipe-space)
- Use exact names as they appear in the database
- If mother name is unknown, use only father: `Father Name | `
- If unsure, leave as "Unknown"

#### Step 3: Run Parent Discovery Script

The `add_discovered_parents.py` script automatically:
- ✓ Checks if parent nodes exist
- ✓ Creates new parent nodes for unknown parents
- ✓ Creates PARENT_OF relationships
- ✓ Updates has_parents flags
- ✓ Reports on all changes

```bash
cd data-pipeline
python3 add_discovered_parents.py
```

**Output Example:**
```
============================================================
DISCOVERING AND ADDING NEW PARENT RELATIONSHIPS
============================================================

Loaded 304 nodes
Loaded 75 existing parent relationships
Loaded 23 sahabah with documented parents

Checking for missing relationships...

  ✓ Create: Harith ibn Amr (ID: 1061)
  ✓ Link: Harith ibn Amr (1061) → Example Sahabi (100)

============================================================
SUMMARY
============================================================
Existing parent nodes linked: 0
New parent nodes to create: 1
New relationships to create: 1

✅ Database updated successfully!
```

#### Step 4: Validate Consistency

```bash
python3 validate_data.py
```

Should output: `Validation successful! No inconsistencies found.`

#### Step 5: Export & Test Frontend

```bash
# Export to JSON
python3 export_json.py

# Run tests
cd ../frontend
npm test -- --run

# Build (optional but recommended)
npm run build
```

All tests should pass ✅

#### Step 6: Commit Changes

```bash
git add -A
git commit -m "feat: add parent relationships for [sahabah names]

- Updated sahabi_children_and_spouses.csv with new parent names
- Created [N] new parent nodes
- Added [N] PARENT_OF relationships
- All validation passing
- All tests passing (8/8)

Sources: [List sources used]"
```

---

## File Reference

### Files Involved

| File | Purpose | Edit By |
|------|---------|---------|
| `sahabi_children_and_spouses.csv` | Document discovered parents | Manual research |
| `add_discovered_parents.py` | Auto-process discovered parents | System (auto-runs) |
| `sahabah.csv` | Person nodes | System (auto-updated) |
| `relationships.csv` | Parent-child links | System (auto-updated) |
| `validate_data.py` | Verify consistency | System (validation) |
| `export_json.py` | Export to frontend | System (export) |

### Parent Node Fields

When new parent nodes are created, they have:
- **Type:** PoliticalFigure
- **Prominence:** 1 (default for secondary figures)
- **Birth/Death Years:** 0 (unknown)
- **Gender:** Auto-detected from name (heuristic)
- **Biography:** "Pre-Islamic parent"

### Special Cases

#### 1. When Parent Name Doesn't Match Existing Nodes

**Problem:** Updated `sahabi_children_and_spouses.csv` but parent still not linked

**Solution:** 
- Check for typos/spelling variations
- The system does fuzzy matching (substring match)
- Example: "Ibn Amr" will match "Full Name ibn Amr ibn Someone"

#### 2. When Same Person Has Multiple Names

**Problem:** Parent known by different names in different sources

**Solution:**
- Use the name most commonly found in the node database
- The script will link to existing node if it finds a match
- Can manually add alternative names if needed

#### 3. When Parent is Also a Sahabi

**Best Practice:**
- Use their main Sahabi node, not create a duplicate
- The system checks for existing nodes first
- Only creates new nodes if parent not found

---

## Example: Adding Parents for 5 New Sahabah

### Step 1: Research Phase

Research these Sahabah from Al-Isabah:
- Sahabah ID 41: Parent info...
- Sahabah ID 48: Parent info...
- Sahabah ID 66: Parent info...
- Sahabah ID 79: Parent info...
- Sahabah ID 108: Parent info...

### Step 2: Update sahabi_children_and_spouses.csv

```csv
41,Sahabah Name One,name,Father Name One | Mother Name One,
48,Sahabah Name Two,name,Father Name Two,
66,Sahabah Name Three,name,Mother Name Three,
79,Sahabah Name Four,name,Father Name Four | Mother Name Four,
108,Sahabah Name Five,name,Father Name Five,
```

### Step 3: Execute

```bash
python3 add_discovered_parents.py
python3 validate_data.py
python3 export_json.py
cd ../frontend && npm test -- --run
```

### Step 4: Commit

```bash
git add -A
git commit -m "feat: add parent relationships for 5 sahabah

Discovered and added:
- Sahabah Name One: Father Name One, Mother Name One
- Sahabah Name Two: Father Name Two
- Sahabah Name Three: Mother Name Three
- Sahabah Name Four: Father Name Four, Mother Name Four
- Sahabah Name Five: Father Name Five

Created 7 new parent nodes
Added 8 PARENT_OF relationships

All tests passing (8/8)
Sources: Al-Isabah, Tabaqat al-Kubra"
```

---

## Historical Data Sources

### Primary Islamic Sources (in order of reliability)

1. **Al-Isabah fi Tamyiz al-Sahaba** (إصابة في تمييز الصحابة)
   - Author: Ibn Hajar al-Asqalani (d. 852 AH)
   - 6+ volumes, alphabetical, most comprehensive
   - Available online and in print
   - Most widely used reference

2. **Tabaqat al-Kubra** (طبقات الكبرى)
   - Author: Ibn Sa'd (d. 230 AH)
   - Earliest systematic biographical compilation
   - Organized by generation
   - Al-Isabah often references this

3. **Ansab al-Ashraf** (أنساب الأشراف)
   - Author: al-Baladhuri (d. 279 AH)
   - Focuses on genealogies of noble families
   - Good for Quraysh lineages

4. **Sirat Ibn Hisham** (سيرة ابن هشام)
   - Prophet Muhammad's biography
   - Includes companion genealogies mentioned
   - Good for early Sahabah

5. **Al-Isti'ab fi Ma'rifat al-Ashab** (الاستيعاب في معرفة الأصحاب)
   - Author: Ibn 'Abd al-Barr (d. 463 AH)
   - Alphabetical Sahabi entries
   - Often more detailed than Al-Isabah for some entries

### Modern Digital Resources

- **Wikidata.org** - Query structured data on historical figures
- **Wikipedia** - Category: Sahaba (Companions of Muhammad)
- **Islamic genealogy databases** (various online projects)
- **ISBD Islamic Studies Bibliography Database**

---

## FAQ

**Q: What if I can't find a parent's information?**
A: Leave it as "Unknown" in the CSV. Only update when you have reliable source confirmation.

**Q: Can I add grandparents or other ancestors?**
A: Currently the system supports only PARENT_OF relationships. You could extend it to add GRANDPARENT_OF if needed.

**Q: What if two sources disagree on a parent name?**
A: Include the most authoritative source (typically Al-Isabah). Document the discrepancy in commit message or comments.

**Q: How do I update an incorrect parent relationship?**
A: 1) Update sahabi_children_and_spouses.csv with correct parent name
2) Run `add_discovered_parents.py`
3) Manually remove old relationship from relationships.csv (if needed)
4) Run `validate_data.py` to confirm

**Q: Can I see what parents are currently missing?**
A: Check which Sahabah have empty "parents" field in sahabi_children_and_spouses.csv. Those are the candidates for research.

---

## Resources Files

- [PARENT_RELATIONSHIPS_SPEC.md](./PARENT_RELATIONSHIPS_SPEC.md) - Current parent spec
- [DATA_PIPELINE_INTEGRITY.md](../DATA_PIPELINE_INTEGRITY.md) - General pipeline guide
- [add_discovered_parents.py](./add_discovered_parents.py) - This automation script
- [validate_data.py](./validate_data.py) - Validation script
- [FACT_CHECK_COMPREHENSIVE.md](./FACT_CHECK_COMPREHENSIVE.md) - Source verification data
