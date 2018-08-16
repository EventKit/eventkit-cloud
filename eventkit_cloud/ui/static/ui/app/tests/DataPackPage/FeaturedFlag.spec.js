import React from 'react';
import { mount } from 'enzyme';
import FeaturedFlag from '../../components/DataPackPage/FeaturedFlag';

describe('FeaturedFlag component', () => {
    it('should render null if show is false', () => {
        const props = { show: false, style: {} };
        const wrapper = mount(<FeaturedFlag {...props} />);
        expect(wrapper.find('div')).toHaveLength(0);
        expect(wrapper.html()).toBe(null);
    });

    it('should render a div with text', () => {
        const props = { show: true, style: {} };
        const wrapper = mount(<FeaturedFlag {...props} />);
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('div').text()).toEqual('FEATURED');
        expect(wrapper.html()).not.toBe(null);
    });

    it('should apply passed in styles', () => {
        const props = { show: true, style: { color: 'red', width: 120 } };
        const wrapper = mount(<FeaturedFlag {...props} />);
        expect(wrapper.find('div').props().style.color).toEqual('red');
        expect(wrapper.find('div').props().style.width).toEqual(120);
    });
});
