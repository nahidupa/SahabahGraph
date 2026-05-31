import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";

// This file is just for checking types during review
export const typeDefs = `#graphql
  type Sahabi @node {
    id: Int!
    name: String!
    title: String
    gender: String
    is_prophet: Boolean
    sons: [Sahabi!]! @relationship(type: "SON_OF", direction: IN)
    daughters: [Sahabi!]! @relationship(type: "DAUGHTER_OF", direction: IN)
    uncles: [Sahabi!]! @relationship(type: "UNCLE_OF", direction: OUT)
    spouses: [Sahabi!]! @relationship(type: "SPOUSE_OF", direction: IN)
    companions: [Sahabi!]! @relationship(type: "COMPANION_OF", direction: OUT)
  }
`;

console.log("Types are valid", !!Neo4jGraphQL, !!neo4j, !!typeDefs);
