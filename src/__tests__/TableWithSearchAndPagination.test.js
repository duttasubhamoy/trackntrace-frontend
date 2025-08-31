import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TableWithSearchAndPagination from '../components/TableWithSearchAndPagination';

describe('TableWithSearchAndPagination', () => {
  it('renders table headers', () => {
    render(<TableWithSearchAndPagination columns={[{ Header: 'Name', accessor: 'name' }]} data={[]} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
