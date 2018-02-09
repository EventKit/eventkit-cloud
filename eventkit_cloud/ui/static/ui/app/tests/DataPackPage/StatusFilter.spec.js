import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Checkbox from 'material-ui/Checkbox';
import AlertError from 'material-ui/svg-icons/alert/error';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import StatusFilter from '../../components/DataPackPage/StatusFilter';
import isEqual from 'lodash/isEqual';

describe('StatusFilter component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            completed: false,
            incomplete: false,
            submitted: false,
            onChange: (e, v) => {}
        }
    }
    it('should have checkboxes and icons', () => {
        const props = getProps();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('p').first().text()).toEqual('Export Status');
        expect(wrapper.find(Checkbox)).toHaveLength(3);
        expect(wrapper.find(Checkbox).at(0).text()).toEqual('Complete');
        expect(wrapper.find(Checkbox).at(0).props().checked).toEqual(false);
        expect(wrapper.find(Checkbox).at(1).text()).toEqual('Running');
        expect(wrapper.find(Checkbox).at(1).props().checked).toEqual(false);
        expect(wrapper.find(Checkbox).at(2).text()).toEqual('Error');
        expect(wrapper.find(Checkbox).at(2).props().checked).toEqual(false);
        expect(wrapper.find(AlertError)).toHaveLength(1);
        expect(wrapper.find(NotificationSync)).toHaveLength(1);
        expect(wrapper.find(NavigationCheck)).toHaveLength(1);
        expect(wrapper.find('p')).toHaveLength(1);
    });

    it('should call onChange with "COMPLETED"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const input = wrapper.find(Checkbox).at(0).find('input');
        input.node.checked = true;
        input.simulate('change');
        expect(props.onChange.calledOnce).toBe(true);
        expect(isEqual(props.onChange.args[0][0], {completed: true})).toBe(true);
    });

    it('should call onChange with "INCOMPLETE"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const input = wrapper.find(Checkbox).at(2).find('input');
        input.node.checked = true;
        input.simulate('change');
        expect(props.onChange.calledOnce).toBe(true);
        expect(isEqual(props.onChange.args[0][0], {incomplete: true})).toBe(true);
    });

    it('should call onChange with "SUBMITTED"', () => {
        let props = getProps();
        props.onChange = new sinon.spy();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const input = wrapper.find(Checkbox).at(1).find('input');
        input.node.checked = true;
        input.simulate('change');
        expect(props.onChange.calledOnce).toBe(true);
        expect(isEqual(props.onChange.args[0][0], {submitted: true})).toBe(true);
    });

    it('should set Completed as checked', () => {
        const props = getProps();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const input = wrapper.find(Checkbox).at(0).find('input');
        expect(input.node.checked).toBe(false);
        let nextProps = getProps();
        nextProps.completed = true;
        wrapper.setProps(nextProps);
        expect(input.node.checked).toBe(true);
    });

    it('should set incomplete as checked', () => {
        const props = getProps();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const input = wrapper.find(Checkbox).at(2).find('input');
        expect(input.node.checked).toBe(false);
        let nextProps = getProps();
        nextProps.incomplete = true;
        wrapper.setProps(nextProps);
        expect(input.node.checked).toBe(true);
    });
    
    it('should set running as checked', () => {
        const props = getProps();
        const wrapper = mount(<StatusFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const input = wrapper.find(Checkbox).at(1).find('input');
        expect(input.node.checked).toBe(false);
        let nextProps = getProps();
        nextProps.submitted = true;
        wrapper.setProps(nextProps);
        expect(input.node.checked).toBe(true);
    });
});
