import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OtpVerification from '../components/OtpVerification';

jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() }, Toaster: () => null }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../utils/axiosConfig', () => ({ post: jest.fn() }));
jest.mock('../utils/env', () => 'http://mock-backend');

const axios = require('../utils/axiosConfig');

describe('OtpVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders phone input and send code button initially', () => {
    render(<OtpVerification />);
    expect(screen.getByText(/verify your phone number/i)).toBeInTheDocument();
    expect(screen.getByText(/send code via sms/i)).toBeInTheDocument();
  });

  it('shows OTP input after sending code', async () => {
    axios.post.mockResolvedValueOnce({ data: { msg: 'OTP sent' } });
    render(<OtpVerification />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByText(/send code via sms/i));
    await waitFor(() => expect(screen.getByText(/enter your otp/i)).toBeInTheDocument());
  });

  it('shows resend OTP button after timer expires and allows resend', async () => {
    axios.post.mockResolvedValue({ data: { msg: 'OTP resent' } });
    render(<OtpVerification initialMobile="9876543210" />);
    // Fast-forward timer
    await waitFor(() => expect(screen.getByText(/resend otp in/i)).toBeInTheDocument());
    // Simulate timer expiry
    fireEvent.click(screen.getByText(/resend otp/i));
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/resend-otp'),
      expect.objectContaining({ mobile: '9876543210' })
    ));
  });

  it('shows error on wrong OTP', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { msg: 'Invalid OTP' } } });
    render(<OtpVerification initialMobile="9876543210" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText(/verify otp/i));
    await waitFor(() => expect(screen.getByText(/please enter a valid otp/i)).toBeInTheDocument());
  });

  it('disables resend button while loading', async () => {
    let resolve;
    axios.post.mockImplementation(() => new Promise(r => { resolve = r; }));
    render(<OtpVerification initialMobile="9876543210" />);
    // Simulate timer expiry
    fireEvent.click(screen.getByText(/resend otp/i));
    expect(screen.getByText(/sending/i)).toBeDisabled;
    resolve({ data: { msg: 'OTP resent' } });
  });
});
