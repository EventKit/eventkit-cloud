import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPerson from 'material-ui/svg-icons/social/person';
import PermissionsFilter from '../../components/DataPackPage/PermissionsFilter';

describe('PermissionsFilter component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            valueSelected: null,
            onChange: () => {},
        }
    }

    it('should render a title and a RadioButtonGroup with 2 RadioButtons', () => {
        const props = getProps();
        const wrapper = mount(<PermissionsFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('p').text()).toEqual('Permissions');
        expect(wrapper.find(RadioButtonGroup)).toHaveLength(1);
        expect(wrapper.find(RadioButtonGroup).props().name).toEqual('permissions');
        expect(wrapper.find(RadioButtonGroup).props().onChange).toEqual(props.onChange);
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).toEqual(null);
        expect(wrapper.find(RadioButton)).toHaveLength(2);
        expect(wrapper.find(RadioButton).first().text()).toEqual('Private');
        expect(wrapper.find(RadioButton).first().props().value).toEqual('Private');
        expect(wrapper.find(RadioButton).last().text()).toEqual('Public');
        expect(wrapper.find(RadioButton).last().props().value).toEqual('Public');
    });

    it('should call onChange with "Private"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<PermissionsFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(RadioButton).first().find('input[type="radio"]').simulate('change', {target: {checked: true}});
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.args[0][1]).toEqual('Private');
    });

    it('should call onChange with "Public"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<PermissionsFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(RadioButton).last().find('input[type="radio"]').simulate('change', {target: {checked: true}});
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.args[0][1]).toEqual('Public');
    });

    it('should set the selected value', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<PermissionsFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.valueSelected = 'Private';
        wrapper.setProps(nextProps);
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).toEqual('Private');
    });
});
