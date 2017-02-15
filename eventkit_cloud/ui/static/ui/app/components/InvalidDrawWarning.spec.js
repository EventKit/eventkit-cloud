import {InvalidDrawWarning} from './InvalidDrawWarning';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';

describe('InvalidDrawWarning component', () => {
    let props = {
        show: false,
        hideInvalidDrawWarning: () => {},
        showInvalidDrawWarning: () => {}
    };

    it('should always have a div and a span element', () => {
        const wrapper = mount(<InvalidDrawWarning {...props}/>);
        expect(wrapper.find('div')).to.have.length(1);
        expect(wrapper.find('span')).to.have.length(1);
        expect(wrapper.find('span').text()).to.equal(
            'You drew an invalid bounding box, please redraw.'
        );
    });

    it('should be hidden by default', () => {
        const wrapper = mount(<InvalidDrawWarning {...props}/>);
        expect(wrapper.find('div').hasClass('hidden')).to.equal(true);
    });

    it('should be visible when new props are passed in', () => {
        const wrapper = mount(<InvalidDrawWarning {...props}/>);
        expect(wrapper.find('div').hasClass('hidden')).to.equal(true);
        let newProps = props;
        newProps.show = true;
        wrapper.setProps(newProps);
        expect(wrapper.find('div').hasClass('visible')).to.equal(true);
    });
});
