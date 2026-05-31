import json
import os
import csv


def validate_graph_json() -> tuple[list[str], list[str]]:
    data_path = 'frontend/public/data/sahabah_data.json'
    errors: list[str] = []
    warnings: list[str] = []

    if not os.path.exists(data_path):
        warnings.append(f"Warning: {data_path} not found. Skipping graph JSON validation.")
        return errors, warnings

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    nodes = {node['id']: node for node in data['nodes']}
    links = data['links']

    for node_id, node in nodes.items():
        if node.get('node_type') == 'Sahabi':
            birth_raw = node.get('birth_year_hijri')
            death_raw = node.get('death_year_hijri')
            if birth_raw is not None and death_raw is not None:
                try:
                    birth = int(birth_raw)
                    death = int(death_raw)
                    if birth != 0 and death != 0 and birth > death:
                        errors.append(f"Inconsistency: {node['name_en']} (ID {node_id}) born in {birth} but died in {death}.")
                except (ValueError, TypeError):
                    pass

    for link in links:
        source_id = str(link['source_id'])
        target_id = str(link['target_id'])
        rel_type = link['type']

        if source_id not in nodes or target_id not in nodes:
            errors.append(f"Broken link: {rel_type} from {source_id} to {target_id}")
            continue

        source = nodes[source_id]
        target = nodes[target_id]

        if rel_type in ['SON_OF', 'DAUGHTER_OF', 'PARENT_OF']:
            if rel_type == 'PARENT_OF':
                parent_birth = source.get('birth_year_hijri')
                child_birth = target.get('birth_year_hijri')
            else:
                child_birth = source.get('birth_year_hijri')
                parent_birth = target.get('birth_year_hijri')

            if child_birth is not None and parent_birth is not None:
                try:
                    c_birth = int(child_birth)
                    p_birth = int(parent_birth)
                    if c_birth != 0 and p_birth != 0 and c_birth < p_birth:
                        errors.append(
                            f"Inconsistency: Child born before parent. Rel: {rel_type} source: {source['name_en']} "
                            f"(born {parent_birth}), target: {target['name_en']} "
                            f"(born {child_birth})."
                        )
                except (ValueError, TypeError):
                    pass

        if rel_type == 'SON_OF' and source.get('gender') != 'male':
            errors.append(f"Gender mismatch: {source['name_en']} is {source.get('gender')} but has relationship SON_OF.")
        if rel_type == 'DAUGHTER_OF' and source.get('gender') != 'female':
            errors.append(f"Gender mismatch: {source['name_en']} is {source.get('gender')} but has relationship DAUGHTER_OF.")

    return errors, warnings


