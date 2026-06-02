#!/usr/bin/env python3
"""
Deduplicate sahabah.csv entries

This script identifies and removes duplicate entries based on:
1. Exact Arabic name matches
2. Normalized English name matches (handling case, diacritics, spacing differences)
3. Very similar transliterations

When duplicates are found, the script merges them by:
- Keeping the entry with more complete information
- Preserving unique data from all duplicate entries
"""

import csv
import re
import unicodedata
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Tuple


def normalize_name(name: str) -> str:
    """
    Normalize a name for comparison by:
    - Converting to lowercase
    - Removing diacritical marks
    - Normalizing whitespace
    - Removing common variations (al-, ibn, bin, etc.)
    """
    if not name:
        return ""
    
    # Convert to NFD (decomposed) form to separate diacritical marks
    name = unicodedata.normalize('NFD', name)
    
    # Remove diacritical marks
    name = ''.join(char for char in name if unicodedata.category(char) != 'Mn')
    
    # Convert to lowercase
    name = name.lower()
    
    # Normalize common variations
    name = re.sub(r'\bal-', 'al', name)
    name = re.sub(r'\bibn\b', 'ibn', name)
    name = re.sub(r'\bbin\b', 'ibn', name)
    name = re.sub(r'\bbint\b', 'bint', name)
    
    # Remove extra whitespace and punctuation
    name = re.sub(r'[.,;:\-\'\"]+', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name


def calculate_completeness_score(row: Dict) -> int:
    """Calculate a score based on how complete an entry is."""
    score = 0
    
    # Count non-empty fields
    for key, value in row.items():
        if value and value.strip() and value.lower() not in ['false', '0', '']:
            score += 1
    
    # Give extra weight to important fields
    important_fields = ['biography_short', 'biography_source', 'tribe', 'clan', 
                        'birth_year_hijri', 'death_year_hijri']
    for field in important_fields:
        if row.get(field) and row[field].strip():
            score += 2
    
    return score


def merge_rows(rows: List[Dict]) -> Dict:
    """
    Merge multiple duplicate rows into one, preferring non-empty values.
    Uses the most complete row as base and fills in missing data from others.
    """
    if len(rows) == 1:
        return rows[0]
    
    # Sort by completeness score (descending)
    sorted_rows = sorted(rows, key=calculate_completeness_score, reverse=True)
    
    # Start with the most complete row
    merged = sorted_rows[0].copy()
    
    # Fill in missing fields from other rows
    for row in sorted_rows[1:]:
        for key, value in row.items():
            if key == 'id':
                # Keep the lowest ID number
                if row['id'] and (not merged['id'] or int(row['id']) < int(merged['id'])):
                    merged['id'] = row['id']
            elif not merged.get(key) or not merged[key].strip():
                # Fill in empty fields
                if value and value.strip():
                    merged[key] = value
            elif key.endswith('_en') or key.endswith('_bn') or key.endswith('_de'):
                # For translations, prefer the longer/more complete one
                if len(value or '') > len(merged[key] or ''):
                    merged[key] = value
    
    return merged


def find_duplicates(rows: List[Dict]) -> Dict[str, List[int]]:
    """
    Find duplicate entries based on Arabic names and normalized English names.
    Returns a dictionary mapping normalized keys to lists of row indices.
    """
    # Dictionary to group rows by their normalized identifiers
    arabic_name_map = defaultdict(list)
    english_name_map = defaultdict(list)
    
    for idx, row in enumerate(rows):
        # Group by Arabic name (most reliable)
        arabic_name = row.get('name_ar', '').strip()
        if arabic_name:
            arabic_name_map[arabic_name].append(idx)
        
        # Group by normalized English name
        english_name = row.get('name_en', '').strip()
        if english_name:
            normalized = normalize_name(english_name)
            if normalized:
                english_name_map[normalized].append(idx)
    
    # Combine duplicate groups
    duplicate_groups = {}
    processed_indices = set()
    
    # Process Arabic name duplicates (highest priority)
    for arabic_name, indices in arabic_name_map.items():
        if len(indices) > 1:
            # Use the first index as the key
            key = indices[0]
            duplicate_groups[key] = indices
            processed_indices.update(indices)
    
    # Process English name duplicates (only if not already processed)
    for normalized_name, indices in english_name_map.items():
        if len(indices) > 1:
            # Filter out already processed indices
            unprocessed = [idx for idx in indices if idx not in processed_indices]
            
            if len(unprocessed) > 1:
                # Check if these really look like duplicates
                # (have similar Arabic names or other matching fields)
                key = unprocessed[0]
                duplicate_groups[key] = unprocessed
                processed_indices.update(unprocessed)
    
    return duplicate_groups


def deduplicate_sahabah(input_file: str, output_file: str, report_file: str):
    """Main deduplication function."""
    
    print(f"Reading {input_file}...")
    
    # Read all rows
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"Total entries: {len(rows)}")
    
    # Find duplicates
    print("\nFinding duplicates...")
    duplicate_groups = find_duplicates(rows)
    
    if not duplicate_groups:
        print("No duplicates found!")
        return
    
    print(f"Found {len(duplicate_groups)} duplicate groups affecting {sum(len(v) for v in duplicate_groups.values())} entries")
    
    # Create report
    report_lines = []
    report_lines.append(f"Deduplication Report - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("=" * 80)
    report_lines.append(f"Total entries before: {len(rows)}")
    report_lines.append(f"Duplicate groups found: {len(duplicate_groups)}")
    report_lines.append("")
    
    # Merge duplicates
    merged_rows = []
    merged_indices = set()
    
    for group_key, indices in duplicate_groups.items():
        duplicate_rows = [rows[i] for i in indices]
        
        # Add to report
        report_lines.append(f"\nDuplicate Group (IDs: {', '.join(r['id'] for r in duplicate_rows)}):")
        report_lines.append(f"  Arabic: {duplicate_rows[0].get('name_ar', 'N/A')}")
        for row in duplicate_rows:
            report_lines.append(f"  - ID {row['id']}: {row.get('name_en', 'N/A')}")
        
        # Merge the rows
        merged = merge_rows(duplicate_rows)
        merged_rows.append(merged)
        merged_indices.update(indices)
        
        report_lines.append(f"  → Merged as: {merged.get('name_en', 'N/A')} (ID: {merged['id']})")
    
    # Add non-duplicate rows
    for idx, row in enumerate(rows):
        if idx not in merged_indices:
            merged_rows.append(row)
    
    # Sort by ID
    merged_rows.sort(key=lambda x: int(x['id']) if x['id'].isdigit() else 999999)
    
    # Reassign IDs sequentially
    for idx, row in enumerate(merged_rows):
        row['id'] = str(idx)
    
    report_lines.append("")
    report_lines.append("=" * 80)
    report_lines.append(f"Total entries after: {len(merged_rows)}")
    report_lines.append(f"Entries removed: {len(rows) - len(merged_rows)}")
    
    # Write output
    print(f"\nWriting deduplicated data to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(merged_rows)
    
    # Write report
    print(f"Writing report to {report_file}...")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report_lines))
    
    print("\nDeduplication complete!")
    print(f"  Before: {len(rows)} entries")
    print(f"  After:  {len(merged_rows)} entries")
    print(f"  Removed: {len(rows) - len(merged_rows)} duplicates")


if __name__ == '__main__':
    import sys
    import shutil
    
    input_file = 'sahabah.csv'
    output_file = 'sahabah_deduplicated.csv'
    report_file = 'deduplication_report.txt'
    
    # Create backup
    backup_file = f'sahabah.csv.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    print(f"Creating backup: {backup_file}")
    shutil.copy(input_file, backup_file)
    
    # Run deduplication
    try:
        deduplicate_sahabah(input_file, output_file, report_file)
        
        print("\n" + "=" * 80)
        print("SUCCESS! Review the report and deduplicated file.")
        print(f"  Original (backup): {backup_file}")
        print(f"  Deduplicated: {output_file}")
        print(f"  Report: {report_file}")
        print("\nIf everything looks good, replace the original:")
        print(f"  mv {output_file} {input_file}")
        print("=" * 80)
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
