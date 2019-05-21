import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Drawer from '@material-ui/core/Drawer';
import IconMenu from '../../components/common/IconMenu';
import { GroupsDrawer } from '../../components/UserGroupsPage/GroupsDrawer';

describe('GroupsDrawer component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        selectedValue: '',
        onSelectionChange: sinon.spy(),
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
        onNewGroupClick: sinon.spy(),
        onSharedInfoClick: sinon.spy(),
        onLeaveGroupClick: sinon.spy(),
        onDeleteGroupClick: sinon.spy(),
        onRenameGroupClick: sinon.spy(),
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<GroupsDrawer {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render something', () => {
        expect(wrapper.find(Drawer)).toHaveLength(1);
    });

    it('should show both MY GROUPS and SHARED GROUPS', () => {
        expect(wrapper.find('.qa-GroupsDrawer-sharedGroupItem')).toHaveLength(1);
        expect(wrapper.find('.qa-GroupsDrawer-groupItem')).toHaveLength(1);
    });

    it('Change Group Name should call onRenameGroupClick', () => {
        const item = wrapper.find('.qa-GroupsDrawer-groupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onRenameGroupClick.calledOnce).toBe(false);
        item.find(IconMenu).props().children[0].props.onClick();
        expect(props.onRenameGroupClick.calledOnce).toBe(true);
    });

    it('Delete Group Name should call onDeleteGroupClick', () => {
        const item = wrapper.find('.qa-GroupsDrawer-groupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onDeleteGroupClick.calledOnce).toBe(false);
        item.find(IconMenu).props().children[2].props.onClick();
        expect(props.onDeleteGroupClick.calledOnce).toBe(true);
    });

    it('clicking on indeterminate icon should call leave group', () => {
        const item = wrapper.find('.qa-GroupsDrawer-sharedGroupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onLeaveGroupClick.called).toBe(false);
        item.find(IconMenu).props().children[1].props.onClick();
        expect(props.onLeaveGroupClick.calledOnce).toBe(true);
        expect(props.onLeaveGroupClick.calledWith(props.sharedGroups[0])).toBe(true);
    });
});
