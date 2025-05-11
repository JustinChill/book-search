console.log("%%%% EXECUTING LATEST SERVER.TS - VERSION XYZ %%%%"); // Add a very visible log
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url'; // Import fileURLToPath
import { ApolloServer } from 'apollo-server-express';
import db from './config/connection.js';
import { typeDefs, resolvers } from './schemas/index.js'; // Ensure this path is correct
import { authMiddleware } from './services/auth.js'; // Ensure this path is correct
// Removed duplicate: import type express from 'express'; 

// Recreate __dirname for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // Let TypeScript infer the type
const PORT = process.env.PORT || 3001;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
  cache: 'bounded', // Recommended for Apollo Server v3+ to prevent DoS
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist'))); // Adjusted for Vite build output
  app.get('*', (_req, res) => { // Prefixed req with an underscore
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const startApolloServer = async () => {
  await server.start();
  server.applyMiddleware({ app: app as any }); // Cast app to any to resolve type mismatch

  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`🌍 Now listening on localhost:${PORT}`);
      console.log(`🚀 GraphQL ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
  });
};

startApolloServer();