def validate_political_csv() -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    sahabah_csv = 'data-pipeline/sahabah.csv'
    cities_csv = 'data-pipeline/cities.csv'
    terms_csv = 'data-pipeline/city_governor_terms.csv'

    if not all(os.path.exists(path) for path in [sahabah_csv, cities_csv, terms_csv]):
        warnings.append('Warning: political CSV files not complete. Skipping political validation.')
        return errors, warnings

    person_ids: set[int] = set()
    with open(sahabah_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                person_ids.add(int(row['id']))
            except (TypeError, ValueError):
                errors.append(f"Invalid person id in {sahabah_csv}: {row.get('id')}")

    city_ids: set[str] = set()
    with open(cities_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            city_id = (row.get('city_id') or '').strip()
            if not city_id:
                errors.append('cities.csv contains an empty city_id row.')
                continue
            city_ids.add(city_id)

    seen_terms: set[str] = set()
    with open(terms_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            term_id = (row.get('term_id') or '').strip()
            city_id = (row.get('city_id') or '').strip()

            if not term_id:
                errors.append('city_governor_terms.csv contains a row with empty term_id.')
                continue
            if term_id in seen_terms:
                errors.append(f'Duplicate term_id found: {term_id}')
            seen_terms.add(term_id)

            if city_id not in city_ids:
                errors.append(f"Term {term_id} references unknown city_id '{city_id}'.")

            for year_col in ['start_year_ce', 'end_year_ce', 'start_year_hijri', 'end_year_hijri']:
                year_raw = (row.get(year_col) or '').strip()
                if not year_raw:
                    errors.append(f"Term {term_id} missing {year_col}.")
                    continue
                try:
                    int(year_raw)
                except ValueError:
                    errors.append(f"Term {term_id} has non-numeric {year_col}: '{year_raw}'.")

            try:
                start_ce = int((row.get('start_year_ce') or '0').strip())
                end_ce = int((row.get('end_year_ce') or '0').strip())
                if end_ce < start_ce:
                    errors.append(f"Term {term_id} has end_year_ce < start_year_ce.")
            except ValueError:
                pass

            governor_id_raw = (row.get('governor_id') or '').strip()
            if governor_id_raw:
                try:
                    governor_id = int(governor_id_raw)
                    if governor_id not in person_ids:
                        errors.append(f"Term {term_id} governor_id {governor_id} does not exist in sahabah.csv.")
                except ValueError:
                    errors.append(f"Term {term_id} has invalid governor_id '{governor_id_raw}'.")

            caliph_id_raw = (row.get('caliph_id') or '').strip()
            if caliph_id_raw:
                try:
                    caliph_id = int(caliph_id_raw)
                    if caliph_id not in person_ids:
                        errors.append(f"Term {term_id} caliph_id {caliph_id} does not exist in sahabah.csv.")
                except ValueError:
                    errors.append(f"Term {term_id} has invalid caliph_id '{caliph_id_raw}'.")

    return errors, warnings


def validate_parent_relationships() -> tuple[list[str], list[str]]:
    """Validate that all required parent-child relationships exist.
    
    This ensures data integrity by verifying that documented family relationships
    (defined in PARENT_RELATIONSHIPS_SPEC.md) are maintained in the database.
    """
    errors: list[str] = []
    warnings: list[str] = []
    
    # Required parent-child relationships: (parent_id, child_id)
    required_relationships = {
        (0, 13), (0, 20), (0, 21), (0, 22),  # Muhammad's daughters
        (1, 12), (1, 75),                     # Abu Bakr's daughters
        (1024, 12), (1024, 75),               # Umm Ruman's daughters
        (4, 14), (4, 15),                     # Ali's sons (Hasan, Husayn)
        (1023, 4),                            # Abu Talib -> Ali
        (6, 117),                             # Zubayr -> Abdullah ibn al-Zubayr
        (17, 173),                            # Abbas -> Fadl
        (24, 25), (57, 25),                   # Zayd & Umm Ayman -> Usama
        (2, 26),                              # Umar -> Abdullah ibn Umar
        (17, 27), (84, 27),                   # Abbas & Umm al-Fadl -> Abdullah ibn Abbas
        (87, 42), (93, 42),                   # Hind & Abu Sufyan -> Muawiyah
        (16, 74),                             # Hamza -> Umamah
        (85, 118), (1, 118),                  # Asma & Abu Bakr -> Muhammad ibn Abi Bakr
        (23, 119), (85, 119),                 # Ja'far & Asma -> Abdullah ibn Ja'far
        (84, 173),                            # Umm al-Fadl -> Fadl
    }
    
    # Load relationships from CSV
    existing_relationships = set()
    try:
        with open('relationships.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    source_id = int(row['source_id'])
                    target_id = int(row['target_id'])
                    rel_type = row.get('type', '').strip()
                    
                    if rel_type == 'PARENT_OF':
                        existing_relationships.add((source_id, target_id))
                except (ValueError, TypeError):
                    pass
    except FileNotFoundError:
        warnings.append("Warning: relationships.csv not found. Skipping parent relationship validation.")
        return errors, warnings
    
    # Check for missing relationships
    missing_relationships = required_relationships - existing_relationships
    if missing_relationships:
        for parent_id, child_id in sorted(missing_relationships):
            errors.append(
                f"Missing parent relationship: {parent_id} (parent) -> {child_id} (child). "
                f"See PARENT_RELATIONSHIPS_SPEC.md for details."
            )
    
    # Load sahabah data to verify has_parents flag
    person_data = {}
    try:
        with open('sahabah.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                person_data[int(row['id'])] = row
    except FileNotFoundError:
        warnings.append("Warning: sahabah.csv not found. Skipping has_parents flag validation.")
        return errors, warnings
    
    # Check has_parents flag for all children with parents
    for parent_id, child_id in existing_relationships:
        if child_id in person_data:
            has_parents = person_data[child_id].get('has_parents', '').lower() == 'true'
            if not has_parents:
                person_name = person_data[child_id].get('name_en', f'ID {child_id}')
                errors.append(
                    f"Flag mismatch: {person_name} (ID {child_id}) has parent relationships "
                    f"but has_parents=False. Should be True."
                )
    
    return errors, warnings


def validate_data():
    graph_errors, graph_warnings = validate_graph_json()
    political_errors, political_warnings = validate_political_csv()
    parent_errors, parent_warnings = validate_parent_relationships()

    errors = graph_errors + political_errors + parent_errors
    warnings = graph_warnings + political_warnings + parent_warnings

    for warning in warnings:
        print(warning)

    if errors:
        print("Validation failed with the following errors:")
        for error in errors:
            print(f"- {error}")
        return False

    print("Validation successful! No inconsistencies found.")
    return True

if __name__ == "__main__":
    validate_data()
