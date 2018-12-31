import * as React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import * as sinon from 'sinon';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Checked from '@material-ui/icons/CheckBox';
import Unchecked from '@material-ui/icons/CheckBoxOutlineBlank';
import Dialog from '@material-ui/core/Dialog';
import Indeterminate from '../../components/icons/IndeterminateIcon';
import CustomScrollbar from '../../components/CustomScrollbar';
import { AddMembersDialog } from '../../components/UserGroupsPage/Dialogs/AddMembersDialog';

describe('AddMembersDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        show: true,
        onClose: sinon.spy(),
        onSave: sinon.spy(),
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
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<AddMembersDialog {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find(Dialog)).toHaveLength(1);
        expect(wrapper.find('.qa-AddMembersDialog-description')).toHaveLength(1);
        expect(wrapper.find(Tabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(2);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('.qa-AddMembersDialog-unassignedRow')).toHaveLength(2);
        expect(wrapper.find('.qa-AddMembersDialog-assignedRow')).toHaveLength(0);
    });

    it('getInitialState should return the initial state', () => {
        const state = wrapper.state();
        expect(instance.getInitialState()).toEqual(state);
    });

    it('getUnassignedCheckbox should return Checked', () => {
        wrapper.setState({ selection: [props.groups[0]] });
        const ret = instance.getUnassignedCheckbox(props.groups[0]);
        expect(ret.type).toBe(Checked);
    });

    it('getUnassignedCheckbox should return Unchecked', () => {
        const ret = instance.getUnassignedCheckbox(props.groups[0]);
        expect(ret.type).toBe(Unchecked);
    });

    it('getHeaderCheckbox should return Checked', () => {
        const groupCount = 20;
        const selectedCount = 20;
        const ret = instance.getHeaderCheckbox(groupCount, selectedCount);
        expect(ret.type).toBe(Checked);
    });

    it('getHeaderCheckbox should return Indeterminate', () => {
        const selectedCount = 20;
        const groupCount = 30;
        const ret = instance.getHeaderCheckbox(groupCount, selectedCount);
        expect(ret.type).toBe(Indeterminate);
    });

    it('getHeaderCheckbox should return Unchecked', () => {
        const selectedCount = 0;
        const groupCount = 20;
        const ret = instance.getHeaderCheckbox(groupCount, selectedCount);
        expect(ret.type).toBe(Unchecked);
    });

    it('getGroupSplit should return separated assigned/unassigned groups', () => {
        const { groups, selectedUsers } = props;
        const expected = [[groups[0], groups[1]], [groups[2]]];
        const ret = instance.getGroupSplit(groups, selectedUsers);
        expect(ret).toEqual(expected);
    });

    it('handleSave should set the intial state and call onSave', () => {
        const getStub = sinon.stub(instance, 'getInitialState').returns({});
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleSave();
        expect(getStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({})).toBe(true);
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(wrapper.state().selection, props.selectedUsers)).toBe(true);
    });

    it('handleClose should set the intial state and call onClose', () => {
        const getStub = sinon.stub(instance, 'getInitialState').returns({});
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleClose();
        expect(getStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({})).toBe(true);
        expect(props.onClose.calledOnce).toBe(true);
    });

    it('handleTabChange should setState', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleTabChange({}, 0);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ tab: 0, search: '', sort: 'name' })).toBe(true);
    });

    it('handleCheck should add group to the selection state', () => {
        expect(wrapper.state().selection).toEqual([]);
        const group = { id: 1 };
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleCheck(group);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selection: [group] })).toBe(true);
    });

    it('handleUncheck should remove group from the selection state', () => {
        const group = { id: 1 };
        wrapper.setState({ selection: [group] });
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleUncheck(group);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selection: [] })).toBe(true);
    });

    it('handleSearchInput should setState with the value', () => {
        const e = { target: { value: 'search' } };
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleSearchInput(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ search: 'search' })).toBe(true);
    });

    it('handleSelectAll should search groups, get the split, and update state', () => {
        wrapper.setState({ search: 'some search' });
        const searchStub = sinon.stub(instance, 'searchGroups').returns(props.groups);
        const splitStub = sinon.stub(instance, 'getGroupSplit').returns([props.groups, []]);
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleSelectAll();
        expect(searchStub.calledOnce).toBe(true);
        expect(searchStub.calledWith(props.groups, 'some search')).toBe(true);
        expect(splitStub.calledOnce).toBe(true);
        expect(splitStub.calledWith(props.groups, props.selectedUsers)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selection: props.groups })).toBe(true);
    });

    it('handleDeselectAll should set selection to empty', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleDeselectAll();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selection: [] })).toBe(true);
    });

    it('searchGroups should filter groups by name', () => {
        const ret = instance.searchGroups(props.groups, props.groups[0].name);
        expect(ret).toEqual([props.groups[0]]);
    });

    it('sortGroupNames should sort A-Z', () => {
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
        const ret = instance.sortGroupNames(groups, sort);
        expect(ret).toEqual(expected);
    });

    it('sortGroupNames should sort Z-A', () => {
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
        const ret = instance.sortGroupNames(groups, sort);
        expect(ret).toEqual(expected);
    });

    it('sortGroupSelect should sort by selected first', () => {
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
        const ret = instance.sortGroupSelected(groups, sort, selection);
        expect(ret).toEqual(expected);
    });

    it('sortGroupSelect should sort by selected last', () => {
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
        const ret = instance.sortGroupSelected(groups, sort, selection);
        expect(ret).toEqual(expected);
    });

    it('toggleSortName should reverse the sort value in state', () => {
        wrapper.setState({ sort: 'name' });
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleSortName();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: '-name' })).toBe(true);
    });

    it('toggleSortName should set the sort to name', () => {
        wrapper.setState({ sort: 'selected' });
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleSortName();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: 'name' })).toBe(true);
    });

    it('toggleSortSelected should reverse the sort value in state', () => {
        wrapper.setState({ sort: 'selected' });
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleSortSelected();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: '-selected' })).toBe(true);
    });

    it('toggleSortSelected should set the sort to selected', () => {
        wrapper.setState({ sort: 'name' });
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleSortSelected();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: 'selected' })).toBe(true);
    });
});
