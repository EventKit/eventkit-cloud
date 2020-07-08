import * as React from 'react';
import { shallow } from 'enzyme';
import { FeaturedFlag } from '../../components/DataPackPage/FeaturedFlag';

describe('FeaturedFlag component', () => {
    const props = { show: false, style: {}, ...(global as any).eventkit_test_props };
    it('should render null if show is false', () => {
        const wrapper = shallow(<FeaturedFlag {...props} />);
        expect(wrapper.find('div')).toHaveLength(0);
        expect(wrapper.html()).toBe(null);
    });

    it('should render a div with text', () => {
        props.show = true;
        const wrapper = shallow(<FeaturedFlag {...props} />);
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('div').text()).toEqual('FEATURED');
        expect(wrapper.html()).not.toBe(null);
    });

    it('should apply passed in styles', () => {
        props.show = true;
        props.style = { color: 'red', width: 120 };
        const wrapper = shallow(<FeaturedFlag {...props} />);
        expect(wrapper.find('div').props().style.color).toEqual('red');
        expect(wrapper.find('div').props().style.width).toEqual(120);
    });
});
