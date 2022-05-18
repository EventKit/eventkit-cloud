import PropTypes from 'prop-types';
import { createShallow } from '@material-ui/core/test-utils';
import ActionRoom from '@material-ui/icons/Room';
import IrregularPolygon from '../../components/icons/IrregularPolygon';
import { TypeaheadMenuItem } from '../../components/MapTools/TypeaheadMenuItem';


describe('TypeaheadMenuItem component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        result: {},
        index: 1,
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    it('should return a MenuItem with proper child components', () => {
        const props = getProps();
        const wrapper = shallow(<TypeaheadMenuItem {...props} />);
        expect(wrapper.find('div')).toHaveLength(5);
        expect(wrapper.find('.menuItem')).toHaveLength(1);
        expect(wrapper.find('.qa-TypeaheadMenuItem-icon-div')).toHaveLength(1);
        expect(wrapper.find(ActionRoom)).toHaveLength(0);
        expect(wrapper.find('.qa-TypeaheadMenuItem-name')).toHaveLength(1);
        expect(wrapper.find('.qa-TypeaheadMenuItem-description')).toHaveLength(1);
        expect(wrapper.find('.qa-TypeaheadMenuItem-source')).toHaveLength(0);
    });

    it('should return a MenuItem with proper child components when source is present', () => {
        const props = getProps();
        const wrapper = shallow(<TypeaheadMenuItem {...props} {...{result: { source: 'source'}}} />);
        expect(wrapper.find('div')).toHaveLength(6);
        expect(wrapper.find('.qa-TypeaheadMenuItem-source')).toHaveLength(1);
    });

    it('should have the proper text and icon', () => {
        const props = getProps();
        props.result = { geometry: { type: 'Polygon' } };
        props.result.name = 'test name';
        props.result.context_name = 'province, region, country name';
        const wrapper = shallow(<TypeaheadMenuItem {...props} />);
        expect(wrapper.find(IrregularPolygon)).toHaveLength(1);
        expect(wrapper.find('.qa-TypeaheadMenuItem-name').text()).toEqual('test name');
        expect(wrapper.find('.qa-TypeaheadMenuItem-description').text()).toEqual('province, region, country name');
    });
});
