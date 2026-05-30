import csv
import os

def generate_sahabah():
    sahabah = [
        {"id": 1, "name": "Abu Bakr as-Siddiq", "title": "As-Siddiq", "birth_year": 573, "death_year": 634},
        {"id": 2, "name": "Umar ibn al-Khattab", "title": "Al-Faruq", "birth_year": 584, "death_year": 644},
        {"id": 3, "name": "Uthman ibn Affan", "title": "Dhun-Nurayn", "birth_year": 579, "death_year": 656},
        {"id": 4, "name": "Ali ibn Abi Talib", "title": "Asadullah", "birth_year": 599, "death_year": 661},
        {"id": 5, "name": "Khadija bint Khuwaylid", "title": "Mother of the Believers", "birth_year": 555, "death_year": 619},
        {"id": 6, "name": "Aisha bint Abi Bakr", "title": "Mother of the Believers", "birth_year": 613, "death_year": 678},
        {"id": 7, "name": "Fatima bint Muhammad", "title": "Az-Zahra", "birth_year": 605, "death_year": 632},
        {"id": 8, "name": "Khalid ibn al-Walid", "title": "Saifullah", "birth_year": 585, "death_year": 642},
    ]

    with open('sahabah.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "title", "birth_year", "death_year"])
        writer.writeheader()
        writer.writerows(sahabah)

def generate_relationships():
    relationships = [
        # Family relationships
        {"source_id": 6, "target_id": 1, "type": "CHILD_OF", "description": "Daughter"},
        {"source_id": 1, "target_id": 6, "type": "PARENT_OF", "description": "Father"},
        {"source_id": 4, "target_id": 7, "type": "SPOUSE_OF", "description": "Husband"},
        {"source_id": 7, "target_id": 4, "type": "SPOUSE_OF", "description": "Wife"},
        
        # Other Relationships
        {"source_id": 1, "target_id": 2, "type": "FRIEND_OF", "description": "Close Companions"},
        {"source_id": 2, "target_id": 1, "type": "FRIEND_OF", "description": "Close Companions"},
    ]

    with open('relationships.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["source_id", "target_id", "type", "description"])
        writer.writeheader()
        writer.writerows(relationships)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print("Generating sahabah.csv...")
    generate_sahabah()
    print("Generating relationships.csv...")
    generate_relationships()
    print("Mock data generated successfully.")
