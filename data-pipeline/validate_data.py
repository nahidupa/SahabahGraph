import json
import os

def validate_data():
    data_path = 'frontend/public/data/sahabah_data.json'
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    nodes = {node['id']: node for node in data['nodes']}
    links = data['links']
    errors = []

    for node_id, node in nodes.items():
        # Check birth before death
        if node.get('node_type') == 'Sahabi':
            birth = node.get('birth_year')
            death = node.get('death_year')
            if birth is not None and death is not None and birth > 0 and death > 0 and birth > death:
                errors.append(f"Inconsistency: {node['name']} (ID {node_id}) born in {birth} but died in {death}.")

    for link in links:
        source_id = link['source_id']
        target_id = link['target_id']
        rel_type = link['type']

        if source_id not in nodes or target_id not in nodes:
            errors.append(f"Broken link: {rel_type} from {source_id} to {target_id}")
            continue

        source = nodes[source_id]
        target = nodes[target_id]

        # Check child born after parent
        if rel_type in ['SON_OF', 'DAUGHTER_OF']:
            child_birth = source.get('birth_year')
            parent_birth = target.get('birth_year')
            if child_birth and parent_birth and child_birth > 0 and parent_birth > 0 and child_birth < parent_birth:
                 errors.append(f"Inconsistency: Child {source['name']} (born {child_birth}) born before parent {target['name']} (born {parent_birth}).")

        # Check gender consistency
        if rel_type == 'SON_OF' and source.get('gender') != 'male':
            errors.append(f"Gender mismatch: {source['name']} is {source.get('gender')} but has relationship SON_OF.")
        if rel_type == 'DAUGHTER_OF' and source.get('gender') != 'female':
            errors.append(f"Gender mismatch: {source['name']} is {source.get('gender')} but has relationship DAUGHTER_OF.")

    if errors:
        print("Validation failed with the following errors:")
        for error in errors:
            print(f"- {error}")
        return False
    else:
        print("Validation successful! No inconsistencies found.")
        return True

if __name__ == "__main__":
    validate_data()
