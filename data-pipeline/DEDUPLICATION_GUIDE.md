# Deduplication Workflow Guide

## Step 1: Run Analysis
First, analyze the data to find duplicates with confidence scores:

```bash
cd data-pipeline
python3 safe_deduplication_analysis.py
```

This creates:
- `deduplication_analysis.txt` - Human-readable report
- `deduplication_analysis.json` - Machine-readable data

## Step 2: Interactive Review
Run the interactive tool to review and decide on each duplicate:

```bash
python3 interactive_deduplication.py
```

### What it does:
1. **Shows you each duplicate pair side-by-side**
   - All fields compared
   - Confidence score
   - Evidence supporting the match
   - Conflicts/differences

2. **You decide for each pair:**
   - `M` - Merge (they're the same person)
   - `S` - Skip (different people)  
   - `I` - Show more detailed info
   - `Q` - Quit and save progress

3. **Confidence levels:**
   - ≥80%: High confidence - very likely duplicates
   - 50-79%: Medium confidence - review carefully
   - 20-49%: Low confidence - probably different people

4. **Safe merging:**
   - Keeps the more complete entry
   - Preserves all unique information
   - Uses lower ID number
   - Creates backup before applying changes

## Step 3: Review Results
After the interactive session:

```bash
# Check the output
head sahabah_reviewed.csv

# Check the decisions log
cat merge_decisions_*.json

# If everything looks good, apply:
mv sahabah_reviewed.csv sahabah.csv
```

## Step 4: Update Relationships
After merging sahabah entries, update relationships:

```bash
python3 update_relationships.py
mv relationships_updated.csv relationships.csv
```

## Step 5: Verify
Check for remaining issues:

```bash
python3 find_duplicate_parents.py
```

## Example Session

```
$ python3 interactive_deduplication.py

Select confidence threshold:
  1. High confidence only (≥80%) - safest, fewer reviews
  2. Medium & high confidence (≥50%) - recommended
  3. All candidates (≥20%) - most thorough

Your choice: 2

Creating backup: sahabah.csv.backup_20260602_134500
Loaded 656 entries
Showing 30 candidates with confidence ≥ 50%

Press Enter to begin review...

================================================================================
DUPLICATE CANDIDATE - Confidence: 100.0%
================================================================================

Field                Entry 1                                Entry 2
----------------------------------------------------------------------------------------------------
⚠️ ID                 2                                      1278
   English Name       Umar ibn al-Khattab                    Umar ibn Al-Khattāb
   Arabic Name        عمر بن الخطاب                          عمر بن الخطاب
   Birth Year         -37                                    -37
   Death Year         22                                     22
   Gender             M                                      M

✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓
SUPPORTING EVIDENCE:
  ✓ Identical Arabic names: عمر بن الخطاب
  ✓ Matching English names (normalized)
  ✓ Same birth year: -37
  ✓ Same death year: 22
  ✓ Same gender: M

What would you like to do?
  [M] Merge these entries
  [S] Skip - these are different people
  [I] Show more info
  [Q] Quit and save progress

Your choice (M/S/I/Q): M

✓ Will merge ID 2 and ID 1278
```

## Tips

1. **Start with high confidence** (≥80%) to get comfortable with the tool
2. **Watch for conflicts** - different dates/tribes may indicate data errors
3. **Use "I" to see full details** when uncertain
4. **Save progress anytime** with "Q" - your decisions are logged
5. **Review the log file** before applying merges

## Files Created

- `sahabah_reviewed.csv` - Deduplicated data
- `merge_decisions_*.json` - Log of your decisions
- `sahabah.csv.backup_*` - Safety backup
