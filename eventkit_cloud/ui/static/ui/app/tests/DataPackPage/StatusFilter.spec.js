import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import ContentCreate from 'material-ui/svg-icons/content/create';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import StatusFilter from '../../components/DataPackPage/StatusFilter';

describe('StatusFilter component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            valueSelected: null,
            onChange: (e, v) => {}
        }
    }
    it('should have radio buttons and icons', () => {
        const props = getProps();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('p').first().text()).to.equal('Export Status');
        expect(wrapper.find(RadioButtonGroup)).to.have.length(1);
        expect(wrapper.find(RadioButtonGroup).props().name).to.equal('status');
        expect(wrapper.find(RadioButtonGroup).props().onChange).to.equal(props.onChange);
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).to.equal(props.valueSelected);
        expect(wrapper.find(RadioButton)).to.have.length(3);
        expect(wrapper.find(RadioButton).at(0).text()).to.equal('Complete');
        expect(wrapper.find(RadioButton).at(0).props().value).to.equal('COMPLETED');
        expect(wrapper.find(RadioButton).at(1).text()).to.equal('Incomplete');
        expect(wrapper.find(RadioButton).at(1).props().value).to.equal('INCOMPLETE');
        expect(wrapper.find(RadioButton).at(2).text()).to.equal('Running');
        expect(wrapper.find(RadioButton).at(2).props().value).to.equal('SUBMITTED');
        expect(wrapper.find(ContentCreate)).to.have.length(1);
        expect(wrapper.find(NotificationSync)).to.have.length(1);
        expect(wrapper.find('p')).to.have.length(2);
    });

    it('should call onChange with "COMPLETED"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(RadioButton).at(0).find('input[type="radio"]').simulate('change', {target: {checked: true}});
        expect(props.onChange.calledOnce).to.be.true;
        expect(props.onChange.args[0][1]).to.equal('COMPLETED');
    });

    it('should call onChange with "INCOMPLETE"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(RadioButton).at(1).find('input[type="radio"]').simulate('change', {target: {checked: true}});
        expect(props.onChange.calledOnce).to.be.true;
        expect(props.onChange.args[0][1]).to.equal('INCOMPLETE');
    });

    it('should call onChange with "SUBMITTED"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(RadioButton).at(2).find('input[type="radio"]').simulate('change', {target: {checked: true}});
        expect(props.onChange.calledOnce).to.be.true;
        expect(props.onChange.args[0][1]).to.equal('SUBMITTED');
    });

    it('should set the selectedValue', () => {
        let props = getProps();
        props.valueSelected = 'COMPLETED';
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).to.equal('COMPLETED');
    });
});
