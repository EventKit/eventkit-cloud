import * as React from 'react';
import { mount } from 'enzyme';
import * as sinon from 'sinon';
import Scrollbars from 'react-custom-scrollbars';
import CustomScrollbar from '../../components/common/CustomScrollbar';

describe('Custom Scrollbar component', () => {
    let wrapper;
    let instance;

    beforeEach(() => {
        wrapper = mount(<CustomScrollbar />);
        instance = wrapper.instance();
    });

    it('should render a react-custom-scrollbar component with custom vertical thumb', () => {
        expect(wrapper.find(Scrollbars)).toHaveLength(1);
        expect(wrapper.find(Scrollbars).props().renderThumbVertical)
            .toEqual(instance.renderThumb);
        const thumb = mount(instance.renderThumb({}, {}));
        expect(thumb.find('div')).toHaveLength(1);
        expect((thumb.props() as any).style).toEqual({
            backgroundColor: '#8A898B',
            opacity: '0.7',
            borderRadius: '5px',
            zIndex: 99,
        });
    });

    it('scrollToTop should call scrollToTop on the scrollbar', () => {
        const scrollSpy = sinon.spy();
        const scrollbar = { scrollToTop: scrollSpy };
        instance.scrollbar = scrollbar;
        instance.scrollToTop();
        expect(scrollSpy.calledOnce).toBe(true);
    });

    it('scrollToBottom should call scrollToBottom on the scrollbar', () => {
        const scrollSpy = sinon.spy();
        const scrollbar = { scrollToBottom: scrollSpy };
        instance.scrollbar = scrollbar;
        instance.scrollToBottom();
        expect(scrollSpy.calledOnce).toBe(true);
    });

    it('scrollToMiddle should call scrollTop with scrollHeight / 4', () => {
        const scrollSpy = sinon.spy();
        const scrollbar = { scrollTop: scrollSpy, getScrollHeight: () => (12) };
        instance.scrollbar = scrollbar;
        instance.scrollToMiddle();
        expect(scrollSpy.calledOnce).toBe(true);
        expect(scrollSpy.calledWith(3)).toBe(true);
    });
});
