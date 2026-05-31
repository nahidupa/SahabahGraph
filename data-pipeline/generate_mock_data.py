import csv
import json
import os

def main():
    # 1. Nodes
    nodes = [
        {"id": 0, "name": "Muhammad (PBUH)", "gender": "male", "is_prophet": "True", "type": "person", "title": "Rasulullah"},
        {"id": 1, "name": "Abu Bakr as-Siddiq", "gender": "male", "is_prophet": "False", "type": "person", "title": "As-Siddiq"},
        {"id": 2, "name": "Umar ibn al-Khattab", "gender": "male", "is_prophet": "False", "type": "person", "title": "Al-Faruq"},
        {"id": 3, "name": "Uthman ibn Affan", "gender": "male", "is_prophet": "False", "type": "person", "title": "Dhun-Nurayn"},
        {"id": 4, "name": "Ali ibn Abi Talib", "gender": "male", "is_prophet": "False", "type": "person", "title": "Asadullah"},
        {"id": 5, "name": "Talha ibn Ubaydullah", "gender": "male", "is_prophet": "False", "type": "person", "title": "Talhat al-Khayr"},
        {"id": 6, "name": "Zubayr ibn al-Awwam", "gender": "male", "is_prophet": "False", "type": "person", "title": "Hawari Rasulillah"},
        {"id": 7, "name": "Abdur Rahman ibn Awf", "gender": "male", "is_prophet": "False", "type": "person", "title": ""},
        {"id": 8, "name": "Sa'd ibn Abi Waqqas", "gender": "male", "is_prophet": "False", "type": "person", "title": ""},
        {"id": 9, "name": "Sa'id ibn Zayd", "gender": "male", "is_prophet": "False", "type": "person", "title": ""},
        {"id": 10, "name": "Abu Ubaydah ibn al-Jarrah", "gender": "male", "is_prophet": "False", "type": "person", "title": "Amin al-Ummah"},
        {"id": 11, "name": "Khadija bint Khuwaylid", "gender": "female", "is_prophet": "False", "type": "person", "title": "Tahira"},
        {"id": 12, "name": "Aisha bint Abi Bakr", "gender": "female", "is_prophet": "False", "type": "person", "title": "Siddiqa"},
        {"id": 13, "name": "Fatima bint Muhammad", "gender": "female", "is_prophet": "False", "type": "person", "title": "Az-Zahra"},
        {"id": 14, "name": "Hasan ibn Ali", "gender": "male", "is_prophet": "False", "type": "person", "title": ""},
        {"id": 15, "name": "Husayn ibn Ali", "gender": "male", "is_prophet": "False", "type": "person", "title": ""},
    ]

    # Battles (Event Nodes)
    battles = [
        {"id": 1000, "name": "Battle of Badr", "type": "event", "date": "624 CE"},
        {"id": 1001, "name": "Battle of Uhud", "type": "event", "date": "625 CE"},
        {"id": 1002, "name": "Battle of the Trench", "type": "event", "date": "627 CE"},
        {"id": 1003, "name": "Battle of Khaybar", "type": "event", "date": "628 CE"},
        {"id": 1004, "name": "Conquest of Mecca", "type": "event", "date": "630 CE"},
        {"id": 1005, "name": "Battle of Hunayn", "type": "event", "date": "630 CE"},
        {"id": 1006, "name": "Battle of Yarmouk", "type": "event", "date": "636 CE"},
        {"id": 1007, "name": "Battle of Qadisiyyah", "type": "event", "date": "636 CE"},
    ]

    for b in battles:
        nodes.append({**b, "gender": "n/a", "is_prophet": "False", "title": b["date"]})

    # More Sahabah
    real_names = [
        "Ja'far ibn Abi Talib", "Zayd ibn Harithah", "Usama ibn Zayd", "Abdullah ibn Umar",
        "Abdullah ibn Abbas", "Abdullah ibn Mas'ud", "Abu Hurairah", "Anas ibn Malik",
        "Jabir ibn Abdullah", "Abu Sa'id al-Khudri", "Mu'adh ibn Jabal", "Ubayy ibn Ka'b",
        "Zayd ibn Thabit", "Abu Dharr al-Ghifari", "Salman al-Farsi", "Ammar ibn Yasir",
        "Miqdad ibn Aswad", "Hudhayfa ibn al-Yaman", "Amr ibn al-Aas", "Muawiyah ibn Abi Sufyan",
    ]

    start_id = 20
    for i, name in enumerate(real_names):
        gender = "female" if any(x in name.lower() for x in ["bint", "umm"]) else "male"
        nodes.append({"id": start_id + i, "name": name, "gender": gender, "is_prophet": "False", "type": "person", "title": ""})

    for i in range(len(nodes), 500):
        nodes.append({"id": i, "name": f"Sahabi {i}", "gender": "male", "is_prophet": "False", "type": "person", "title": ""})

    # 2. Relationships
    relationships = [
        {"source_id": 11, "target_id": 0, "type": "SPOUSE_OF", "category": "others"},
        {"source_id": 12, "target_id": 0, "type": "SPOUSE_OF", "category": "others"},
        {"source_id": 13, "target_id": 0, "type": "DAUGHTER_OF", "category": "daughters"},
        {"source_id": 1, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 2, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 3, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 4, "target_id": 0, "type": "COUSIN_OF", "category": "others"},
        {"source_id": 14, "target_id": 4, "type": "SON_OF", "category": "sons"},
        {"source_id": 15, "target_id": 4, "type": "SON_OF", "category": "sons"},
        {"source_id": 14, "target_id": 13, "type": "SON_OF", "category": "sons"},
        {"source_id": 15, "target_id": 13, "type": "SON_OF", "category": "sons"},
        {"source_id": 12, "target_id": 1, "type": "DAUGHTER_OF", "category": "daughters"},
    ]

    # Participated in Battles
    # Badr (1000) participants
    badr_participants = [1, 2, 4, 8, 10, 16, 20, 21] # IDs might mismatch slightly, let's use fixed IDs
    # Prophet (0) was in most battles
    for b_id in [1000, 1001, 1002, 1003, 1004, 1005]:
        relationships.append({"source_id": 0, "target_id": b_id, "type": "PARTICIPATED_IN", "category": "events"})

    for p_id in [1, 2, 3, 4, 5, 6, 7, 8]:
        relationships.append({"source_id": p_id, "target_id": 1000, "type": "PARTICIPATED_IN", "category": "events"})
        relationships.append({"source_id": p_id, "target_id": 1001, "type": "PARTICIPATED_IN", "category": "events"})

    # Save to JSON
    data = {"nodes": nodes, "links": relationships}
    os.makedirs('frontend/public/data', exist_ok=True)
    with open('frontend/public/data/sahabah_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Generated {len(nodes)} nodes and {len(relationships)} relationships.")

if __name__ == "__main__":
    main()
