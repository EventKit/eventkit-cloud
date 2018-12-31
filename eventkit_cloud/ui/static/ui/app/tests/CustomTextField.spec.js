import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import TextField from '@material-ui/core/TextField';
import { CustomTextField } from '../components/common/CustomTextField';

describe('CustomTextField component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const props = { ...global.eventkit_test_props };

    const getWrapper = propz => (
        shallow(<CustomTextField {...propz} />)
    );

    it('should render a material-ui TextField component', () => {
        const wrapper = getWrapper(props);
        expect(wrapper.find(TextField)).toHaveLength(1);
    });

    it('should show remaining characters when maxLength is present and input is focused', () => {
        const wrapper = getWrapper({ ...props, maxLength: 100 });
        wrapper.find(TextField).simulate('focus');
        expect(wrapper.find('.qa-CustomTextField-div-charsRemaining').text()).toEqual('100');
        wrapper.find(TextField).simulate('change', { target: { value: 'abc' } });
        expect(wrapper.find('.qa-CustomTextField-div-charsRemaining').text()).toEqual('97');
        wrapper.find(TextField).simulate('blur');
        expect(wrapper.find('.qa-CustomTextField-div-charsRemaining')).toHaveLength(0);
    });

    it('should show remaining characters in a warning color', () => {
        const wrapper = getWrapper({ ...props, maxLength: 11 });
        wrapper.find(TextField).simulate('focus');
        let charsRemaining = wrapper.find('.qa-CustomTextField-div-charsRemaining');
        expect(charsRemaining).toHaveLength(1);
        expect(charsRemaining.props().style.color).toEqual('#707274');
        wrapper.find(TextField).simulate('change', { target: { value: 'something' } });
        charsRemaining = wrapper.find('.qa-CustomTextField-div-charsRemaining');
        expect(charsRemaining.props().style.color).toEqual('#ce4427');
    });

    it('should not show remaining characters when showRemaining is false', () => {
        const wrapper = getWrapper({ ...props, maxLength: 100, showRemaining: false });
        const charsRemaining = wrapper.find('.qa-CustomTextField-div-charsRemaining');
        wrapper.find(TextField).simulate('focus');
        expect(charsRemaining).toHaveLength(0);
    });

    it('onChange should call props.onChange and setState', () => {
        props.onChange = sinon.spy();
        props.maxLength = 50;
        const stateStub = sinon.stub(CustomTextField.prototype, 'setState');
        const wrapper = getWrapper(props);
        const e = { target: { value: 'text value' } };

        wrapper.instance().onChange(e);
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.calledWith(e)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ charsRemaining: props.maxLength - e.target.value.length })).toBe(true);
        stateStub.restore();
    });

    it('onFocus should call props.onFocus and setState', () => {
        props.onFocus = sinon.spy();
        const stateStub = sinon.stub(CustomTextField.prototype, 'setState');
        const wrapper = getWrapper(props);
        const e = { target: 'some target' };
        wrapper.instance().onFocus(e);
        expect(props.onFocus.calledOnce).toBe(true);
        expect(props.onFocus.calledWith(e)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ focused: true })).toBe(true);
        stateStub.restore();
    });

    it('onBlur should call props.onBlur and setState', () => {
        props.onBlur = sinon.spy();
        const stateStub = sinon.stub(CustomTextField.prototype, 'setState');
        const wrapper = getWrapper(props);
        const e = { target: 'some target' };
        wrapper.instance().onBlur(e);
        expect(props.onBlur.calledOnce).toBe(true);
        expect(props.onBlur.calledWith(e)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ focused: false })).toBe(true);
        stateStub.restore();
    });
});
