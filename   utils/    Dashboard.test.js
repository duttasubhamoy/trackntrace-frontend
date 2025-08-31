const { render, screen } = require('@testing-library/react');
const Dashboard = require('../components/Dashboard');

test('renders Dashboard component', () => {
    render(<Dashboard />);
    const linkElement = screen.getByText(/dashboard/i);
    expect(linkElement).toBeInTheDocument();
});