import csv
import json
import os

def main():
    # 1. Nodes
    # We'll add a 'node_type' field to distinguish between Sahabi and Battle
    nodes = [
        {"id": 0, "name": "Muhammad (PBUH)", "gender": "male", "is_prophet": "True", "title": "Rasulullah", "node_type": "Sahabi", "bio": "The last Prophet of Islam.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 570, "death_year": 632},
        {"id": 1, "name": "Abu Bakr as-Siddiq", "gender": "male", "is_prophet": "False", "title": "As-Siddiq", "node_type": "Sahabi", "bio": "The first Caliph of Islam.", "tribe": "Quraish", "clan": "Banu Taym", "birth_year": 573, "death_year": 634},
        {"id": 2, "name": "Umar ibn al-Khattab", "gender": "male", "is_prophet": "False", "title": "Al-Faruq", "node_type": "Sahabi", "bio": "The second Caliph of Islam.", "tribe": "Quraish", "clan": "Banu Adi", "birth_year": 584, "death_year": 644},
        {"id": 3, "name": "Uthman ibn Affan", "gender": "male", "is_prophet": "False", "title": "Dhun-Nurayn", "node_type": "Sahabi", "bio": "The third Caliph of Islam.", "tribe": "Quraish", "clan": "Banu Umayya", "birth_year": 576, "death_year": 656},
        {"id": 4, "name": "Ali ibn Abi Talib", "gender": "male", "is_prophet": "False", "title": "Asadullah", "node_type": "Sahabi", "bio": "The fourth Caliph of Islam.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 601, "death_year": 661},
        {"id": 5, "name": "Talha ibn Ubaydullah", "gender": "male", "is_prophet": "False", "title": "Talhat al-Khayr", "node_type": "Sahabi", "bio": "One of the ten promised paradise.", "tribe": "Quraish", "clan": "Banu Taym", "birth_year": 594, "death_year": 656},
        {"id": 6, "name": "Zubayr ibn al-Awwam", "gender": "male", "is_prophet": "False", "title": "Hawari Rasulillah", "node_type": "Sahabi", "bio": "One of the ten promised paradise.", "tribe": "Quraish", "clan": "Banu Asad", "birth_year": 594, "death_year": 656},
        {"id": 7, "name": "Abdur Rahman ibn Awf", "gender": "male", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "One of the ten promised paradise.", "tribe": "Quraish", "clan": "Banu Zuhra", "birth_year": 580, "death_year": 652},
        {"id": 8, "name": "Sa'd ibn Abi Waqqas", "gender": "male", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "One of the ten promised paradise.", "tribe": "Quraish", "clan": "Banu Zuhra", "birth_year": 595, "death_year": 674},
        {"id": 9, "name": "Sa'id ibn Zayd", "gender": "male", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "One of the ten promised paradise.", "tribe": "Quraish", "clan": "Banu Adi", "birth_year": 593, "death_year": 671},
        {"id": 10, "name": "Abu Ubaydah ibn al-Jarrah", "gender": "male", "is_prophet": "False", "title": "Amin al-Ummah", "node_type": "Sahabi", "bio": "One of the ten promised paradise.", "tribe": "Quraish", "clan": "Banu al-Harith", "birth_year": 583, "death_year": 639},
        {"id": 11, "name": "Khadija bint Khuwaylid", "gender": "female", "is_prophet": "False", "title": "Tahira", "node_type": "Sahabi", "bio": "The first wife of the Prophet.", "tribe": "Quraish", "clan": "Banu Asad", "birth_year": 555, "death_year": 619},
        {"id": 12, "name": "Aisha bint Abi Bakr", "gender": "female", "is_prophet": "False", "title": "Siddiqa", "node_type": "Sahabi", "bio": "The wife of the Prophet and daughter of Abu Bakr.", "tribe": "Quraish", "clan": "Banu Taym", "birth_year": 613, "death_year": 678},
        {"id": 13, "name": "Fatima bint Muhammad", "gender": "female", "is_prophet": "False", "title": "Az-Zahra", "node_type": "Sahabi", "bio": "The daughter of the Prophet and wife of Ali.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 605, "death_year": 632},
        {"id": 14, "name": "Hasan ibn Ali", "gender": "male", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "Grandson of the Prophet.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 624, "death_year": 670},
        {"id": 15, "name": "Husayn ibn Ali", "gender": "male", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "Grandson of the Prophet.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 626, "death_year": 680},
        {"id": 16, "name": "Hamza ibn Abd al-Muttalib", "gender": "male", "is_prophet": "False", "title": "Asadullah", "node_type": "Sahabi", "bio": "Uncle of the Prophet.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 568, "death_year": 625},
        {"id": 17, "name": "Abbas ibn Abd al-Muttalib", "gender": "male", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "Uncle of the Prophet.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 566, "death_year": 653},
        {"id": 18, "name": "Bilal ibn Rabah", "gender": "male", "is_prophet": "False", "title": "Muadhin", "node_type": "Sahabi", "bio": "The first muadhin of Islam.", "tribe": "Habesha", "clan": "", "birth_year": 580, "death_year": 640},
        {"id": 19, "name": "Khalid ibn al-Walid", "gender": "male", "is_prophet": "False", "title": "Saifullah", "node_type": "Sahabi", "bio": "The Sword of Allah.", "tribe": "Quraish", "clan": "Banu Makhzum", "birth_year": 585, "death_year": 642},
        {"id": 20, "name": "Zaynab bint Muhammad", "gender": "female", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "Daughter of the Prophet.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 599, "death_year": 629},
        {"id": 21, "name": "Ruqayya bint Muhammad", "gender": "female", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "Daughter of the Prophet.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 601, "death_year": 624},
        {"id": 22, "name": "Umm Kulthum bint Muhammad", "gender": "female", "is_prophet": "False", "title": "", "node_type": "Sahabi", "bio": "Daughter of the Prophet.", "tribe": "Quraish", "clan": "Banu Hashim", "birth_year": 603, "death_year": 630},
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
        nodes.append({
            "id": start_id + i,
            "name": name,
            "gender": gender,
            "is_prophet": "False",
            "title": "",
            "node_type": "Sahabi",
            "bio": f"Biographical info for {name}",
            "tribe": "Various",
            "clan": "Various",
            "birth_year": 600,
            "death_year": 660
        })

    # Add extra Sahabah up to ID 199
    for i in range(len(nodes), 200):
        nodes.append({
            "id": i,
            "name": f"Sahabi {i}",
            "gender": "male",
            "is_prophet": "False",
            "title": "",
            "node_type": "Sahabi",
            "bio": f"Biographical info for Sahabi {i}",
            "tribe": "Unknown",
            "clan": "Unknown",
            "birth_year": 600,
            "death_year": 660
        })

    # Add Battles starting from ID 1000
    battles = [
        {"id": 1000, "name": "Battle of Badr", "gender": "male", "is_prophet": "False", "title": "2 AH", "node_type": "Battle", "bio": "First major battle of Islam.", "tribe": "", "clan": "", "birth_year": 0, "death_year": 624},
        {"id": 1001, "name": "Battle of Uhud", "gender": "male", "is_prophet": "False", "title": "3 AH", "node_type": "Battle", "bio": "Second major battle of Islam.", "tribe": "", "clan": "", "birth_year": 0, "death_year": 625},
        {"id": 1002, "name": "Battle of the Trench", "gender": "male", "is_prophet": "False", "title": "5 AH", "node_type": "Battle", "bio": "Defensive siege of Medina.", "tribe": "", "clan": "", "birth_year": 0, "death_year": 627},
        {"id": 1003, "name": "Battle of Khaibar", "gender": "male", "is_prophet": "False", "title": "7 AH", "node_type": "Battle", "bio": "Battle against the Jewish fortresses.", "tribe": "", "clan": "", "birth_year": 0, "death_year": 628},
        {"id": 1004, "name": "Battle of Mu'tah", "gender": "male", "is_prophet": "False", "title": "8 AH", "node_type": "Battle", "bio": "First battle against the Byzantines.", "tribe": "", "clan": "", "birth_year": 0, "death_year": 629},
        {"id": 1005, "name": "Battle of Hunayn", "gender": "male", "is_prophet": "False", "title": "8 AH", "node_type": "Battle", "bio": "Battle against the Hawazin and Thaqif.", "tribe": "", "clan": "", "birth_year": 0, "death_year": 630},
        {"id": 1006, "name": "Battle of Yarmouk", "gender": "male", "is_prophet": "False", "title": "13 AH", "node_type": "Battle", "bio": "Major battle between the Muslims and the Byzantines.", "tribe": "", "clan": "", "birth_year": 0, "death_year": 636},
        {"id": 1007, "name": "Battle of Qadisiyyah", "gender": "male", "is_prophet": "False", "title": "15 AH", "node_type": "Battle", "bio": "Major battle between the Muslims and the Sassanids.", "tribe": "", "clan": "", "birth_year": 0, "death_year": 636},
    ]
    nodes.extend(battles)

    # 2. Relationships
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

        {"source_id": 14, "target_id": 15, "type": "SIBLING_OF", "category": "others"}, # Hasan & Husayn
        {"source_id": real_names.index("Abdullah ibn Abbas") + 23, "target_id": 0, "type": "TEACHER_OF", "category": "others"}, # Prophet taught Ibn Abbas
    ]

    # Add PARTICIPATED_IN relationships
    # Badr (1000)
    for sid in [0, 1, 2, 4, 16, 18]: # Muhammad, Abu Bakr, Umar, Ali, Hamza, Bilal
        relationships.append({"source_id": sid, "target_id": 1000, "type": "PARTICIPATED_IN", "category": "battles"})

    # Uhud (1001)
    for sid in [0, 1, 2, 4, 16]: # Hamza martyred here
        relationships.append({"source_id": sid, "target_id": 1001, "type": "PARTICIPATED_IN", "category": "battles"})

    # Khaibar (1003)
    for sid in [0, 1, 2, 4]:
        relationships.append({"source_id": sid, "target_id": 1003, "type": "PARTICIPATED_IN", "category": "battles"})

    # Yarmouk (1006)
    for sid in [19, 10]: # Khalid ibn al-Walid, Abu Ubaydah
        relationships.append({"source_id": sid, "target_id": 1006, "type": "PARTICIPATED_IN", "category": "battles"})

    # Qadisiyyah (1007)
    for sid in [8]: # Sa'd ibn Abi Waqqas
        relationships.append({"source_id": sid, "target_id": 1007, "type": "PARTICIPATED_IN", "category": "battles"})

    # Save CSVs
    with open('data-pipeline/sahabah.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "gender", "is_prophet", "title", "node_type", "bio", "tribe", "clan", "birth_year", "death_year"])
        writer.writeheader()
        writer.writerows(nodes)

    with open('data-pipeline/relationships.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["source_id", "target_id", "type", "category"])
        writer.writeheader()
        writer.writerows(relationships)

    # Save JSON for static frontend
    graph_data = {
        "nodes": nodes,
        "links": relationships
    }
    with open('frontend/public/data/sahabah_data.json', 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
