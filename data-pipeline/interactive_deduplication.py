#!/usr/bin/env python3
"""
Interactive Deduplication Tool

This script allows manual review and decision-making for each duplicate pair.
Shows detailed comparison and lets you choose to merge or skip each case.
"""

import csv
import json
import shutil
from datetime import datetime
from typing import Dict, List, Tuple


def load_analysis(json_file: str):
    """Load the deduplication analysis."""
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_sahabah(csv_file: str):
    """Load sahabah data."""
    sahabah = {}
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            sahabah[row['id']] = row
    return sahabah, fieldnames


def display_comparison(row1: Dict, row2: Dict, confidence: float, evidence: List[str], conflicts: List[str]):
    """Display a detailed side-by-side comparison of two entries."""
    print("\n" + "=" * 100)
    print(f"DUPLICATE CANDIDATE - Confidence: {confidence:.1f}%")
    print("=" * 100)
    
    # Key fields comparison
    fields_to_compare = [
        ('id', 'ID'),
        ('name_en', 'English Name'),
        ('name_ar', 'Arabic Name'),
        ('kunyah', 'Kunyah'),
        ('laqab', 'Laqab'),
        ('gender', 'Gender'),
        ('birth_year_hijri', 'Birth Year'),
        ('death_year_hijri', 'Death Year'),
        ('tribe', 'Tribe'),
        ('clan', 'Clan'),
        ('biography_short', 'Biography'),
        ('prominence', 'Prominence'),
        ('node_type', 'Node Type'),
    ]
    
    print(f"\n{'Field':<20} {'Entry 1':<38} {'Entry 2':<38}")
    print("-" * 100)
    
    for field, label in fields_to_compare:
        val1 = row1.get(field, '')
        val2 = row2.get(field, '')
        
        # Truncate long values
        if len(val1) > 35:
            val1 = val1[:32] + "..."
        if len(val2) > 35:
            val2 = val2[:32] + "..."
        
        # Highlight differences
        marker = "  " if val1 == val2 else "⚠️"
        print(f"{marker} {label:<18} {val1:<38} {val2:<38}")
    
    # Show evidence
    if evidence:
        print("\n" + "✓" * 50)
        print("SUPPORTING EVIDENCE:")
        for ev in evidence:
            print(f"  {ev}")
    
    # Show conflicts
    if conflicts:
        print("\n" + "⚠" * 50)
        print("CONFLICTS/CONCERNS:")
        for cf in conflicts:
            print(f"  {cf}")
    
    print("\n" + "=" * 100)


def count_non_empty_fields(row: Dict) -> int:
    """Count how many fields have data."""
    return sum(1 for v in row.values() if v and v.strip() and v.lower() not in ['false', '0'])


def get_user_decision(row1: Dict, row2: Dict, confidence: float) -> str:
    """
    Ask user what to do with this duplicate pair.
    Returns: 'merge', 'skip', 'info', or 'quit'
    """
    while True:
        print("\nWhat would you like to do?")
        print("  [M] Merge these entries (keep the more complete one)")
        print("  [S] Skip - these are different people")
        print("  [I] Show more info")
        print("  [Q] Quit and save progress")
        
        choice = input("\nYour choice (M/S/I/Q): ").strip().upper()
        
        if choice in ['M', 'MERGE']:
            return 'merge'
        elif choice in ['S', 'SKIP']:
            return 'skip'
        elif choice in ['I', 'INFO']:
            return 'info'
        elif choice in ['Q', 'QUIT']:
            return 'quit'
        else:
            print("Invalid choice. Please enter M, S, I, or Q.")


def show_detailed_info(row1: Dict, row2: Dict):
    """Show all fields for both entries."""
    print("\n" + "=" * 100)
    print("DETAILED VIEW - Entry 1 (ID: {})".format(row1['id']))
    print("=" * 100)
    for key, value in row1.items():
        if value and value.strip():
            print(f"  {key:25} : {value}")
    
    print("\n" + "=" * 100)
    print("DETAILED VIEW - Entry 2 (ID: {})".format(row2['id']))
    print("=" * 100)
    for key, value in row2.items():
        if value and value.strip():
            print(f"  {key:25} : {value}")
    print()


