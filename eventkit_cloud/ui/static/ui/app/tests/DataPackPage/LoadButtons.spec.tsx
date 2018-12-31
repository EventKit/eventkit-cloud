import * as React from 'react';
import * as sinon from 'sinon';
import { mount } from 'enzyme';
import Button from '@material-ui/core/Button';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import { LoadButtons } from '../../components/common/LoadButtons';

describe('LoadButtons component', () => {
    const getProps = () => ({
        range: '12/26',
        handleLoadLess: sinon.spy(),
        handleLoadMore: sinon.spy(),
        loadLessDisabled: true,
        loadMoreDisabled: false,
        classes: { root: {} },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = mount(<LoadButtons {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render all the basic components', () => {
        expect(wrapper.find(Button)).toHaveLength(2);
        expect(wrapper.find(Button).first().html()).toContain('Show Less');
        expect(wrapper.find(Button).last().html()).toContain('Show More');
        expect(wrapper.find(KeyboardArrowDown)).toHaveLength(1);
        expect(wrapper.find(KeyboardArrowUp)).toHaveLength(1);
        expect(wrapper.find('#range')).toHaveLength(1);
        expect(wrapper.find('#range').html()).toContain('12 of 26');
    });

    it('should enable or disable buttons based on props', () => {
        expect(wrapper.find(Button).first().props().disabled).toEqual(true);
        expect(wrapper.find(Button).last().props().disabled).toEqual(false);
    });

    it('Load less should call handleLoadLess', () => {
        setup({ loadLessDisabled: false });
        wrapper.find(Button).first().find('button').simulate('click');
        expect(props.handleLoadLess.calledOnce).toBe(true);
    });

    it('Load more should call handleLoadMore', () => {
        setup({ loadMoreDisabled: false });
        wrapper.find(Button).last().find('button').simulate('click');
        expect(props.handleLoadMore.calledOnce).toBe(true);
    });

    it('should set width in state on mount', () => {
        const updateStub = sinon.stub(LoadButtons.prototype, 'componentDidUpdate');
        const widthSpy = sinon.spy(LoadButtons.prototype, 'setWidth');
        setup();
        expect(widthSpy.calledOnce).toBe(true);
        widthSpy.restore();
        updateStub.restore();
    });

    it('should update width in state if component updates with new width', () => {
        const updateSpy = sinon.spy(instance, 'componentDidUpdate');
        const stateSpy = sinon.spy(instance, 'setState');
        const width = instance.self.current.clientWidth;
        wrapper.setState({ width: '100vw' });
        expect(stateSpy.calledWith({ width })).toBe(true);
        updateSpy.restore();
        stateSpy.restore();
    });
});
