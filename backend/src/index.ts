import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv from 'dotenv';
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";

dotenv.config();

const driver = neo4j.driver(
    process.env.NEO4J_URI || "bolt://localhost:7687",
    neo4j.auth.basic(
        process.env.NEO4J_USER || "neo4j",
        process.env.NEO4J_PASSWORD || "password"
    )
);

const typeDefs = `#graphql
  type Sahabi @node {
    id: Int!
    name_ar: String
    name_en: String!
    kunyah: String
    laqab: String
    gender: String
    is_prophet: Boolean
    prominence: String
    biography_short: String
    biography_source: String
    tribe: String
    clan: String
    birth_year_hijri: Int
    death_year_hijri: Int

    # Flags
    has_parents: Boolean
    has_children: Boolean
    has_spouses: Boolean
    has_siblings: Boolean
    has_uncles: Boolean
    has_cousins: Boolean
    has_companions: Boolean
    has_teachers: Boolean
    has_students: Boolean
    has_battles: Boolean

    # Relationships
    parents: [Sahabi!]! @relationship(type: "PARENT_OF", direction: IN)
    children: [Sahabi!]! @relationship(type: "PARENT_OF", direction: OUT)
    uncles: [Sahabi!]! @relationship(type: "UNCLE_OF", direction: OUT)
    spouses: [Sahabi!]! @relationship(type: "SPOUSE_OF", direction: IN)
    companions: [Sahabi!]! @relationship(type: "COMPANION_OF", direction: OUT)
    cousins: [Sahabi!]! @relationship(type: "COUSIN_OF", direction: OUT)
    siblings: [Sahabi!]! @relationship(type: "SIBLING_OF", direction: OUT)
    students: [Sahabi!]! @relationship(type: "TEACHER_OF", direction: OUT)
    teachers: [Sahabi!]! @relationship(type: "TEACHER_OF", direction: IN)
    participatedIn: [Battle!]! @relationship(type: "PARTICIPATED_IN", direction: OUT)
  }

  type Battle @node {
    id: Int!
    name_ar: String
    name_en: String!
    prominence: String
    biography_short: String
    biography_source: String
    birth_year_hijri: Int # Used for the year
    has_participants: Boolean
    participants: [Sahabi!]! @relationship(type: "PARTICIPATED_IN", direction: IN)
  }
`;

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

async function startServer() {
    const port = Number(process.env.PORT) || 4000;

    const server = new ApolloServer({
        schema: await neoSchema.getSchema(),
    });

    const { url } = await startStandaloneServer(server, {
        listen: { port },
    });

    console.log(`🚀 Server ready at ${url}`);
}

startServer().catch((error) => {
    console.error('Failed to start server', error);
});
