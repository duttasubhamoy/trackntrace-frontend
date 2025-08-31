const axios = require('axios');
const axiosConfig = require('../utils/axiosConfig');

test('hello world!', () => {
	expect(1 + 1).toBe(2);
});

test('axios instance should be configured correctly', () => {
	const instance = axiosConfig();
	expect(instance.defaults.baseURL).toBe('http://localhost:3000'); // Adjust based on your config
	expect(instance.defaults.timeout).toBe(1000); // Adjust based on your config
});