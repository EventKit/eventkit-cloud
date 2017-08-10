import {InvalidDrawWarning} from '../../components/MapTools/InvalidDrawWarning';
import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';

describe('InvalidDrawWarning component', () => {
    let props = {
        show: false,
    };

    it('should always have a div and a span element', () => {
        const wrapper = mount(<InvalidDrawWarning {...props}/>);
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('span')).toHaveLength(1);
        expect(wrapper.find('span').text()).toEqual(
            'You drew an invalid bounding box, please redraw.'
        );
    });

    it('should be hidden by default', () => {
        const wrapper = mount(<InvalidDrawWarning {...props}/>);
        expect(wrapper.find('div').props().style).toEqual({display: 'none'});
    });

    it('should be visible when new props are passed in', () => {
        const wrapper = mount(<InvalidDrawWarning {...props}/>);
        expect(wrapper.find('div').props().style).toEqual({display: 'none'});
        let newProps = props;
        newProps.show = true;
        wrapper.setProps(newProps);
        expect(wrapper.find('div').props().style).toEqual({display: 'initial'});
    });
});
