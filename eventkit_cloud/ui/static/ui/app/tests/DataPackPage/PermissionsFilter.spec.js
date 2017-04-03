import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
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
        expect(wrapper.find('p').text()).to.equal('Permissions');
        expect(wrapper.find(RadioButtonGroup)).to.have.length(1);
        expect(wrapper.find(RadioButtonGroup).props().name).to.equal('permissions');
        expect(wrapper.find(RadioButtonGroup).props().onChange).to.equal(props.onChange);
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).to.equal(null);
        expect(wrapper.find(RadioButton)).to.have.length(2);
        expect(wrapper.find(RadioButton).first().text()).to.equal('Private');
        expect(wrapper.find(RadioButton).first().props().value).to.equal('Private');
        expect(wrapper.find(RadioButton).last().text()).to.equal('Public');
        expect(wrapper.find(RadioButton).last().props().value).to.equal('Public');
    });

    it('should call onChange with "Private"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<PermissionsFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(RadioButton).first().find('input[type="radio"]').simulate('change', {target: {checked: true}});
        expect(props.onChange.calledOnce).to.be.true;
        expect(props.onChange.args[0][1]).to.equal('Private');
    });

    it('should call onChange with "Public"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<PermissionsFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(RadioButton).last().find('input[type="radio"]').simulate('change', {target: {checked: true}});
        expect(props.onChange.calledOnce).to.be.true;
        expect(props.onChange.args[0][1]).to.equal('Public');
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
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).to.equal('Private');
    });
});
