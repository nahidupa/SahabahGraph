import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAHABAH_CSV = ROOT / "data-pipeline" / "sahabah.csv"

# Curated dates based on historical sources
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
    with open(SAHABAH_CSV, 'r') as f:
        rows = list(csv.DictReader(f))

    updated = 0
    for row in rows:
        name = row['name_en']
        if name in MANUAL_DATES:
            b, d = MANUAL_DATES[name]
            if not row['birth_year_hijri'] or row['birth_year_hijri'] == '0':
                row['birth_year_hijri'] = str(b)
                updated += 1
            if not row['death_year_hijri'] or row['death_year_hijri'] == '0':
                row['death_year_hijri'] = str(d)
                updated += 1

    with open(SAHABAH_CSV, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Manually updated {updated} date fields.")

if __name__ == "__main__":
    main()
