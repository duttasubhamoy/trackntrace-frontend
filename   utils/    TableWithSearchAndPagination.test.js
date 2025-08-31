const assert = require('assert');
const TableWithSearchAndPagination = require('../components/TableWithSearchAndPagination');

describe('TableWithSearchAndPagination', () => {
    it('renders without crashing', () => {
        const component = shallow(<TableWithSearchAndPagination />);
        expect(component.exists()).toBe(true);
    });

    it('should paginate correctly', () => {
        const component = shallow(<TableWithSearchAndPagination data={mockData} />);
        component.instance().handlePageChange(2);
        expect(component.state('currentPage')).toBe(2);
    });

    it('should filter data based on search input', () => {
        const component = shallow(<TableWithSearchAndPagination data={mockData} />);
        component.instance().handleSearch('test');
        expect(component.state('filteredData')).toEqual(expectedFilteredData);
    });
});