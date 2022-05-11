import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { Scrollbars } from 'react-custom-scrollbars';
import CustomScrollbar from '../components/common/CustomScrollbar';

describe('Custom Scrollbar component', () => {
    it('should render a react-custom-scrollbar component with custom vertical thumb', () => {
        const wrapper = mount(<CustomScrollbar />);
        expect(wrapper.find(Scrollbars)).toHaveLength(1);
        expect(wrapper.find(Scrollbars).props().renderThumbVertical)
            .toEqual(wrapper.instance().renderThumb);
        const thumb = mount(wrapper.instance().renderThumb({}, {}));
        expect(thumb.find('div')).toHaveLength(1);
        expect(thumb.props().style).toEqual({
            backgroundColor: '#8A898B',
            opacity: '0.7',
            borderRadius: '5px',
            zIndex: 99,
        });
    });

    it('scrollToTop should call scrollToTop on the scrollbar', () => {
        const wrapper = mount(<CustomScrollbar />);
        const scrollSpy = sinon.spy();
        const scrollbar = { scrollToTop: scrollSpy };
        wrapper.instance().scrollbar = scrollbar;
        wrapper.instance().scrollToTop();
        expect(scrollSpy.calledOnce).toBe(true);
    });

    it('scrollToBottom should call scrollToBottom on the scrollbar', () => {
        const wrapper = mount(<CustomScrollbar />);
        const scrollSpy = sinon.spy();
        const scrollbar = { scrollToBottom: scrollSpy };
        wrapper.instance().scrollbar = scrollbar;
        wrapper.instance().scrollToBottom();
        expect(scrollSpy.calledOnce).toBe(true);
    });
});
