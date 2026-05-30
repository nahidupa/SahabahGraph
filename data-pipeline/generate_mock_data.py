import csv
import json

def main():
    # 1. Nodes
    nodes = [
        {"id": 0, "name": "Muhammad (PBUH)", "gender": "male", "is_prophet": "True", "title": "Rasulullah"},
        {"id": 1, "name": "Abu Bakr as-Siddiq", "gender": "male", "is_prophet": "False", "title": "As-Siddiq"},
        {"id": 2, "name": "Umar ibn al-Khattab", "gender": "male", "is_prophet": "False", "title": "Al-Faruq"},
        {"id": 3, "name": "Uthman ibn Affan", "gender": "male", "is_prophet": "False", "title": "Dhun-Nurayn"},
        {"id": 4, "name": "Ali ibn Abi Talib", "gender": "male", "is_prophet": "False", "title": "Asadullah"},
        {"id": 5, "name": "Talha ibn Ubaydullah", "gender": "male", "is_prophet": "False", "title": "Talhat al-Khayr"},
        {"id": 6, "name": "Zubayr ibn al-Awwam", "gender": "male", "is_prophet": "False", "title": "Hawari Rasulillah"},
        {"id": 7, "name": "Abdur Rahman ibn Awf", "gender": "male", "is_prophet": "False", "title": ""},
        {"id": 8, "name": "Sa'd ibn Abi Waqqas", "gender": "male", "is_prophet": "False", "title": ""},
        {"id": 9, "name": "Sa'id ibn Zayd", "gender": "male", "is_prophet": "False", "title": ""},
        {"id": 10, "name": "Abu Ubaydah ibn al-Jarrah", "gender": "male", "is_prophet": "False", "title": "Amin al-Ummah"},
        {"id": 11, "name": "Khadija bint Khuwaylid", "gender": "female", "is_prophet": "False", "title": "Tahira"},
        {"id": 12, "name": "Aisha bint Abi Bakr", "gender": "female", "is_prophet": "False", "title": "Siddiqa"},
        {"id": 13, "name": "Fatima bint Muhammad", "gender": "female", "is_prophet": "False", "title": "Az-Zahra"},
        {"id": 14, "name": "Hasan ibn Ali", "gender": "male", "is_prophet": "False", "title": ""},
        {"id": 15, "name": "Husayn ibn Ali", "gender": "male", "is_prophet": "False", "title": ""},
        {"id": 16, "name": "Hamza ibn Abd al-Muttalib", "gender": "male", "is_prophet": "False", "title": "Asadullah"},
        {"id": 17, "name": "Abbas ibn Abd al-Muttalib", "gender": "male", "is_prophet": "False", "title": ""},
        {"id": 18, "name": "Bilal ibn Rabah", "gender": "male", "is_prophet": "False", "title": "Muadhin"},
        {"id": 19, "name": "Khalid ibn al-Walid", "gender": "male", "is_prophet": "False", "title": "Saifullah"},
        {"id": 20, "name": "Zaynab bint Muhammad", "gender": "female", "is_prophet": "False", "title": ""},
        {"id": 21, "name": "Ruqayya bint Muhammad", "gender": "female", "is_prophet": "False", "title": ""},
        {"id": 22, "name": "Umm Kulthum bint Muhammad", "gender": "female", "is_prophet": "False", "title": ""},
    ]

    real_names = [
        "Ja'far ibn Abi Talib", "Zayd ibn Harithah", "Usama ibn Zayd", "Abdullah ibn Umar",
        "Abdullah ibn Abbas", "Abdullah ibn Mas'ud", "Abu Hurairah", "Anas ibn Malik",
        "Jabir ibn Abdullah", "Abu Sa'id al-Khudri", "Mu'adh ibn Jabal", "Ubayy ibn Ka'b",
        "Zayd ibn Thabit", "Abu Dharr al-Ghifari", "Salman al-Farsi", "Ammar ibn Yasir",
        "Miqdad ibn Aswad", "Hudhayfa ibn al-Yaman", "Amr ibn al-Aas", "Muawiyah ibn Abi Sufyan",
    ]

    start_id = len(nodes)
    for i, name in enumerate(real_names):
        gender = "female" if any(x in name.lower() for x in ["bint", "umm"]) else "male"
        nodes.append({"id": start_id + i, "name": name, "gender": gender, "is_prophet": "False", "title": ""})

    for i in range(len(nodes), 200):
        nodes.append({"id": i, "name": f"Sahabi {i}", "gender": "male", "is_prophet": "False", "title": ""})

    # 2. Relationships
    # types: SON_OF, DAUGHTER_OF, SPOUSE_OF, UNCLE_OF, COMPANION_OF, etc.
    # categories: sons, daughters, uncles, others
    relationships = [
        {"source_id": 11, "target_id": 0, "type": "SPOUSE_OF", "category": "others"},
        {"source_id": 12, "target_id": 0, "type": "SPOUSE_OF", "category": "others"},
        {"source_id": 13, "target_id": 0, "type": "DAUGHTER_OF", "category": "daughters"},
        {"source_id": 20, "target_id": 0, "type": "DAUGHTER_OF", "category": "daughters"},
        {"source_id": 21, "target_id": 0, "type": "DAUGHTER_OF", "category": "daughters"},
        {"source_id": 22, "target_id": 0, "type": "DAUGHTER_OF", "category": "daughters"},

        {"source_id": 1, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 2, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 3, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 4, "target_id": 0, "type": "COUSIN_OF", "category": "others"},

        {"source_id": 16, "target_id": 0, "type": "UNCLE_OF", "category": "uncles"},
        {"source_id": 17, "target_id": 0, "type": "UNCLE_OF", "category": "uncles"},
        
        {"source_id": 14, "target_id": 4, "type": "SON_OF", "category": "sons"},
        {"source_id": 15, "target_id": 4, "type": "SON_OF", "category": "sons"},
        {"source_id": 14, "target_id": 13, "type": "SON_OF", "category": "sons"},
        {"source_id": 15, "target_id": 13, "type": "SON_OF", "category": "sons"},

        {"source_id": 12, "target_id": 1, "type": "DAUGHTER_OF", "category": "daughters"},
        {"source_id": 21, "target_id": 3, "type": "SPOUSE_OF", "category": "others"}, # Ruqayya & Uthman
        {"source_id": 22, "target_id": 3, "type": "SPOUSE_OF", "category": "others"}, # Umm Kulthum & Uthman
    ]

    # Save CSVs
    with open('data-pipeline/sahabah.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "gender", "is_prophet", "title"])
        writer.writeheader()
        writer.writerows(nodes)

    with open('data-pipeline/relationships.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["source_id", "target_id", "type", "category"])
        writer.writeheader()
        writer.writerows(relationships)

    # 3. Export to JSON for frontend
    data = {
        "nodes": nodes,
        "links": relationships
    }

    import os
    os.makedirs('frontend/public/data', exist_ok=True)
    with open('frontend/public/data/sahabah_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Generated {len(nodes)} nodes and {len(relationships)} relationships.")
    print("Exported to frontend/public/data/sahabah_data.json")

if __name__ == "__main__":
    main()
