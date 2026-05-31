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
    name: String!
    title: String
    gender: String
    is_prophet: Boolean
    bio: String
    sons: [Sahabi!]! @relationship(type: "SON_OF", direction: IN)
    daughters: [Sahabi!]! @relationship(type: "DAUGHTER_OF", direction: IN)
    uncles: [Sahabi!]! @relationship(type: "UNCLE_OF", direction: OUT)
    spouses: [Sahabi!]! @relationship(type: "SPOUSE_OF", direction: IN)
    companions: [Sahabi!]! @relationship(type: "COMPANION_OF", direction: OUT)
    cousins: [Sahabi!]! @relationship(type: "COUSIN_OF", direction: OUT)
    siblings: [Sahabi!]! @relationship(type: "SIBLING_OF", direction: OUT)
    students: [Sahabi!]! @relationship(type: "TEACHER_OF", direction: OUT)
    teachers: [Sahabi!]! @relationship(type: "TEACHER_OF", direction: IN)
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
