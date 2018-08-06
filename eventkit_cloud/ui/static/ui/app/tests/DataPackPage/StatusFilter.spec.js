import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Checkbox from 'material-ui/Checkbox';
import AlertError from '@material-ui/icons/Error';
import NotificationSync from '@material-ui/icons/Sync';
import NavigationCheck from '@material-ui/icons/Check';
import StatusFilter from '../../components/DataPackPage/StatusFilter';

describe('StatusFilter component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => ({
        completed: false,
        incomplete: false,
        submitted: false,
        onChange: () => {},
    });

    const getWrapper = props => (
        mount(<StatusFilter {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should have checkboxes and icons', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
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
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        const input = wrapper.find(Checkbox).at(0).find('input');
        input.simulate('change', { target: { checked: true } });
        wrapper.update();
        expect(props.onChange.calledOnce).toBe(true);
    });

    it('should call onChange with "INCOMPLETE"', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        const input = wrapper.find(Checkbox).at(2).find('input');
        input.simulate('change', { target: { checked: true } });
        wrapper.update();
        expect(props.onChange.calledOnce).toBe(true);
    });

    it('should call onChange with "SUBMITTED"', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        const input = wrapper.find(Checkbox).at(1).find('input');
        input.simulate('change', { target: { checked: true } });
        wrapper.update();
        expect(props.onChange.calledOnce).toBe(true);
    });

    it('should set Completed as checked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        let input = wrapper.find(Checkbox).at(0).find('input');
        expect(input.props().checked).toBe(false);
        const nextProps = getProps();
        nextProps.completed = true;
        wrapper.setProps(nextProps);
        input = wrapper.find(Checkbox).at(0).find('input');
        expect(input.props().checked).toBe(true);
    });

    it('should set incomplete as checked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        let input = wrapper.find(Checkbox).at(2).find('input');
        expect(input.props().checked).toBe(false);
        const nextProps = getProps();
        nextProps.incomplete = true;
        wrapper.setProps(nextProps);
        input = wrapper.find(Checkbox).at(2).find('input');
        expect(input.props().checked).toBe(true);
    });

    it('should set running as checked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        let input = wrapper.find(Checkbox).at(1).find('input');
        expect(input.props().checked).toBe(false);
        const nextProps = getProps();
        nextProps.submitted = true;
        wrapper.setProps(nextProps);
        input = wrapper.find(Checkbox).at(1).find('input');
        expect(input.props().checked).toBe(true);
    });
});
