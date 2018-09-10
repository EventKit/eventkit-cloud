import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Drawer from '@material-ui/core/Drawer';
import IconMenu from '../../components/common/IconMenu';
import { GroupsDrawer } from '../../components/UserGroupsPage/GroupsDrawer';


describe('GroupsDrawer component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => (
        {
            selectedValue: '',
            onSelectionChange: () => {},
            open: true,
            ownedGroups: [{
                id: 1,
                name: 'group1',
                members: ['user1', 'user2'],
                administrators: ['user1'],
            }],
            sharedGroups: [{
                id: 2,
                name: 'group2',
                members: ['user1', 'user2'],
                administrators: ['user2'],
            }],
            otherGroups: [{
                id: 3,
                name: 'group3',
                members: ['user2', 'user3'],
                administrators: ['user3'],
            }],
            usersCount: 2,
            onNewGroupClick: () => {},
            onSharedInfoClick: () => {},
            onLeaveGroupClick: () => {},
            onDeleteGroupClick: () => {},
            onRenameGroupClick: () => {},
            ...global.eventkit_test_props,
        }
    );
    const getWrapper = props => (
        shallow(<GroupsDrawer {...props} />)
    );

    it('should render something', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Drawer)).toHaveLength(1);
    });

    it('should show both MY GROUPS and SHARED GROUPS', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-GroupsDrawer-sharedGroupItem')).toHaveLength(1);
        expect(wrapper.find('.qa-GroupsDrawer-groupItem')).toHaveLength(1);
    });

    it('Change Group Name should call onRenameGroupClick', () => {
        const props = getProps();
        props.onRenameGroupClick = sinon.spy();
        const wrapper = getWrapper(props);
        const item = wrapper.find('.qa-GroupsDrawer-groupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onRenameGroupClick.calledOnce).toBe(false);
        item.find(IconMenu).props().children[0].props.onClick();
        expect(props.onRenameGroupClick.calledOnce).toBe(true);
    });

    it('Delete Group Name should call onDeleteGroupClick', () => {
        const props = getProps();
        props.onDeleteGroupClick = sinon.spy();
        const wrapper = getWrapper(props);
        const item = wrapper.find('.qa-GroupsDrawer-groupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onDeleteGroupClick.calledOnce).toBe(false);
        item.find(IconMenu).props().children[2].props.onClick();
        expect(props.onDeleteGroupClick.calledOnce).toBe(true);
    });

    it('clicking on indeterminate icon should call leave group', () => {
        const props = getProps();
        props.onLeaveGroupClick = sinon.spy();
        const wrapper = getWrapper(props);
        const item = wrapper.find('.qa-GroupsDrawer-sharedGroupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onLeaveGroupClick.called).toBe(false);
        item.find(IconMenu).props().children[1].props.onClick();
        expect(props.onLeaveGroupClick.calledOnce).toBe(true);
        expect(props.onLeaveGroupClick.calledWith(props.sharedGroups[0])).toBe(true);
    });
});
