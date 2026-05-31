import neo4j from 'neo4j-driver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const driver = neo4j.driver(
    process.env.NEO4J_URI || "bolt://localhost:7687",
    neo4j.auth.basic(
        process.env.NEO4J_USER || "neo4j",
        process.env.NEO4J_PASSWORD || "password"
    )
);

async function exportData() {
    const session = driver.session();
    try {
        const nodesResult = await session.run('MATCH (s:Sahabi) RETURN s');
        const nodes = nodesResult.records.map(record => {
            const node = record.get('s').properties;
            return {
                ...node,
                id: node.id.toInt ? node.id.toInt() : node.id,
                is_prophet: node.is_prophet ? "True" : "False"
            };
        });

        const linksResult = await session.run('MATCH (s)-[r]->(t) RETURN s.id AS source_id, t.id AS target_id, type(r) AS type, r.category AS category');
        const links = linksResult.records.map(record => ({
            source_id: record.get('source_id').toInt ? record.get('source_id').toInt() : record.get('source_id'),
            target_id: record.get('target_id').toInt ? record.get('target_id').toInt() : record.get('target_id'),
            type: record.get('type'),
            category: record.get('category')
        }));

        const data = { nodes, links };
        const outputPath = path.resolve(__dirname, '../../frontend/public/data/sahabah_data.json');

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log(`Successfully exported ${nodes.length} nodes and ${links.length} links to ${outputPath}`);
    } finally {
        await session.close();
        await driver.close();
    }
}

exportData().catch(console.error);
