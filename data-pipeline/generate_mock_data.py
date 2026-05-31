import csv
import json
import os

def main():
    # 1. Nodes
    # Fields: id, name_ar, name_en, kunyah, laqab, gender, is_prophet, node_type, prominence, biography_short, biography_source, tribe, clan, birth_year_hijri, death_year_hijri
    nodes = [
        {
            "id": 0, "name_ar": "محمد", "name_en": "Muhammad (PBUH)", "kunyah": "Abu al-Qasim", "laqab": "Rasulullah",
            "gender": "male", "is_prophet": "True", "node_type": "Sahabi", "prominence": "PROPHET",
            "biography_short": "The last Prophet of Islam.", "biography_source": "Sirat Ibn Hisham",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -53, "death_year_hijri": 11
        },
        {
            "id": 1, "name_ar": "أبو بكر الصديق", "name_en": "Abu Bakr as-Siddiq", "kunyah": "Abu Bakr", "laqab": "As-Siddiq",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "The first Caliph of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Taym", "birth_year_hijri": -51, "death_year_hijri": 13
        },
        {
            "id": 2, "name_ar": "عمر بن الخطاب", "name_en": "Umar ibn al-Khattab", "kunyah": "Abu Hafs", "laqab": "Al-Faruq",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "The second Caliph of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Adi", "birth_year_hijri": -40, "death_year_hijri": 23
        },
        {
            "id": 3, "name_ar": "عثمان بن عفان", "name_en": "Uthman ibn Affan", "kunyah": "Abu Amr", "laqab": "Dhun-Nurayn",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "The third Caliph of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Umayya", "birth_year_hijri": -47, "death_year_hijri": 35
        },
        {
            "id": 4, "name_ar": "علي بن أبي طالب", "name_en": "Ali ibn Abi Talib", "kunyah": "Abu al-Hasan", "laqab": "Asadullah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "The fourth Caliph of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -23, "death_year_hijri": 40
        },
        {
            "id": 5, "name_ar": "طلحة بن عبيد الله", "name_en": "Talha ibn Ubaydullah", "kunyah": "Abu Muhammad", "laqab": "Talhat al-Khayr",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Taym", "birth_year_hijri": -28, "death_year_hijri": 36
        },
        {
            "id": 6, "name_ar": "الزبير بن العوام", "name_en": "Zubayr ibn al-Awwam", "kunyah": "Abu Abdullah", "laqab": "Hawari Rasulillah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Asad", "birth_year_hijri": -28, "death_year_hijri": 36
        },
        {
            "id": 7, "name_ar": "عبد الرحمن بن عوف", "name_en": "Abdur Rahman ibn Awf", "kunyah": "Abu Muhammad", "laqab": "",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Zuhra", "birth_year_hijri": -44, "death_year_hijri": 32
        },
        {
            "id": 8, "name_ar": "سعد بن أبي وقاص", "name_en": "Sa'd ibn Abi Waqqas", "kunyah": "Abu Ishaq", "laqab": "",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Zuhra", "birth_year_hijri": -23, "death_year_hijri": 55
        },
        {
            "id": 9, "name_ar": "سعيد بن زيد", "name_en": "Sa'id ibn Zayd", "kunyah": "Abu al-Awar", "laqab": "",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Adi", "birth_year_hijri": -22, "death_year_hijri": 51
        },
        {
            "id": 10, "name_ar": "أبو عبيدة بن الجراح", "name_en": "Abu Ubaydah ibn al-Jarrah", "kunyah": "Abu Ubaydah", "laqab": "Amin al-Ummah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu al-Harith", "birth_year_hijri": -40, "death_year_hijri": 18
        },
        {
            "id": 11, "name_ar": "خديجة بنت خويلد", "name_en": "Khadija bint Khuwaylid", "kunyah": "Umm Hind", "laqab": "Tahira",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "The first wife of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Asad", "birth_year_hijri": -68, "death_year_hijri": -3
        },
        {
            "id": 12, "name_ar": "عائشة بنت أبي بكر", "name_en": "Aisha bint Abi Bakr", "kunyah": "Umm Abdullah", "laqab": "Siddiqa",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "The wife of the Prophet and daughter of Abu Bakr.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Taym", "birth_year_hijri": 9, "death_year_hijri": 58
        },
        {
            "id": 13, "name_ar": "فاطمة بنت محمد", "name_en": "Fatima bint Muhammad", "kunyah": "Umm Abiha", "laqab": "Az-Zahra",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "The daughter of the Prophet and wife of Ali.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -18, "death_year_hijri": 11
        },
        {
            "id": 14, "name_ar": "الحسن بن علي", "name_en": "Hasan ibn Ali", "kunyah": "Abu Muhammad", "laqab": "Sibt Rasulillah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Grandson of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": 3, "death_year_hijri": 50
        },
        {
            "id": 15, "name_ar": "الحسين بن علي", "name_en": "Husayn ibn Ali", "kunyah": "Abu Abdullah", "laqab": "Sayyid Shabab Ahl al-Jannah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Grandson of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": 4, "death_year_hijri": 61
        },
        {
            "id": 16, "name_ar": "حمزة بن عبد المطلب", "name_en": "Hamza ibn Abd al-Muttalib", "kunyah": "Abu Umara", "laqab": "Asadullah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "BADRI",
            "biography_short": "Uncle of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -54, "death_year_hijri": 3
        },
        {
            "id": 17, "name_ar": "العباس بن عبد المطلب", "name_en": "Abbas ibn Abd al-Muttalib", "kunyah": "Abu al-Fadl", "laqab": "",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Uncle of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -56, "death_year_hijri": 32
        },
        {
            "id": 18, "name_ar": "بلال بن رباح", "name_en": "Bilal ibn Rabah", "kunyah": "Abu Abdillah", "laqab": "Muadhin",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "BADRI",
            "biography_short": "The first muadhin of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Habesha", "clan": "", "birth_year_hijri": -42, "death_year_hijri": 20
        },
        {
            "id": 19, "name_ar": "خالد بن الوليد", "name_en": "Khalid ibn al-Walid", "kunyah": "Abu Sulayman", "laqab": "Saifullah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "The Sword of Allah.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Makhzum", "birth_year_hijri": -30, "death_year_hijri": 21
        },
        {
            "id": 20, "name_ar": "زينب بنت محمد", "name_en": "Zaynab bint Muhammad", "kunyah": "", "laqab": "",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Daughter of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -23, "death_year_hijri": 8
        },
        {
            "id": 21, "name_ar": "رقية بنت محمد", "name_en": "Ruqayya bint Muhammad", "kunyah": "Umm Abdillah", "laqab": "",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Daughter of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -20, "death_year_hijri": 2
        },
        {
            "id": 22, "name_ar": "أم كلثوم بنت محمد", "name_en": "Umm Kulthum bint Muhammad", "kunyah": "", "laqab": "",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Daughter of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -19, "death_year_hijri": 9
        },
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
            "name_ar": "", "name_en": name, "kunyah": "", "laqab": "",
            "gender": gender,
            "is_prophet": "False",
            "node_type": "Sahabi",
            "prominence": "SAHABI",
            "biography_short": f"Biographical info for {name}",
            "biography_source": "General History",
            "tribe": "Various",
            "clan": "Various",
            "birth_year_hijri": 0,
            "death_year_hijri": 60
        })

    # Add extra Sahabah up to ID 199
    for i in range(len(nodes), 200):
        nodes.append({
            "id": i,
            "name_ar": "", "name_en": f"Sahabi {i}", "kunyah": "", "laqab": "",
            "gender": "male",
            "is_prophet": "False",
            "node_type": "Sahabi",
            "prominence": "SAHABI",
            "biography_short": f"Biographical info for Sahabi {i}",
            "biography_source": "Unknown",
            "tribe": "Unknown",
            "clan": "Unknown",
            "birth_year_hijri": 0,
            "death_year_hijri": 60
        })

    # Add Battles starting from ID 1000
    battles = [
        {"id": 1000, "name_ar": "غزوة بدر", "name_en": "Battle of Badr", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "First major battle of Islam.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 2, "death_year_hijri": 2},
        {"id": 1001, "name_ar": "غزوة أحد", "name_en": "Battle of Uhud", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Second major battle of Islam.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 3, "death_year_hijri": 3},
        {"id": 1002, "name_ar": "غزوة الخندق", "name_en": "Battle of the Trench", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Defensive siege of Medina.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 5, "death_year_hijri": 5},
        {"id": 1003, "name_ar": "غزوة خيبر", "name_en": "Battle of Khaibar", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Battle against the Jewish fortresses.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 7, "death_year_hijri": 7},
        {"id": 1004, "name_ar": "غزوة مؤتة", "name_en": "Battle of Mu'tah", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "First battle against the Byzantines.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 8, "death_year_hijri": 8},
        {"id": 1005, "name_ar": "غزوة حنين", "name_en": "Battle of Hunayn", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Battle against the Hawazin and Thaqif.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 8, "death_year_hijri": 8},
        {"id": 1006, "name_ar": "معركة اليرموك", "name_en": "Battle of Yarmouk", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Major battle between the Muslims and the Byzantines.", "biography_source": "General History", "tribe": "", "clan": "", "birth_year_hijri": 13, "death_year_hijri": 13},
        {"id": 1007, "name_ar": "معركة القادسية", "name_en": "Battle of Qadisiyyah", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Major battle between the Muslims and the Sassanids.", "biography_source": "General History", "tribe": "", "clan": "", "birth_year_hijri": 15, "death_year_hijri": 15},
    ]
    nodes.extend(battles)

    # 2. Relationships
    # Types: PARENT_OF, SPOUSE_OF, SIBLING_OF, TEACHER_OF, PARTICIPATED_IN
    # Categories: family, mentorship, battles, others
    relationships = [
        {"source_id": 11, "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": 12, "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": 0, "target_id": 13, "type": "PARENT_OF", "category": "family"},
        {"source_id": 0, "target_id": 20, "type": "PARENT_OF", "category": "family"},
        {"source_id": 0, "target_id": 21, "type": "PARENT_OF", "category": "family"},
        {"source_id": 0, "target_id": 22, "type": "PARENT_OF", "category": "family"},

        {"source_id": 1, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 2, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 3, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 4, "target_id": 0, "type": "COUSIN_OF", "category": "family"},

        {"source_id": 16, "target_id": 0, "type": "UNCLE_OF", "category": "family"},
        {"source_id": 17, "target_id": 0, "type": "UNCLE_OF", "category": "family"},
        
        {"source_id": 4, "target_id": 14, "type": "PARENT_OF", "category": "family"},
        {"source_id": 4, "target_id": 15, "type": "PARENT_OF", "category": "family"},
        {"source_id": 13, "target_id": 14, "type": "PARENT_OF", "category": "family"},
        {"source_id": 13, "target_id": 15, "type": "PARENT_OF", "category": "family"},

        {"source_id": 1, "target_id": 12, "type": "PARENT_OF", "category": "family"},
        {"source_id": 21, "target_id": 3, "type": "SPOUSE_OF", "category": "family"}, # Ruqayya & Uthman
        {"source_id": 22, "target_id": 3, "type": "SPOUSE_OF", "category": "family"}, # Umm Kulthum & Uthman

        {"source_id": 14, "target_id": 15, "type": "SIBLING_OF", "category": "family"}, # Hasan & Husayn
        {"source_id": 0, "target_id": real_names.index("Abdullah ibn Abbas") + 23, "type": "TEACHER_OF", "category": "mentorship"}, # Prophet taught Ibn Abbas
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
    fieldnames = ["id", "name_ar", "name_en", "kunyah", "laqab", "gender", "is_prophet", "node_type", "prominence", "biography_short", "biography_source", "tribe", "clan", "birth_year_hijri", "death_year_hijri"]
    with open('data-pipeline/sahabah.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
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
