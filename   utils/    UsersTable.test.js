const assert = require('assert');
const { render } = require('@testing-library/react');
const UsersTable = require('../components/UsersTable');

test('hello world!', () => {
	assert.strictEqual(1 + 1, 2);
});

test('renders UsersTable component', () => {
	const { getByText } = render(<UsersTable />);
	expect(getByText(/Users Table/i)).toBeInTheDocument();
});