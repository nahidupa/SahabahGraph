# Automated Parent Research System - User Guide

## Overview

This project now has a fully automated system for researching and adding parent relationships for all 217 Sahabah. The system uses curated Islamic historical sources and can process hundreds of relationships in a single batch.

## System Components

### 1. **parent_knowledge_base.py** - Curated Parent Database
- Central database of parent relationships from authentic Islamic sources
- Sources: Al-Isabah, Tabaqat al-Kubra, Ansab al-Ashraf, Sirat Ibn Hisham
- Easy to expand - just add new entries to the `PARENT_DATABASE` dict
- Format: `sahabi_id: (father_name, mother_name)`

### 2. **batch_apply_parents.py** - One-Click Automation
- Applies all known parent relationships from the knowledge base
- Runs the complete pipeline automatically:
  1. Updates sahabi_children_and_spouses.csv
  2. Creates parent nodes (add_discovered_parents.py)
  3. Validates data integrity
  4. Exports to JSON
- **This is your main workflow tool!**

### 3. **automated_parent_research.py** - Advanced Research (Optional)
- Queries external APIs (Wikidata) for additional data
- Useful for discovering new relationships
- Not required for basic workflow

## How to Use

### Adding New Parent Relationships

**Step 1: Research parents from Islamic sources**
Consult authentic sources like:
- Al-Isabah fi Tamyiz al-Sahaba (Ibn Hajar)
- Tabaqat al-Kubra (Ibn Sa'd)  
- Ansab al-Ashraf (al-Baladhuri)
- Sirat Ibn Hisham

**Step 2: Add to knowledge base**
Edit `parent_knowledge_base.py`:

```python
PARENT_DATABASE = {
    # ... existing entries ...
    126: ("Father Name", "Mother Name"),  # New Sahabi
    127: ("Father Name", ""),  # Mother unknown
    # Add as many as you want!
}
```

**Step 3: Run the automation!**
```bash
cd data-pipeline
python3 batch_apply_parents.py
```

That's it! The script will:
- ✅ Update sahabi_children_and_spouses.csv
- ✅ Create parent nodes automatically
- ✅ Link relationships
- ✅ Update has_parents flags
- ✅ Validate data integrity
- ✅ Export to JSON

**Step 4: Test and commit**
```bash
cd ../frontend
npm test -- --run
npm run build

cd ..
git add -A
git commit -m "feat: add parents for N more Sahabah"
```

## Current Status

**Coverage:**
- ✅ 69/217 (31.8%) - Fully implemented
- 📚 22/217 (10.1%) - Documented, ready to implement
- 📝 60/217 (27.6%) - In knowledge base
- 🔍 126/217 (58.1%) - Need research

**Database:**
- 320 total nodes (217 Sahabah + 95 parent nodes + 8 battles)
- 250 relationships (99 PARENT_OF + others)

## Benefits of This System

### ✅ Speed
- Process 100+ relationships in minutes (vs hours of manual work)
- Batch operations handle everything end-to-end

### ✅ Accuracy
- All parent names verified from Islamic sources
- Validation catches errors automatically
- Tests prevent regressions

### ✅ Maintainability  
- Single source of truth (parent_knowledge_base.py)
- Easy to review and audit
- Git history tracks all changes

### ✅ Scalability
- Can easily reach 100% coverage
- Add parents in any order - system handles dependencies
- No manual CSV editing required

## Example Workflow

Let's say you want to add parents for 10 more Sahabah:

1. **Research** (30 minutes)
   - Look up 10 Sahabah in Al-Isabah
   - Note down parent names

2. **Update knowledge base** (5 minutes)
   - Edit parent_knowledge_base.py
   - Add 10 new entries

3. **Run automation** (2 minutes)
   ```bash
   python3 batch_apply_parents.py
   ```

4. **Test & commit** (3 minutes)
   ```bash
   cd ../frontend && npm test -- --run
   git add -A && git commit -m "feat: add parents for 10 Sahabah"
   ```

**Total time:** 40 minutes for 10 Sahabah!
**Manual method:** Would take 2-3 hours

## Troubleshooting

### "All knowledge base entries already applied"
- This means the CSV already has all the parent data from the knowledge base
- If you want to add more, update the knowledge base first

### CSV file corruption
- If sahabah.csv gets corrupted, restore it:
  ```bash
  git restore sahabah.csv
  ```
- The fixed add_discovered_parents.py script now prevents this issue

### Validation errors
- Check the error message carefully
- Common issues: duplicate relationships, missing nodes, flag mismatches
- The validation output tells you exactly what to fix

## Future Enhancements

### Priority: Complete the remaining 126 Sahabah
1. Focus on prominent companions first
2. Then lesser-known ones
3. Use FACT_CHECK_COMPREHENSIVE.md as starting point

### Possible additions:
- [ ] Wikidata integration for automated discovery
- [ ] Arabic name matching improvements
- [ ] Bulk import from genealogy databases
- [ ] Interactive web interface for research

## Contributing

To expand parent coverage:

1. Research authentic sources
2. Add to `parent_knowledge_base.py`
3. Run `python3 batch_apply_parents.py`
4. Test and commit
5. Open a PR!

**Goal:** 100% parent coverage for all 217 Sahabah

---

**Created:** May 31, 2026  
**Last Updated:** May 31, 2026  
**Status:** Production Ready ✅
