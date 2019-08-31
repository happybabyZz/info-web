import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Link } from 'react-router-dom';
import { Button } from 'antd';

const UserButton: React.FC = () => {
  const { data } = useQuery<{ loggedIn: boolean }>(gql`
    {
      loggedIn @client
    }
  `);

  return data && data.loggedIn ? (
    <Button
      icon="user"
      href="https://eesast.com/profile"
      target="_blank"
      rel="noopener noreferrer"
    />
  ) : (
    <Link to="/login">
      <Button icon="user" />
    </Link>
  );
};

export default UserButton;