def merge_entries(row1: Dict, row2: Dict) -> Dict:
    """
    Merge two entries, keeping the most complete information.
    Uses the entry with more data as base.
    """
    count1 = count_non_empty_fields(row1)
    count2 = count_non_empty_fields(row2)
    
    # Use the more complete entry as base
    if count1 >= count2:
        merged = row1.copy()
        other = row2
    else:
        merged = row2.copy()
        other = row1
    
    # Keep the lower ID
    if int(row1['id']) < int(row2['id']):
        merged['id'] = row1['id']
    
    # Fill in missing fields from the other entry
    for key, value in other.items():
        if key == 'id':
            continue  # Already handled
        
        if not merged.get(key) or not merged[key].strip():
            if value and value.strip():
                merged[key] = value
        elif key.endswith('_short') or key.endswith('_source'):
            # For descriptive fields, prefer the longer one
            if len(value or '') > len(merged[key] or ''):
                merged[key] = value
    
    return merged


def interactive_deduplication(csv_file: str, json_file: str, min_confidence: float = 50.0):
    """
    Run interactive deduplication session.
    
    Args:
        csv_file: Path to sahabah.csv
        json_file: Path to deduplication_analysis.json
        min_confidence: Minimum confidence to review (default: 50%)
    """
    print("=" * 100)
    print("INTERACTIVE DEDUPLICATION TOOL")
    print("=" * 100)
    print(f"\nLoading data from {csv_file}...")
    
    # Load data
    sahabah, fieldnames = load_sahabah(csv_file)
    analysis = load_analysis(json_file)
    
    print(f"Loaded {len(sahabah)} entries")
    print(f"Found {analysis['total_candidates']} duplicate candidates")
    
    # Filter by confidence
    candidates = [
        d for d in analysis['duplicates']
        if d['confidence'] >= min_confidence
    ]
    
    print(f"\nShowing {len(candidates)} candidates with confidence ≥ {min_confidence}%")
    print("\nYou'll be shown each pair and can decide whether to merge or skip.")
    
    input("\nPress Enter to begin review...")
    
    # Track decisions
    merge_list = []  # Pairs to merge
    skip_list = []   # Pairs to skip
    id_mapping = {}  # Map old ID to new ID
    
    # Review each candidate
    for idx, candidate in enumerate(candidates, 1):
        id1 = candidate['id1']
        id2 = candidate['id2']
        
        # Skip if already merged
        if id1 in id_mapping or id2 in id_mapping:
            continue
        
        row1 = sahabah[id1]
        row2 = sahabah[id2]
        confidence = candidate['confidence']
        evidence = candidate['evidence']
        conflicts = candidate['conflicts']
        
        # Clear screen for better readability (optional)
        print("\n" * 2)
        print(f"Review {idx} of {len(candidates)}")
        
        # Show comparison
        display_comparison(row1, row2, confidence, evidence, conflicts)
        
        # Get decision
        while True:
            decision = get_user_decision(row1, row2, confidence)
            
            if decision == 'merge':
                print(f"\n✓ Will merge ID {id1} and ID {id2}")
                merge_list.append((id1, id2))
                # Map the higher ID to the lower ID
                if int(id1) < int(id2):
                    id_mapping[id2] = id1
                else:
                    id_mapping[id1] = id2
                break
            
            elif decision == 'skip':
                print(f"\n✗ Will skip - keeping both entries")
                skip_list.append((id1, id2))
                break
            
            elif decision == 'info':
                show_detailed_info(row1, row2)
                display_comparison(row1, row2, confidence, evidence, conflicts)
                continue
            
            elif decision == 'quit':
                print("\n\nSaving progress and exiting...")
                return merge_list, skip_list, sahabah, fieldnames
    
    print("\n\n" + "=" * 100)
    print("REVIEW COMPLETE")
    print("=" * 100)
    print(f"Pairs to merge: {len(merge_list)}")
    print(f"Pairs to skip: {len(skip_list)}")
    
    return merge_list, skip_list, sahabah, fieldnames


