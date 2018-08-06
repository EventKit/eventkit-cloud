import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import CheckBox from 'material-ui/Checkbox';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import ToggleCheckBox from '@material-ui/icons/CheckBox';
import ToggleCheckBoxOutlineBlank from '@material-ui/icons/CheckBoxOutlineBlank';
import HardwareKeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import HardwareKeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import CustomScrollbar from '../../components/CustomScrollbar';
import UserLicense from '../../components/AccountPage/UserLicense';

describe('User License component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => ({
        license: { slug: 'test-license', name: 'license name', text: 'license text' },
        checked: false,
        onCheck: () => {},
        disabled: false,
    });

    const getMountedWrapper = props => mount(<UserLicense {...props} />, {
        context: { muiTheme },
        childContextTypes: { muiTheme: PropTypes.object },
    });

    it('should render a minimized card with the license information', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardHeader).text()).toEqual('I agree to the license name');
        expect(wrapper.find(CheckBox)).toHaveLength(1);
        expect(wrapper.find(ToggleCheckBoxOutlineBlank)).toHaveLength(1);
        expect(wrapper.find(HardwareKeyboardArrowDown)).toHaveLength(1);
        expect(wrapper.find(CardText)).toHaveLength(0);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(0);
    });

    it('should expand the card on click', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(CardText)).toHaveLength(0);
        wrapper.find('button').simulate('click');
        expect(wrapper.find(CardText)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('a')).toHaveLength(1);
        expect(wrapper.find('a').props().href).toEqual('/api/licenses/test-license/download');
        expect(wrapper.find('a').text()).toEqual('- Download this license text -');
        expect(wrapper.find(CardText).text()).toEqual('- Download this license text -license text');
        expect(wrapper.find(HardwareKeyboardArrowUp)).toHaveLength(1);
    });

    it('should call onCheck function when checkbox is checked', () => {
        const props = getProps();
        props.onCheck = sinon.spy();
        const wrapper = getMountedWrapper(props);
        expect(props.onCheck.notCalled).toBe(true);
        wrapper.find(CheckBox).find('input').simulate('change');
        expect(props.onCheck.calledOnce).toBe(true);
    });

    it('should change icon when checked prop changes', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(ToggleCheckBoxOutlineBlank)).toHaveLength(1);
        const nextProps = getProps();
        nextProps.checked = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(ToggleCheckBox)).toHaveLength(1);
    });

    it('should make checkbox disabled', () => {
        const props = getProps();
        props.disabled = true;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(CheckBox).props().disabled).toBe(true);
    });
});
