import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import PermissionsFilter from '../../components/DataPackPage/PermissionsFilter';

describe('PermissionsFilter component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            valueSelected: 'public',
            selectedGroups: ['group1'],
            onGroupSelect: () => {},
            onChange: () => {},
            groups: [
                { id: 'group1', name: 'group1', members: ['user1'] },
                { id: 'group1', name: 'group2', members: ['user2'] },
            ],
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
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).toEqual('public');
        expect(wrapper.find(RadioButton)).toHaveLength(3);
        expect(wrapper.find(RadioButton).at(0).text()).toEqual('Private (only me)');
        expect(wrapper.find(RadioButton).at(0).props().value).toEqual('private');
        expect(wrapper.find(RadioButton).at(1).text()).toEqual('Public (everyone)');
        expect(wrapper.find(RadioButton).at(1).props().value).toEqual('public');
        expect(wrapper.find(RadioButton).at(2).text()).toEqual('Group Shared (only)');
        expect(wrapper.find(RadioButton).at(2).props().value).toEqual('group');
    });

    it('should call onChange with "private"', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RadioButton).at(0).find('input[type="radio"]')
            .simulate('change', { target: { checked: true } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.args[0][1]).toEqual('private');
    });

    it('should call onChange with "public"', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RadioButton).at(1).find('input[type="radio"]')
            .simulate('change', { target: { checked: true } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.args[0][1]).toEqual('public');
    });

    it('should call onChange with "group"', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RadioButton).at(2).find('input[type="radio"]')
            .simulate('change', { target: { checked: true } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.args[0][1]).toEqual('group');
    });

    it('should set the selected value', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.valueSelected = 'group';
        wrapper.setProps(nextProps);
        expect(wrapper.find(RadioButtonGroup).props().valueSelected).toEqual('group');
    });

    it('should display the selected groups div and the selected count', () => {
        const props = getProps();
        props.valueSelected = 'group';
        props.selectedGroups = [];
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-PermissionsFilter-groups-button')).toHaveLength(1);
        let expectedText = 'No Groups';
        expect(wrapper.find('.qa-PermissionsFilter-groups-selection').text()).toEqual(expectedText);
        let nextProps = getProps();
        nextProps.selectedGroups = [nextProps.groups[0].id];
        nextProps.valueSelected = 'group';
        expectedText = '1 Group';
        wrapper.setProps(nextProps);
        expect(wrapper.find('.qa-PermissionsFilter-groups-selection').text()).toEqual(expectedText);
        nextProps = getProps();
        nextProps.valueSelected = 'group';
        nextProps.selectedGroups = nextProps.groups.map(group => group.id);
        expectedText = 'All Groups';
        wrapper.setProps(nextProps);
        expect(wrapper.find('.qa-PermissionsFilter-groups-selection').text()).toEqual(expectedText);
    });

    it('handleGroupsOpen should setState open and the popover target', () => {
        const props = getProps();
        const stateSpy = sinon.spy(PermissionsFilter.prototype, 'setState');
        const wrapper = getWrapper(props);
        const fakeEvent = {
            preventDefault: sinon.spy(),
            stopPropagation: sinon.spy(),
            currentTarget: null,
        };
        wrapper.instance().handleGroupsOpen(fakeEvent);
        expect(fakeEvent.preventDefault.calledOnce).toBe(true);
        expect(fakeEvent.stopPropagation.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: true, popoverAnchor: null })).toBe(true);
        stateSpy.restore();
    });

    it('handleGroupsClose should setState with open false', () => {
        const props = getProps();
        const stateSpy = sinon.spy(PermissionsFilter.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleGroupsClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: false })).toBe(true);
        stateSpy.restore();
    });
});
