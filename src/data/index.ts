import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { setContext } from 'apollo-link-context';
import axios from 'axios';

// axios.defaults.baseURL =
//   process.env.NODE_ENV === 'production'
//     ? 'https://api.eesast.com'
//     : 'http://localhost:28888';
axios.defaults.baseURL = 'https://api.eesast.com';
axios.defaults.headers.post['Content-Type'] = 'application/json';

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      Authorization: axios.defaults.headers['Authorization']
    }
  };
});

const httpLink = new HttpLink({
  uri: 'https://graphql.eesast.com/v1/graphql'
});

const wsLink = new WebSocketLink({
  uri: `wss://graphql.eesast.com/v1/graphql`,
  options: {
    lazy: true,
    reconnect: true,
    connectionParams: () => {
      return {
        headers: {
          Authorization: axios.defaults.headers['Authorization']
        }
      };
    }
  }
});

export const client = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    authLink.concat(httpLink)
  ),
  cache: new InMemoryCache()
});
