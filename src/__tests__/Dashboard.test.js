import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../components/Dashboard';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

describe('Dashboard', () => {
  it('renders nothing if userData is missing', () => {
    const { container } = render(<Dashboard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing if userData.role is missing', () => {
    const { container } = render(<Dashboard userData={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correct actions for admin', () => {
    render(<Dashboard userData={{ role: 'admin' }} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Batches')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Manufacturing Plants')).toBeInTheDocument();
    expect(screen.getByText('Seller')).toBeInTheDocument();
    expect(screen.getByText('Seller Report')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders correct actions for master', () => {
    render(<Dashboard userData={{ role: 'master' }} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Batches')).toBeInTheDocument();
    expect(screen.getByText('Generate QR')).toBeInTheDocument();
    expect(screen.getByText('Manufacturing Plants')).toBeInTheDocument();
    expect(screen.getByText('Seller')).toBeInTheDocument();
    expect(screen.getByText('Seller Report')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders correct actions for plant_owner', () => {
    render(<Dashboard userData={{ role: 'plant_owner' }} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Batches')).toBeInTheDocument();
    expect(screen.getByText('Generate QR')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders correct actions for staff', () => {
    render(<Dashboard userData={{ role: 'staff' }} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Batches')).toBeInTheDocument();
    expect(screen.getByText('Generate QR')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders correct actions for salesman', () => {
    render(<Dashboard userData={{ role: 'salesman' }} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Seller')).toBeInTheDocument();
  });

  it('navigates to correct path on button click', () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
    render(<Dashboard userData={{ role: 'salesman' }} />);
    fireEvent.click(screen.getByText('Seller'));
    expect(mockNavigate).toHaveBeenCalledWith('/seller');
  });
});
