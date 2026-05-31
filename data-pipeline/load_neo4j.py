import os
import csv
from neo4j import GraphDatabase

# Using environment variables or defaults
URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

def load_data():
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    with driver.session() as session:
        # 2. Constraints (Idempotency)
        print("Setting up constraints...")
        session.run("CREATE CONSTRAINT sahabah_id IF NOT EXISTS FOR (s:Sahabi) REQUIRE s.id IS UNIQUE")
        session.run("CREATE CONSTRAINT battle_id IF NOT EXISTS FOR (b:Battle) REQUIRE b.id IS UNIQUE")

        # 3. Load Nodes
        print("Loading nodes...")
        with open('sahabah.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                label = row.get('node_type', 'Sahabi')
                query = f"""
                    MERGE (n:{label} {{id: toInteger($id)}})
                    SET n.name = $name,
                        n.title = $title,
                        n.gender = $gender,
                        n.is_prophet = ($is_prophet = 'True')
                """
                session.run(
                    query,
                    id=row['id'],
                    name=row['name'],
                    title=row['title'],
                    gender=row['gender'],
                    is_prophet=row['is_prophet']
                )

        # 4. Load Relationships
        print("Loading relationships...")
        with open('relationships.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # We use a more generic match since source/target could be Sahabi or Battle
                query = f"""
                    MATCH (source {{id: toInteger($source_id)}})
                    MATCH (target {{id: toInteger($target_id)}})
                    MERGE (source)-[r:{row['type']} {{category: $category}}]->(target)
                """
                session.run(query, source_id=row['source_id'], target_id=row['target_id'], category=row['category'])

    driver.close()
    print("Data loaded into Neo4j successfully.")

if __name__ == "__main__":
    load_data()
