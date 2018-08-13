import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TextField } from 'material-ui';
import CustomTextField from '../components/CustomTextField';

describe('CustomTextField component', () => {
    const muiTheme = getMuiTheme();

    const getWrapper = props => (
        mount(<CustomTextField {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render a material-ui TextField component', () => {
        const wrapper = getWrapper({});
        expect(wrapper.find(TextField)).toHaveLength(1);
    });

    it('should show remaining characters when maxLength is present and input is focused', () => {
        const wrapper = getWrapper({ maxLength: 100 });
        wrapper.find('input').simulate('focus');
        expect(wrapper.find('.qa-CustomTextField-div-charsRemaining').text()).toEqual('100');
        wrapper.find('input').simulate('change', { target: { value: 'abc' } });
        expect(wrapper.find('.qa-CustomTextField-div-charsRemaining').text()).toEqual('97');
        wrapper.find('input').simulate('blur');
        expect(wrapper.find('.qa-CustomTextField-div-charsRemaining')).toHaveLength(0);
    });

    it('should show remaining characters in a warning color', () => {
        const wrapper = getWrapper({ maxLength: 11 });
        wrapper.find('input').simulate('focus');
        let charsRemaining = wrapper.find('.qa-CustomTextField-div-charsRemaining');
        expect(charsRemaining).toHaveLength(1);
        expect(charsRemaining.props().style.color).toEqual('#B4B7B8');
        wrapper.find('input').simulate('change', { target: { value: 'something' } });
        charsRemaining = wrapper.find('.qa-CustomTextField-div-charsRemaining');
        expect(charsRemaining.props().style.color).toEqual('#CE4427');
    });

    it('should not show remaining characters when showRemaining is false', () => {
        const wrapper = getWrapper({ maxLength: 100, showRemaining: false });
        const input = wrapper.find('input');
        const charsRemaining = wrapper.find('.qa-CustomTextField-div-charsRemaining');
        input.simulate('focus');
        expect(charsRemaining).toHaveLength(0);
    });

    it('onChange should call props.onChange and setState', () => {
        const props = { onChange: sinon.spy(), maxLength: 50 };
        const stateStub = sinon.stub(CustomTextField.prototype, 'setState');
        const wrapper = getWrapper(props);
        const e = { target: { value: 'text value' } };

        wrapper.instance().onChange(e, e.target.value);
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.calledWith(e, e.target.value)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ charsRemaining: props.maxLength - e.target.value.length })).toBe(true);
        stateStub.restore();
    });

    it('onFocus should call props.onFocus and setState', () => {
        const props = { onFocus: sinon.spy() };
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
        const props = { onBlur: sinon.spy() };
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
