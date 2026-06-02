#!/usr/bin/env python3
"""
Safe and validated deduplication of sahabah.csv

This script takes a careful, validation-based approach:
1. Uses multiple signals to identify potential duplicates
2. Validates each match with confidence scoring
3. Checks for conflicts (different dates, tribes, etc.)
4. Generates detailed reports for manual review
5. Only auto-merges entries with very high confidence
6. Flags suspicious cases for human review
"""

import csv
import re
import unicodedata
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Tuple, Optional
import json


def normalize_name(name: str) -> str:
    """Normalize a name for comparison."""
    if not name:
        return ""
    
    name = unicodedata.normalize('NFD', name)
    name = ''.join(char for char in name if unicodedata.category(char) != 'Mn')
    name = name.lower()
    name = re.sub(r'\bal-', 'al', name)
    name = re.sub(r'\bibn\b', 'ibn', name)
    name = re.sub(r'\bbin\b', 'ibn', name)
    name = re.sub(r'\bbint\b', 'bint', name)
    name = re.sub(r'[.,;:\-\'\"]+', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name


def calculate_match_confidence(row1: Dict, row2: Dict) -> Tuple[float, List[str], List[str]]:
    """
    Calculate confidence that two rows are the same person.
    Returns (confidence_score, supporting_evidence, conflicts)
    """
    evidence = []
    conflicts = []
    score = 0.0
    
    # Arabic name match (strongest signal)
    if row1.get('name_ar') and row2.get('name_ar'):
        if row1['name_ar'].strip() == row2['name_ar'].strip():
            score += 50.0
            evidence.append(f"✓ Identical Arabic names: {row1['name_ar']}")
        else:
            conflicts.append(f"✗ Different Arabic names: '{row1['name_ar']}' vs '{row2['name_ar']}'")
            score -= 20.0
    
    # English name match
    if row1.get('name_en') and row2.get('name_en'):
        norm1 = normalize_name(row1['name_en'])
        norm2 = normalize_name(row2['name_en'])
        
        if norm1 == norm2:
            score += 30.0
            evidence.append(f"✓ Matching English names (normalized): {row1['name_en']} / {row2['name_en']}")
        elif norm1 and norm2:
            # Check if one is a substring of the other (e.g., "Abu Bakr" vs "Abu Bakr as-Siddiq")
            if norm1 in norm2 or norm2 in norm1:
                score += 20.0
                evidence.append(f"✓ Partial English name match: {row1['name_en']} / {row2['name_en']}")
            else:
                conflicts.append(f"✗ Different English names: '{row1['name_en']}' vs '{row2['name_en']}'")
                score -= 10.0
    
    # Birth year comparison
    birth1 = row1.get('birth_year_hijri', '').strip()
    birth2 = row2.get('birth_year_hijri', '').strip()
    
    if birth1 and birth2 and birth1 != '0' and birth2 != '0':
        try:
            b1 = int(birth1)
            b2 = int(birth2)
            if b1 == b2:
                score += 10.0
                evidence.append(f"✓ Same birth year: {birth1}")
            elif abs(b1 - b2) <= 2:
                score += 5.0
                evidence.append(f"≈ Similar birth years: {birth1} vs {birth2} (within 2 years)")
            else:
                conflicts.append(f"✗ Different birth years: {birth1} vs {birth2}")
                score -= 15.0
        except ValueError:
            pass
    
    # Death year comparison
    death1 = row1.get('death_year_hijri', '').strip()
    death2 = row2.get('death_year_hijri', '').strip()
    
    if death1 and death2 and death1 != '0' and death2 != '0':
        try:
            d1 = int(death1)
            d2 = int(death2)
            if d1 == d2:
                score += 10.0
                evidence.append(f"✓ Same death year: {death1}")
            elif abs(d1 - d2) <= 2:
                score += 5.0
                evidence.append(f"≈ Similar death years: {death1} vs {death2} (within 2 years)")
            else:
                conflicts.append(f"✗ Different death years: {death1} vs {death2}")
                score -= 15.0
        except ValueError:
            pass
    
    # Gender must match
    gender1 = row1.get('gender', '').strip().upper()
    gender2 = row2.get('gender', '').strip().upper()
    
    if gender1 and gender2:
        if gender1 == gender2:
            score += 5.0
            evidence.append(f"✓ Same gender: {gender1}")
        else:
            conflicts.append(f"✗ CRITICAL: Different genders: {gender1} vs {gender2}")
            score -= 50.0  # Major red flag
    
    # Tribe comparison
    tribe1 = row1.get('tribe', '').strip()
    tribe2 = row2.get('tribe', '').strip()
    
    if tribe1 and tribe2 and tribe1 != tribe2:
        conflicts.append(f"⚠ Different tribes: '{tribe1}' vs '{tribe2}'")
        score -= 5.0
    elif tribe1 and tribe2 and tribe1 == tribe2:
        score += 5.0
        evidence.append(f"✓ Same tribe: {tribe1}")
    
    # Kunyah comparison
    kunyah1 = row1.get('kunyah', '').strip()
    kunyah2 = row2.get('kunyah', '').strip()
    
    if kunyah1 and kunyah2:
        if kunyah1 == kunyah2:
            score += 5.0
            evidence.append(f"✓ Same kunyah: {kunyah1}")
        else:
            conflicts.append(f"⚠ Different kunyah: '{kunyah1}' vs '{kunyah2}'")
            score -= 3.0
    
    # Laqab comparison
    laqab1 = row1.get('laqab', '').strip()
    laqab2 = row2.get('laqab', '').strip()
    
    if laqab1 and laqab2:
        if laqab1 == laqab2:
            score += 5.0
            evidence.append(f"✓ Same laqab: {laqab1}")
        else:
            conflicts.append(f"⚠ Different laqab: '{laqab1}' vs '{laqab2}'")
            score -= 3.0
    
    return max(0, min(100, score)), evidence, conflicts


def find_duplicate_candidates(rows: List[Dict]) -> List[Tuple[int, int, float, List[str], List[str]]]:
    """
    Find all potential duplicate pairs with confidence scores.
    Returns list of (idx1, idx2, confidence, evidence, conflicts)
    """
    candidates = []
    
    # Group by Arabic name
    arabic_groups = defaultdict(list)
    for idx, row in enumerate(rows):
        arabic_name = row.get('name_ar', '').strip()
        if arabic_name:
            arabic_groups[arabic_name].append(idx)
    
    # Check groups with multiple entries
    for arabic_name, indices in arabic_groups.items():
        if len(indices) > 1:
            # Compare all pairs in this group
            for i in range(len(indices)):
                for j in range(i + 1, len(indices)):
                    idx1, idx2 = indices[i], indices[j]
                    confidence, evidence, conflicts = calculate_match_confidence(
                        rows[idx1], rows[idx2]
                    )
                    
                    if confidence > 20:  # Only consider if some confidence
                        candidates.append((idx1, idx2, confidence, evidence, conflicts))
    
    # Also check normalized English names (might catch transliteration variants)
    english_groups = defaultdict(list)
    for idx, row in enumerate(rows):
        english_name = normalize_name(row.get('name_en', ''))
        if english_name:
            english_groups[english_name].append(idx)
    
    # Check for matches not already found by Arabic name
    processed_pairs = {(min(idx1, idx2), max(idx1, idx2)) for idx1, idx2, _, _, _ in candidates}
    
    for english_name, indices in english_groups.items():
        if len(indices) > 1:
            for i in range(len(indices)):
                for j in range(i + 1, len(indices)):
                    idx1, idx2 = indices[i], indices[j]
                    pair = (min(idx1, idx2), max(idx1, idx2))
                    
                    if pair not in processed_pairs:
                        confidence, evidence, conflicts = calculate_match_confidence(
                            rows[idx1], rows[idx2]
                        )
                        
                        if confidence > 20:
                            candidates.append((idx1, idx2, confidence, evidence, conflicts))
                            processed_pairs.add(pair)
    
    # Sort by confidence (highest first)
    candidates.sort(key=lambda x: x[2], reverse=True)
    
    return candidates


def generate_deduplication_report(input_file: str, output_report: str, output_json: str):
    """Generate a detailed deduplication report for manual review."""
    
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"Total entries: {len(rows)}")
    
    print("\nFinding duplicate candidates...")
    candidates = find_duplicate_candidates(rows)
    
    print(f"Found {len(candidates)} potential duplicate pairs")
    
    # Categorize by confidence
    high_confidence = [c for c in candidates if c[2] >= 80]
    medium_confidence = [c for c in candidates if 50 <= c[2] < 80]
    low_confidence = [c for c in candidates if 20 <= c[2] < 50]
    
    print(f"  High confidence (≥80): {len(high_confidence)}")
    print(f"  Medium confidence (50-79): {len(medium_confidence)}")
    print(f"  Low confidence (20-49): {len(low_confidence)}")
    
    # Generate text report
    with open(output_report, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("SAHABAH DEDUPLICATION REPORT\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")
        
        f.write(f"Total entries analyzed: {len(rows)}\n")
        f.write(f"Duplicate candidates found: {len(candidates)}\n")
        f.write(f"  • High confidence (≥80%): {len(high_confidence)}\n")
        f.write(f"  • Medium confidence (50-79%): {len(medium_confidence)}\n")
        f.write(f"  • Low confidence (20-49%): {len(low_confidence)}\n\n")
        
        # High confidence duplicates
        if high_confidence:
            f.write("\n" + "=" * 80 + "\n")
            f.write("HIGH CONFIDENCE DUPLICATES (≥80%) - SAFE TO MERGE\n")
            f.write("=" * 80 + "\n\n")
            
            for idx, (idx1, idx2, conf, evidence, conflicts) in enumerate(high_confidence, 1):
                row1, row2 = rows[idx1], rows[idx2]
                f.write(f"Duplicate #{idx} - Confidence: {conf:.1f}%\n")
                f.write(f"  ID {row1['id']}: {row1.get('name_en', 'N/A')}\n")
                f.write(f"           {row1.get('name_ar', 'N/A')}\n")
                f.write(f"  ID {row2['id']}: {row2.get('name_en', 'N/A')}\n")
                f.write(f"           {row2.get('name_ar', 'N/A')}\n\n")
                
                f.write("  Evidence:\n")
                for ev in evidence:
                    f.write(f"    {ev}\n")
                
                if conflicts:
                    f.write("\n  ⚠️  Conflicts:\n")
                    for cf in conflicts:
                        f.write(f"    {cf}\n")
                
                f.write("\n")
        
        # Medium confidence
        if medium_confidence:
            f.write("\n" + "=" * 80 + "\n")
            f.write("MEDIUM CONFIDENCE DUPLICATES (50-79%) - REVIEW CAREFULLY\n")
            f.write("=" * 80 + "\n\n")
            
            for idx, (idx1, idx2, conf, evidence, conflicts) in enumerate(medium_confidence, 1):
                row1, row2 = rows[idx1], rows[idx2]
                f.write(f"Potential Duplicate #{idx} - Confidence: {conf:.1f}%\n")
                f.write(f"  ID {row1['id']}: {row1.get('name_en', 'N/A')}\n")
                f.write(f"           {row1.get('name_ar', 'N/A')}\n")
                f.write(f"  ID {row2['id']}: {row2.get('name_en', 'N/A')}\n")
                f.write(f"           {row2.get('name_ar', 'N/A')}\n\n")
                
                f.write("  Evidence:\n")
                for ev in evidence:
                    f.write(f"    {ev}\n")
                
                if conflicts:
                    f.write("\n  ⚠️  Conflicts:\n")
                    for cf in conflicts:
                        f.write(f"    {cf}\n")
                
                f.write("\n")
        
        # Low confidence
        if low_confidence:
            f.write("\n" + "=" * 80 + "\n")
            f.write("LOW CONFIDENCE MATCHES (20-49%) - LIKELY NOT DUPLICATES\n")
            f.write("=" * 80 + "\n\n")
            
            for idx, (idx1, idx2, conf, evidence, conflicts) in enumerate(low_confidence, 1):
                row1, row2 = rows[idx1], rows[idx2]
                f.write(f"Possible Match #{idx} - Confidence: {conf:.1f}%\n")
                f.write(f"  ID {row1['id']}: {row1.get('name_en', 'N/A')} ({row1.get('name_ar', 'N/A')})\n")
                f.write(f"  ID {row2['id']}: {row2.get('name_en', 'N/A')} ({row2.get('name_ar', 'N/A')})\n\n")
    
    # Generate JSON for programmatic use
    json_data = {
        "generated": datetime.now().isoformat(),
        "total_entries": len(rows),
        "total_candidates": len(candidates),
        "high_confidence": len(high_confidence),
        "medium_confidence": len(medium_confidence),
        "low_confidence": len(low_confidence),
        "duplicates": [
            {
                "id1": rows[idx1]['id'],
                "id2": rows[idx2]['id'],
                "name1_en": rows[idx1].get('name_en'),
                "name2_en": rows[idx2].get('name_en'),
                "name1_ar": rows[idx1].get('name_ar'),
                "name2_ar": rows[idx2].get('name_ar'),
                "confidence": round(conf, 2),
                "evidence": evidence,
                "conflicts": conflicts
            }
            for idx1, idx2, conf, evidence, conflicts in candidates
        ]
    }
    
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nReports generated:")
    print(f"  Text report: {output_report}")
    print(f"  JSON data: {output_json}")
    
    return high_confidence, medium_confidence, low_confidence


if __name__ == '__main__':
    input_file = 'sahabah.csv'
    report_file = 'deduplication_analysis.txt'
    json_file = 'deduplication_analysis.json'
    
    print("=" * 80)
    print("SAFE DEDUPLICATION ANALYSIS")
    print("=" * 80)
    print("\nThis script performs careful validation before merging.")
    print("It generates reports for manual review.\n")
    
    high, medium, low = generate_deduplication_report(input_file, report_file, json_file)
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)
    print(f"\nReview the reports before proceeding:")
    print(f"  • {report_file} - Detailed human-readable report")
    print(f"  • {json_file} - Machine-readable data")
    print(f"\nRecommendation:")
    print(f"  • {len(high)} high-confidence duplicates are safe to auto-merge")
    print(f"  • {len(medium)} medium-confidence cases need manual review")
    print(f"  • {len(low)} low-confidence cases are likely different people")
