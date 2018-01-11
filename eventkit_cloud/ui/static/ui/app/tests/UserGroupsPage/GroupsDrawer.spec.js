import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Drawer from 'material-ui/Drawer';
import IndeterminateIcon from 'material-ui/svg-icons/toggle/indeterminate-check-box';
import { GroupsDrawer } from '../../components/UserGroupsPage/GroupsDrawer';

describe('GroupsDrawer component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const fakeGroups = [
        {
            id: '1',
            name: 'group1',
            members: ['user1', 'user2'],
            owners: ['user1'],
        },
        {
            id: '2',
            name: 'group2',
            members: ['user1', 'user2'],
            owners: ['user2'],
        },
    ];

    const getProps = () => (
        {
            selectedValue: '',
            onSelectionChange: () => {},
            open: true,
            groups: [...fakeGroups],
            user: { name: 'user1', username: 'user1' },
            usersCount: 2,
            onNewGroupClick: () => {},
            onSharedInfoClick: () => {},
            onLeaveGroupClick: () => {},
            onDeleteGroupClick: () => {},
        }
    );
    const getWrapper = props => (
        mount(<GroupsDrawer {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
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

    it('clicking on indeterminate icon should call delete group', () => {
        const props = getProps();
        props.onDeleteGroupClick = sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.onDeleteGroupClick.called).toBe(false);
        expect(wrapper.find('.qa-GroupsDrawer-groupItem')).toHaveLength(1);
        wrapper.find('.qa-GroupsDrawer-groupItem').find(IndeterminateIcon).simulate('click');
        expect(props.onDeleteGroupClick.calledOnce).toBe(true);
        expect(props.onDeleteGroupClick.calledWith(props.groups[0])).toBe(true);
    });

    it('clicking on indeterminate icon should call leave group', () => {
        const props = getProps();
        props.onLeaveGroupClick = sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.onLeaveGroupClick.called).toBe(false);
        expect(wrapper.find('.qa-GroupsDrawer-sharedGroupItem')).toHaveLength(1);
        wrapper.find('.qa-GroupsDrawer-sharedGroupItem').find(IndeterminateIcon).simulate('click');
        expect(props.onLeaveGroupClick.calledOnce).toBe(true);
        expect(props.onLeaveGroupClick.calledWith(props.groups[1])).toBe(true);
    });
});
