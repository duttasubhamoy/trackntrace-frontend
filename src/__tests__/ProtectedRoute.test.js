import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { MemoryRouter } from 'react-router-dom';

describe('ProtectedRoute', () => {
  it('renders children if authenticated', () => {
    const Child = () => <div>Protected Content</div>;
    render(
      <MemoryRouter>
        <ProtectedRoute isAuthenticated={true}>
          <Child />
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(document.body.textContent).toContain('Protected Content');
  });
});
