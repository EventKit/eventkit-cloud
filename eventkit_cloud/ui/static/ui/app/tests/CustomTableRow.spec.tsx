import { CustomTableRow } from '../components/common/CustomTableRow';
import { shallow } from 'enzyme';

describe('CustomTextField component', () => {

    const props = {
        title: 'test title',
        children: 'test data',
        classes: {},
        ...(global as any).eventkit_test_props,
    };

    const getWrapper = prop => (
        shallow(<CustomTableRow {...prop} />)
    );

    it('should render a title and data', () => {
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-CustomTableRow')).toHaveLength(1);
        expect(wrapper.find('.qa-CustomTableRow').find('div').at(1)
            .text()).toEqual('test title');
        expect(wrapper.find('.qa-CustomTableRow').find('div').at(2)
            .text()).toEqual('test data');
    });
});
