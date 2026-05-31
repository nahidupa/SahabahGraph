import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider, ApolloLink, HttpLink, Observable } from '@apollo/client'
import App from './App.tsx'
import './index.css'

const graphqlUri = import.meta.env.VITE_GRAPHQL_URI;

// Keep the app deployable as pure static hosting when no backend URL is configured.
const staticFallbackLink = new ApolloLink(() => new Observable((observer) => {
  observer.next({ data: { sahabis: [] } });
  observer.complete();
}));

const client = new ApolloClient({
  link: graphqlUri ? new HttpLink({ uri: graphqlUri }) : staticFallbackLink,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
)
