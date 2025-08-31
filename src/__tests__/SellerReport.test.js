import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SellerReport from '../components/SellerReport';

describe('SellerReport', () => {
  it('renders without crashing', () => {
    render(<SellerReport />);
    expect(screen.getByTestId('seller-report-root')).toBeInTheDocument();
  });
});
