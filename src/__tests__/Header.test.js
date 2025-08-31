import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../components/Header';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../utils/axiosConfig', () => ({ post: jest.fn() }));

describe('Header', () => {
  const userData = {
    name: 'John Doe',
    lastLogin: '2025-07-31',
    role: 'admin',
    companyName: 'TestCo',
  };

  it('renders user info correctly for admin', () => {
    render(<Header userData={userData} />);
    expect(screen.getByText('Welcome,')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Last Login:')).toBeInTheDocument();
    expect(screen.getByText('2025-07-31')).toBeInTheDocument();
    expect(screen.getByText('Role:')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    // Company should be blank for admin
    expect(screen.getByText('Company:')).toBeInTheDocument();
  });

  it('renders company name for non-admin', () => {
    render(<Header userData={{ ...userData, role: 'staff', companyName: 'TestCo' }} />);
    expect(screen.getByText('TestCo')).toBeInTheDocument();
  });

  it('calls logout and navigates on logout button click', async () => {
    const mockNavigate = jest.fn();
    const mockPost = require('../utils/axiosConfig').post;
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    mockPost.mockResolvedValueOnce({});
    render(<Header userData={userData} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/logout'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });
});
