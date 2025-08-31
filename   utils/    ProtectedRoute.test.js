const { render, screen } = require('@testing-library/react');
const ProtectedRoute = require('../components/ProtectedRoute');

test('hello world!', () => {
	render(<ProtectedRoute />);
	const linkElement = screen.getByText(/Protected Route/i);
	expect(linkElement).toBeInTheDocument();
});