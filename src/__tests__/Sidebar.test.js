import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '../components/Sidebar';

describe('Sidebar', () => {
  it('renders user name and role', () => {
    render(<Sidebar userData={{ name: 'Alice', role: 'admin' }} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
});
