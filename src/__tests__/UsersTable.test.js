import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsersTable from '../components/UsersTable';

describe('UsersTable', () => {
  it('renders without crashing', () => {
    render(<UsersTable users={[]} />);
    expect(screen.getByTestId('users-table-root')).toBeInTheDocument();
  });
});
