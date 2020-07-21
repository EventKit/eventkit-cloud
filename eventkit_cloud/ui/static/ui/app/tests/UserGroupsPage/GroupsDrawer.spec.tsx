import * as React from 'react';
import * as sinon from 'sinon';
import {GroupsDrawer} from "../../components/UserGroupsPage/GroupsDrawer";
import {Button, Drawer} from "@material-ui/core";
import {createShallow} from "@material-ui/core/test-utils";
import GroupPanelBody from "../../components/UserGroupsPage/GroupPanelBody";

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
        user: {},
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
        expect(wrapper.find(Button)).toHaveLength(2);
        expect(wrapper.find(GroupPanelBody)).toHaveLength(1);
    });
});
