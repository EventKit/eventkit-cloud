import * as React from 'react';
import * as sinon from 'sinon';
import {GroupsDrawer} from "../../components/UserGroupsPage/GroupsDrawer";
import {Button, Drawer, Tab, Tabs} from "@material-ui/core";
import {createShallow} from "@material-ui/core/test-utils";
import IconMenu from "../../components/common/IconMenu";

describe('GroupsDrawer component', () => {
    let shallow: any;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        selectedValue: '',
        onSelectionChange: sinon.spy(),
        handleChange: sinon.spy(),
        makePartialGroupsRequest: sinon.spy(),
        getOneGroup: sinon.spy(),
        loadNext: sinon.spy(),
        loadPrevious: sinon.spy(),
        handlePage: sinon.spy(),
        open: true,
        nextPage: true,
        groups: {
            groups: [
                {
                    name: 'group1',
                    id: 1,
                    administrators: ['user_one'],
                    members: ['user_one', 'user_two'],
                },
                {
                    name: 'group2',
                    id: 2,
                    administrators: ['user_two'],
                    members: ['user_one', 'user_two'],
                },
                {
                    name: 'group3',
                    id: 3,
                    administrators: ['user_two'],
                    members: ['user_two'],
                },
            ],
            cancelSource: null,
            fetching: false,
            fetched: false,
            creating: false,
            created: false,
            deleting: false,
            deleted: false,
            updating: false,
            updated: false,
            error: null,
        },
        ownedGroups: [{
            id: 1,
            name: 'group1',
            members: ['user1', 'user2'],
            administrators: ['user1'],
        }],
        sharedGroups: [{
            id: 2,
            name: 'group2',
            members: ['user2', 'user1'],
            administrators: ['user2'],
        }],
        otherGroups: [{
            id: 3,
            name: 'group3',
            members: ['user3', 'user2'],
            administrators: ['user3'],
        }],
        usersCount: 2,
        onNewGroupClick: sinon.spy(),
        onSharedInfoClick: sinon.spy(),
        onLeaveGroupClick: sinon.spy(),
        onDeleteGroupClick: sinon.spy(),
        onRenameGroupClick: sinon.spy(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => shallow(<GroupsDrawer {...props}/>);

    it('should render something', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Drawer)).toHaveLength(1);
        expect(wrapper.find(Tabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(3);
        expect(wrapper.find(Button)).toHaveLength(2);
    });

    it('should default to show only MY GROUPS', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-GroupsDrawer-ownedGroupItem')).toHaveLength(1);
    });

    it('clicking on "Member" tab should fire handleChange to show Shared Groups', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const mockedEvent = sinon.spy();
        const mockCallBack = sinon.spy();
        const value = 'member';
        expect(wrapper
            .find(Tab)
            .at(0)
            .props().value)
            .toBe('admin');
        mockCallBack(mockedEvent, value);
        wrapper.find(Tab).at(0).simulate('change');
        expect(mockCallBack.calledOnce).toBe(true);
    });

    it('Change Group Name should call onRenameGroupClick', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const item = wrapper.find('.qa-GroupsDrawer-ownedGroupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onRenameGroupClick.calledOnce).toBe(false);
        item.find(IconMenu).props().children[0].props.onClick();
        expect(props.onRenameGroupClick.calledOnce).toBe(true);
    });

    it('Delete Group Name should call onDeleteGroupClick', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const item = wrapper.find('.qa-GroupsDrawer-ownedGroupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onDeleteGroupClick.calledOnce).toBe(false);
        item.find(IconMenu).props().children[2].props.onClick();
        expect(props.onDeleteGroupClick.calledOnce).toBe(true);
    });

    it('clicking on indeterminate icon should call leave group', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const item = wrapper.find('.qa-GroupsDrawer-ownedGroupItem');
        expect(item.find(IconMenu)).toHaveLength(1);
        expect(props.onLeaveGroupClick.called).toBe(false);
        item.find(IconMenu).props().children[1].props.onClick();
        expect(props.onLeaveGroupClick.calledOnce).toBe(true);
        expect(props.onLeaveGroupClick.calledWith(props.ownedGroups[0])).toBe(true);
    });
});
