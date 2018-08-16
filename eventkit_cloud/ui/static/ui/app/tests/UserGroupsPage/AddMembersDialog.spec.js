import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Tabs, Tab } from 'material-ui/Tabs';
import Checked from '@material-ui/icons/CheckBox';
import Unchecked from '@material-ui/icons/CheckBoxOutlineBlank';
import Dialog from 'material-ui/Dialog';
import Indeterminate from '../../components/icons/IndeterminateIcon';
import * as viewport from '../../utils/viewport';
import CustomScrollbar from '../../components/CustomScrollbar';
import AddMembersDialog from '../../components/UserGroupsPage/Dialogs/AddMembersDialog';

describe('AddMembersDialog component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            show: true,
            onClose: () => {},
            onSave: () => {},
            groups: [
                { id: 0, name: '1', members: [] },
                { id: 1, name: '2', members: ['2'] },
                { id: 2, name: '3', members: ['1', '2', '3'] },
            ],
            selectedUsers: [
                { user: { username: '1' } },
                { user: { username: '2' } },
                { user: { username: '3' } },
            ],
        }
    );

    const getWrapper = props => (
        mount(<AddMembersDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    const getChildWrapper = child => (
        mount(child, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Dialog)).toHaveLength(1);
        const description = getChildWrapper(wrapper.find(Dialog).props().children[0]);
        expect(description.find('.qa-AddMembersDialog-description')).toHaveLength(1);
        const tab = getChildWrapper(wrapper.find(Dialog).props().children[1]);
        expect(tab.find(Tabs)).toHaveLength(1);
        expect(tab.find(Tab)).toHaveLength(2);
        expect(tab.find(CustomScrollbar)).toHaveLength(2);
        expect(tab.find('.qa-AddMembersDialog-unassignedRow')).toHaveLength(2);
        expect(tab.find('.qa-AddMembersDialog-assignedRow')).toHaveLength(1);
    });

    it('getInitialState should return the initial state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const state = wrapper.state();
        expect(wrapper.instance().getInitialState()).toEqual(state);
    });

    it('componentDidMount should add an event listener', () => {
        const props = getProps();
        const addStub = sinon.stub(window, 'addEventListener');
        const wrapper = getWrapper(props);
        expect(addStub.called).toBe(true);
        expect(addStub.calledWith('resize', wrapper.instance().handleResize)).toBe(true);
        addStub.restore();
    });

    it('componentWillUnmount should remove the event listener', () => {
        const props = getProps();
        const addStub = sinon.stub(window, 'addEventListener').returns(null);
        const removeStub = sinon.stub(window, 'removeEventListener');
        const wrapper = getWrapper(props);
        const resize = wrapper.instance().handleResize;
        wrapper.unmount();
        expect(removeStub.called).toBe(true);
        expect(removeStub.calledWith('resize', resize)).toBe(true);
        addStub.restore();
        removeStub.restore();
    });

    it('getUnassignedCheckbox should return Checked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ selection: [props.groups[0]] });
        const ret = wrapper.instance().getUnassignedCheckbox(props.groups[0]);
        expect(ret.type).toBe(Checked);
    });

    it('getUnassignedCheckbox should return Unchecked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const ret = wrapper.instance().getUnassignedCheckbox(props.groups[0]);
        expect(ret.type).toBe(Unchecked);
    });

    it('getHeaderCheckbox should return Checked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const { groupCount, selectedCount } = 20;
        const ret = wrapper.instance().getHeaderCheckbox(groupCount, selectedCount);
        expect(ret.type).toBe(Checked);
    });

    it('getHeaderCheckbox should return Indeterminate', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const selectedCount = 20;
        const groupCount = 30;
        const ret = wrapper.instance().getHeaderCheckbox(groupCount, selectedCount);
        expect(ret.type).toBe(Indeterminate);
    });

    it('getHeaderCheckbox should return Unchecked', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const selectedCount = 0;
        const groupCount = 20;
        const ret = wrapper.instance().getHeaderCheckbox(groupCount, selectedCount);
        expect(ret.type).toBe(Unchecked);
    });

    it('getGroupSplit should return separated assigned/unassigned groups', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const { groups, selectedUsers } = props;
        const expected = [[groups[0], groups[1]], [groups[2]]];
        const ret = wrapper.instance().getGroupSplit(groups, selectedUsers);
        expect(ret).toEqual(expected);
    });

    it('handleSave should set the intial state and call onSave', () => {
        const props = getProps();
        props.onSave = sinon.spy();
        const wrapper = getWrapper(props);
        const getStub = sinon.stub(wrapper.instance(), 'getInitialState').returns({});
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleSave();
        expect(getStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({})).toBe(true);
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(wrapper.state().selection, props.selectedUsers)).toBe(true);
    });

    it('handleClose should set the intial state and call onClose', () => {
        const props = getProps();
        props.onClose = sinon.spy();
        const wrapper = getWrapper(props);
        const getStub = sinon.stub(wrapper.instance(), 'getInitialState').returns({});
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleClose();
        expect(getStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({})).toBe(true);
        expect(props.onClose.calledOnce).toBe(true);
    });

    it('handleTabChange should setState', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleTabChange(0);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ tab: 0, search: '', sort: 'name' })).toBe(true);
    });

    it('handleCheck should add group to the selection state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.state().selection).toEqual([]);
        const group = { id: 1 };
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleCheck(group);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selection: [group] })).toBe(true);
    });

    it('handleUncheck should remove group from the selection state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const group = { id: 1 };
        wrapper.setState({ selection: [group] });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleUncheck(group);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selection: [] })).toBe(true);
    });

    it('handleSearchInput should setState with the value', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const e = { target: { value: 'search' } };
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleSearchInput(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ search: 'search' })).toBe(true);
    });

    it('handleSelectAll should search groups, get the split, and update state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ search: 'some search' });
        const searchStub = sinon.stub(wrapper.instance(), 'searchGroups').returns(props.groups);
        const splitStub = sinon.stub(wrapper.instance(), 'getGroupSplit').returns([props.groups, []]);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleSelectAll();
        expect(searchStub.calledOnce).toBe(true);
        expect(searchStub.calledWith(props.groups, 'some search')).toBe(true);
        expect(splitStub.calledOnce).toBe(true);
        expect(splitStub.calledWith(props.groups, props.selectedUsers)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selection: props.groups })).toBe(true);
    });

    it('handleDeselectAll should set selection to empty', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleDeselectAll();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selection: [] })).toBe(true);
    });

    it('handleResize should negate mobile state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ mobile: true });
        const viewStub = sinon.stub(viewport, 'isViewportS').returns(false);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleResize();
        expect(viewStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ mobile: false })).toBe(true);
    });

    it('searchGroups should filter groups by name', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const ret = wrapper.instance().searchGroups(props.groups, props.groups[0].name);
        expect(ret).toEqual([props.groups[0]]);
    });

    it('sortGroupNames should sort A-Z', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [
            { name: 'AAAC' },
            { name: 'AAAB' },
            { name: 'AAAA' },
        ];
        const expected = [
            { name: 'AAAA' },
            { name: 'AAAB' },
            { name: 'AAAC' },
        ];
        const sort = 'name';
        const ret = wrapper.instance().sortGroupNames(groups, sort);
        expect(ret).toEqual(expected);
    });

    it('sortGroupNames should sort Z-A', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [
            { name: 'AAAA' },
            { name: 'AAAB' },
            { name: 'AAAC' },
        ];
        const expected = [
            { name: 'AAAC' },
            { name: 'AAAB' },
            { name: 'AAAA' },
        ];
        const sort = '-name';
        const ret = wrapper.instance().sortGroupNames(groups, sort);
        expect(ret).toEqual(expected);
    });

    it('sortGroupSelect should sort by selected first', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [
            { name: 'AAAA', id: 1 },
            { name: 'AAAB', id: 2 },
            { name: 'AAAC', id: 3 },
        ];
        const sort = 'selected';
        const selection = [{ id: 3 }];
        const expected = [
            { name: 'AAAC', id: 3 },
            { name: 'AAAA', id: 1 },
            { name: 'AAAB', id: 2 },
        ];
        const ret = wrapper.instance().sortGroupSelected(groups, sort, selection);
        expect(ret).toEqual(expected);
    });

    it('sortGroupSelect should sort by selected last', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [
            { name: 'AAAA', id: 1 },
            { name: 'AAAB', id: 2 },
            { name: 'AAAC', id: 3 },
        ];
        const sort = '-selected';
        const selection = [{ id: 1 }];
        const expected = [
            { name: 'AAAB', id: 2 },
            { name: 'AAAC', id: 3 },
            { name: 'AAAA', id: 1 },
        ];
        const ret = wrapper.instance().sortGroupSelected(groups, sort, selection);
        expect(ret).toEqual(expected);
    });

    it('toggleSortName should reverse the sort value in state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ sort: 'name' });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleSortName();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: '-name' })).toBe(true);
    });

    it('toggleSortName should set the sort to name', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ sort: 'selected' });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleSortName();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: 'name' })).toBe(true);
    });

    it('toggleSortSelected should reverse the sort value in state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ sort: 'selected' });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleSortSelected();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: '-selected' })).toBe(true);
    });

    it('toggleSortSelected should set the sort to selected', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ sort: 'name' });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleSortSelected();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: 'selected' })).toBe(true);
    });
});
