const { render, screen } = require('@testing-library/react');
const Header = require('../components/Header');

test('renders Header component', () => {
    render(<Header />);
    const headerElement = screen.getByText(/header text/i);
    expect(headerElement).toBeInTheDocument();
});

test('Header component has interactive features', () => {
    render(<Header />);
    const buttonElement = screen.getByRole('button', { name: /button text/i });
    expect(buttonElement).toBeInTheDocument();
});