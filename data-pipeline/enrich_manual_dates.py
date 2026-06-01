#!/usr/bin/env python3
"""
Enrich Sahabah Data with Manually Curated Dates

This script adds historically verified birth and death dates for prominent Sahabah
and Islamic figures. Dates are curated from reliable historical sources and only
applied when existing dates are missing or zero.

Usage:
    python3 enrich_manual_dates.py

Note:
    - Dates are in Hijri years (negative values indicate Before Hijra)
    - Only updates missing (empty or '0') date fields
    - Source references: Classical Islamic biographical literature
"""

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAHABAH_CSV = ROOT / "data-pipeline" / "sahabah.csv"

# Curated dates based on historical sources (birth_year, death_year)
MANUAL_DATES = {
    "Abdullah ibn Mas'ud": (-28, 32),
    "Abu Hurairah": (-21, 59),
    "Anas ibn Malik": (-10, 93),
    "Mu'adh ibn Jabal": (-17, 18),
    "Ubayy ibn Ka'b": (-20, 30),
    "Zayd ibn Thabit": (-11, 45),
    "Ammar ibn Yasir": (-56, 37),
    "Asma bint Abi Bakr": (-27, 73),
    "Hafsa bint Umar": (-18, 45),
    "Abu Sufyan ibn Harb": (-57, 31),
    "Al-Mughira ibn Shu'ba": (-22, 50),
    "Abdallah ibn al-Zubayr": (1, 73),
    "Mus'ab ibn al-Zubayr": (26, 71),
    "Zayd ibn Harithah": (-41, 8),
    "Usama ibn Zayd": (7, 54),
    "Khalid ibn al-Walid": (-30, 21),
    "Amr ibn al-Aas": (-29, 43),
    "Hind bint Utbah": (-50, 14),
    "Abu Talib": (-75, -3),
    "Al-Hajjaj ibn Yusuf": (40, 95),
    "Marwan ibn al-Hakam": (2, 65),
    "Yazid ibn Muawiya": (26, 64),
    "Umar ibn Abd al-Aziz": (61, 101),
}

def main():
    """Update missing dates with manually curated historical data"""
    print("Loading sahabah data...")
    with open(SAHABAH_CSV, 'r', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    updated_count = 0
    updated_names = []

    for row in rows:
        name = row['name_en']
        if name in MANUAL_DATES:
            birth_year, death_year = MANUAL_DATES[name]
            updated_this_row = False

            # Update birth year if missing or zero
            if not row['birth_year_hijri'] or row['birth_year_hijri'] == '0':
                row['birth_year_hijri'] = str(birth_year)
                updated_count += 1
                updated_this_row = True

            # Update death year if missing or zero
            if not row['death_year_hijri'] or row['death_year_hijri'] == '0':
                row['death_year_hijri'] = str(death_year)
                updated_count += 1
                updated_this_row = True

            if updated_this_row:
                updated_names.append(f"  ✓ {name} ({birth_year} - {death_year} AH)")

    # Write updated data back
    print(f"\nWriting updates to {SAHABAH_CSV.name}...")
    with open(SAHABAH_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Updated {updated_count} date fields for {len(updated_names)} figures:")
    for name_info in updated_names:
        print(name_info)
    print("\n✅ Manual date enrichment complete!")


if __name__ == "__main__":
    main()
