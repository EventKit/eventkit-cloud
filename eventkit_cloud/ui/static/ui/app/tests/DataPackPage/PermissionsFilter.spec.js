import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import PermissionsFilter from '../../components/DataPackPage/PermissionsFilter';

describe('PermissionsFilter component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            valueSelected: null,
            onChange: () => {},
        }
    );

    const getWrapper = props => (
        mount(<PermissionsFilter {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        })
    );

    it('should render a title and a RadioButtonGroup with 3 RadioButtons', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('p').text()).toEqual('Permissions');
        expect(wrapper.find(RadioButtonGroup)).toHaveLength(1);
        expect(wrapper.find(RadioButtonGroup).props().name).toEqual('permissions');
        expect(wrapper.find(RadioButtonGroup).props().onChange).toEqual(props.onChange);
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).toEqual(null);
        expect(wrapper.find(RadioButton)).toHaveLength(2);
        expect(wrapper.find(RadioButton).at(0).text()).toEqual('Private');
        expect(wrapper.find(RadioButton).at(0).props().value).toEqual('False');
        expect(wrapper.find(RadioButton).at(1).text()).toEqual('Public');
        expect(wrapper.find(RadioButton).at(1).props().value).toEqual('True');
    });

    it('should call onChange with "Private"', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RadioButton).at(0).find('input[type="radio"]')
            .simulate('change', { target: { checked: true } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.args[0][1]).toEqual('False');
    });

    it('should call onChange with "Public"', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RadioButton).at(1).find('input[type="radio"]')
            .simulate('change', { target: { checked: true } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.args[0][1]).toEqual('True');
    });

    it('should set the selected value', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.valueSelected = 'False';
        wrapper.setProps(nextProps);
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).toEqual('False');
    });
});
