import { shallow } from 'enzyme';
import { InvalidDrawWarning } from '../../components/MapTools/InvalidDrawWarning';

describe('InvalidDrawWarning component', () => {

    const props = {
        show: false,
        ...global.eventkit_test_props,
    };

    it('should always have a div and a span element', () => {
        const wrapper = shallow(<InvalidDrawWarning {...props} />);
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('span')).toHaveLength(1);
        expect(wrapper.find('span').text()).toEqual('You drew an invalid bounding box, please redraw.');
    });

    it('should be hidden by default', () => {
        const wrapper = shallow(<InvalidDrawWarning {...props} />);
        expect(wrapper.find('div').props().style.display).toEqual('none');
    });

    it('should be visible when new props are passed in', () => {
        const wrapper = shallow(<InvalidDrawWarning {...props} />);
        expect(wrapper.find('div').props().style.display).toEqual('none');
        const newProps = props;
        newProps.show = true;
        wrapper.setProps(newProps);
        expect(wrapper.find('div').props().style.display).toEqual('initial');
    });
});
