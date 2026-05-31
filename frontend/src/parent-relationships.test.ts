import { describe, it, expect } from 'vitest';
import sahabahData from '../public/data/sahabah_data.json';

describe('Parent Relationships Integrity', () => {
  const data = sahabahData as any;

  it('should have all required parent relationships in the graph', () => {
    const nodes = new Map(data.nodes.map((n: any) => [n.id, n]));
    const links = data.links;

    // All required parent-child relationships: (parent_id, child_id)
    const requiredParentRelationships = [
      { parent: '0', child: '13', parentName: 'Muhammad (PBUH)', childName: 'Fatima bint Muhammad' },
      { parent: '0', child: '20', parentName: 'Muhammad (PBUH)', childName: 'Zaynab bint Muhammad' },
      { parent: '0', child: '21', parentName: 'Muhammad (PBUH)', childName: 'Ruqayya bint Muhammad' },
      { parent: '0', child: '22', parentName: 'Muhammad (PBUH)', childName: 'Umm Kulthum bint Muhammad' },
      { parent: '1', child: '12', parentName: 'Abu Bakr as-Siddiq', childName: 'Aisha bint Abi Bakr' },
      { parent: '1', child: '75', parentName: 'Abu Bakr as-Siddiq', childName: 'Umm Kulthum bint Abi Bakr' },
      { parent: '1024', child: '12', parentName: 'Umm Ruman bint Amir', childName: 'Aisha bint Abi Bakr' },
      { parent: '1024', child: '75', parentName: 'Umm Ruman bint Amir', childName: 'Umm Kulthum bint Abi Bakr' },
      { parent: '4', child: '14', parentName: 'Ali ibn Abi Talib', childName: 'Hasan ibn Ali' },
      { parent: '4', child: '15', parentName: 'Ali ibn Abi Talib', childName: 'Husayn ibn Ali' },
      { parent: '1023', child: '4', parentName: 'Abu Talib ibn Abd al-Muttalib', childName: 'Ali ibn Abi Talib' },
      { parent: '6', child: '117', parentName: 'Zubayr ibn al-Awwam', childName: 'Abdullah ibn al-Zubayr' },
      { parent: '17', child: '173', parentName: 'Abbas ibn Abd al-Muttalib', childName: 'Fadl ibn Abbas' },
      { parent: '24', child: '25', parentName: 'Zayd ibn Harithah', childName: 'Usama ibn Zayd' },
      { parent: '57', child: '25', parentName: 'Umm Ayman', childName: 'Usama ibn Zayd' },
      { parent: '2', child: '26', parentName: 'Umar ibn al-Khattab', childName: 'Abdullah ibn Umar' },
      { parent: '17', child: '27', parentName: 'Abbas ibn Abd al-Muttalib', childName: 'Abdullah ibn Abbas' },
      { parent: '84', child: '27', parentName: 'Umm al-Fadl', childName: 'Abdullah ibn Abbas' },
      { parent: '87', child: '42', parentName: 'Hind bint Utba', childName: 'Muawiyah ibn Abi Sufyan' },
      { parent: '93', child: '42', parentName: 'Abu Sufyan ibn Harb', childName: 'Muawiyah ibn Abi Sufyan' },
      { parent: '16', child: '74', parentName: 'Hamza ibn Abd al-Muttalib', childName: 'Umamah bint Hamza' },
      { parent: '85', child: '118', parentName: 'Asma bint Umays', childName: 'Muhammad ibn Abi Bakr' },
      { parent: '1', child: '118', parentName: 'Abu Bakr as-Siddiq', childName: 'Muhammad ibn Abi Bakr' },
      { parent: '23', child: '119', parentName: 'Ja\'far ibn Abi Talib', childName: 'Abdullah ibn Ja\'far' },
      { parent: '85', child: '119', parentName: 'Asma bint Umays', childName: 'Abdullah ibn Ja\'far' },
      { parent: '84', child: '173', parentName: 'Umm al-Fadl', childName: 'Fadl ibn Abbas' },
    ];

    const missingRelationships: string[] = [];

    for (const rel of requiredParentRelationships) {
      const parentExists = nodes.has(rel.parent);
      const childExists = nodes.has(rel.child);

      if (!parentExists) {
        missingRelationships.push(`Missing parent node: ${rel.parent} (${rel.parentName})`);
        continue;
      }

      if (!childExists) {
        missingRelationships.push(`Missing child node: ${rel.child} (${rel.childName})`);
        continue;
      }

      const linkExists = links.some(
        (link: any) =>
          link.source === Number(rel.parent) &&
          link.target === Number(rel.child) &&
          link.type === 'PARENT_OF'
      );

      if (!linkExists) {
        missingRelationships.push(
          `Missing PARENT_OF link: ${rel.parentName} (${rel.parent}) → ${rel.childName} (${rel.child})`
        );
      }

      // Verify child has_parents flag is set correctly
      const child = nodes.get(rel.child) as any;
      if (child && !child.has_parents) {
        missingRelationships.push(
          `Flag mismatch: ${rel.childName} (${rel.child}) has parent relationships but has_parents=False`
        );
      }
    }

    if (missingRelationships.length > 0) {
      console.error('Parent Relationship Integrity Issues:');
      missingRelationships.forEach((msg) => console.error(`  - ${msg}`));
    }

    expect(missingRelationships).toHaveLength(0);
    expect(links.filter((l: any) => l.type === 'PARENT_OF').length).toBeGreaterThanOrEqual(24);
  });

  it('should not have duplicate parent relationships', () => {
    const parentLinks = data.links.filter((l: any) => l.type === 'PARENT_OF');
    const linkKeys = new Set<string>();
    const duplicates: string[] = [];

    for (const link of parentLinks) {
      const key = `${link.source}->${link.target}`;
      if (linkKeys.has(key)) {
        duplicates.push(key);
      }
      linkKeys.add(key);
    }

    if (duplicates.length > 0) {
      console.error('Duplicate parent relationships found:', duplicates);
    }

    expect(duplicates).toHaveLength(0);
  });

  it('should have valid parent-child relationship ages', () => {
    const nodes = new Map(data.nodes.map((n: any) => [n.id, n]));
    const parentLinks = data.links.filter((l: any) => l.type === 'PARENT_OF');

    const ageIssues: string[] = [];

    for (const link of parentLinks) {
      const parent = nodes.get(String(link.source)) as any;
      const child = nodes.get(String(link.target)) as any;

      if (!parent || !child) continue;

      const parentBirth = parseInt((parent.birth_year_hijri as any) || '0');
      const childBirth = parseInt((child.birth_year_hijri as any) || '0');

      // Skip if either is 0 (unknown birth year)
      if (parentBirth === 0 || childBirth === 0) continue;

      if (childBirth < parentBirth) {
        ageIssues.push(
          `Child ${child.name_en} born in ${childBirth} before parent ${parent.name_en} born in ${parentBirth}`
        );
      }
    }

    if (ageIssues.length > 0) {
      console.warn('Age-related issues in parent relationships:');
      ageIssues.forEach((msg) => console.warn(`  - ${msg}`));
    }

    expect(ageIssues).toHaveLength(0);
  });
});
