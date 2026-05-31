"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// GraphQL schema definition
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;
// Resolvers define how to fetch the types defined in your schema
const resolvers = {
    Query: {
        hello: () => 'Hello from SahabahGraph Backend!',
    },
};
const server = new server_1.ApolloServer({
    typeDefs,
    resolvers,
});
async function startServer() {
    await server.start();
    app.use('/graphql', (0, cors_1.default)(), express_1.default.json(), (0, express4_1.expressMiddleware)(server));
    app.listen(port, () => {
        console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
    });
}
startServer().catch((error) => {
    console.error('Failed to start server', error);
});
//# sourceMappingURL=index.js.map