import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrintQr from '../components/PrintQr';

describe('PrintQr', () => {
  it('renders without crashing with empty qrList', () => {
    render(<PrintQr qrList={[]} sendDataToParent={() => {}} />);
    expect(screen.getByTestId('print-qr-root')).toBeInTheDocument();
  });

  it('renders QR codes if qrList is provided', () => {
    const qrList = [
      { qr: 'qr1', id: 1 },
      { qr: 'qr2', id: 2 },
    ];
    render(<PrintQr qrList={qrList} sendDataToParent={() => {}} />);
    expect(screen.getAllByTestId('qr-code')).toHaveLength(2);
  });
});