def apply_merges(merge_list: List[Tuple[str, str]], sahabah: Dict, fieldnames: List[str], output_file: str):
    """Apply the merge decisions and save to new file."""
    
    if not merge_list:
        print("\nNo merges to apply.")
        return
    
    print(f"\nApplying {len(merge_list)} merges...")
    
    # Create merged entries
    merged_ids = set()
    merged_entries = {}
    
    for id1, id2 in merge_list:
        row1 = sahabah[id1]
        row2 = sahabah[id2]
        
        merged = merge_entries(row1, row2)
        merged_entries[merged['id']] = merged
        
        # Track which IDs were merged
        merged_ids.add(id1)
        merged_ids.add(id2)
    
    # Build final dataset
    final_rows = []
    
    for id_str, row in sahabah.items():
        if id_str in merged_entries:
            # Use the merged version
            final_rows.append(merged_entries[id_str])
        elif id_str not in merged_ids:
            # Keep original (not involved in any merge)
            final_rows.append(row)
        # Skip entries that were merged into others
    
    # Sort by ID
    final_rows.sort(key=lambda x: int(x['id']) if x['id'].isdigit() else 999999)
    
    # Reassign sequential IDs
    for idx, row in enumerate(final_rows):
        row['id'] = str(idx)
    
    # Save to file
    print(f"Writing {len(final_rows)} entries to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(final_rows)
    
    print(f"\n✓ Saved to {output_file}")
    print(f"  Original entries: {len(sahabah)}")
    print(f"  Final entries: {len(final_rows)}")
    print(f"  Removed: {len(sahabah) - len(final_rows)}")


def main():
    csv_file = 'sahabah.csv'
    json_file = 'deduplication_analysis.json'
    output_file = 'sahabah_reviewed.csv'
    
    # Check if analysis exists
    try:
        with open(json_file, 'r') as f:
            pass
    except FileNotFoundError:
        print(f"Error: {json_file} not found.")
        print("Please run safe_deduplication_analysis.py first.")
        return
    
    # Ask for minimum confidence threshold
    print("\nSelect confidence threshold:")
    print("  1. High confidence only (≥80%) - safest, fewer reviews")
    print("  2. Medium & high confidence (≥50%) - recommended")
    print("  3. All candidates (≥20%) - most thorough")
    print("  4. Custom threshold")
    
    choice = input("\nYour choice (1-4): ").strip()
    
    if choice == '1':
        min_confidence = 80.0
    elif choice == '2':
        min_confidence = 50.0
    elif choice == '3':
        min_confidence = 20.0
    elif choice == '4':
        try:
            min_confidence = float(input("Enter minimum confidence (0-100): "))
            min_confidence = max(0, min(100, min_confidence))
        except ValueError:
            print("Invalid input, using 50%")
            min_confidence = 50.0
    else:
        print("Invalid choice, using 50%")
        min_confidence = 50.0
    
    # Create backup
    backup_file = f'sahabah.csv.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    print(f"\nCreating backup: {backup_file}")
    shutil.copy(csv_file, backup_file)
    
    # Run interactive session
    merge_list, skip_list, sahabah, fieldnames = interactive_deduplication(
        csv_file, json_file, min_confidence
    )
    
    # Save decisions log
    decisions_file = f'merge_decisions_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(decisions_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'min_confidence': min_confidence,
            'merged': merge_list,
            'skipped': skip_list
        }, f, indent=2)
    
    print(f"\n✓ Decisions saved to {decisions_file}")
    
    # Apply merges
    if merge_list:
        confirm = input(f"\nApply {len(merge_list)} merges? (y/n): ").strip().lower()
        if confirm == 'y':
            apply_merges(merge_list, sahabah, fieldnames, output_file)
            print("\n" + "=" * 100)
            print("SUCCESS!")
            print("=" * 100)
            print(f"\nReview the output file: {output_file}")
            print("If everything looks good, replace the original:")
            print(f"  mv {output_file} {csv_file}")
        else:
            print("\nMerge cancelled. Your decisions are saved in the log file.")
    else:
        print("\nNo merges selected.")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user. Progress saved.")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
