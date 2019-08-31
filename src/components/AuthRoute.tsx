import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';

const AuthRoute: React.FC<RouteProps> = ({ children, ...rest }) => {
  const { data } = useQuery<{ loggedIn: boolean }>(gql`
    {
      loggedIn @client
    }
  `);

  return (
    <Route {...rest}>
      {data && data.loggedIn ? children : <Redirect to="/login" />}
    </Route>
  );
};

export default AuthRoute;
