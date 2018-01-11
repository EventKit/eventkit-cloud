import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {
    Table,
    TableBody,
    TableHeader,
    TableRow,
} from 'material-ui/Table';
import MenuIcon from 'material-ui/svg-icons/navigation/menu';
import Warning from 'material-ui/svg-icons/alert/warning';
import InfoIcon from 'material-ui/svg-icons/action/info-outline';
import ArrowLeft from 'material-ui/svg-icons/hardware/keyboard-arrow-left';
import ArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import CircularProgress from 'material-ui/CircularProgress';
import CustomScrollbar from '../../components/CustomScrollbar';
import UserTableRowColumn from '../../components/UserGroupsPage/UserTableRowColumn';
import UserTableHeaderColum from '../../components/UserGroupsPage/UserTableHeaderColumn';
import GroupsDrawer from '../../components/UserGroupsPage/GroupsDrawer';
import CreateGroupDialog from '../../components/UserGroupsPage/CreateGroupDialog';
import LeaveGroupDialog from '../../components/UserGroupsPage/LeaveGroupDialog';
import DeleteGroupDialog from '../../components/UserGroupsPage/DeleteGroupDialog';
import BaseDialog from '../../components/BaseDialog';
import {
    getGroups,
    deleteGroup,
    createGroup,
    addGroupUsers,
    removeGroupUsers,
} from '../../actions/userGroupsActions';
import { getUsers } from '../../actions/userActions';
import { UserGroupsPage } from '../../components/UserGroupsPage/UserGroupsPage';
import { UserTableHeaderColumn } from '../../components/UserGroupsPage/UserTableHeaderColumn';

describe('UserGroupsPage component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            user: { data: { user: { username: 'user1', email: 'user1@users.com' } } },
            groups: {
                groups: [
                    { name: 'group1', id: 'group1' },
                    { name: 'group2', id: 'group2' },
                ],
                cancelSource: null,
                fetching: false,
                fetched: false,
                creating: false,
                created: false,
                deleting: false,
                deleted: false,
                adding: false,
                added: false,
                removing: false,
                removed: false,
                error: null,
            },
            users: {
                users: [
                    { name: 'user1', username: 'user1' },
                    { name: 'user2', username: 'user2' },
                ],
                fetching: false,
                fetched: false,
                error: null,
                total: 0,
            },
            getGroups: () => {},
            deleteGroup: () => {},
            createGroup: () => {},
            addUsers: () => {},
            removeUsers: () => {},
            getUsers: () => {},
        }
    );

    const getWrapper = props => (
        mount(<UserGroupsPage {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render its basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserGroupsPage-AppBar')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-RaisedButton-create')).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-search')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-headerTable')).toHaveLength(1);
        expect(wrapper.find(UserTableHeaderColumn)).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-bodyTable')).toHaveLength(1);
        expect(wrapper.find(UserTableRowColumn)).toHaveLength(2);
        expect(wrapper.find('.qa-UserGroupsPage-drawer')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-createGroupDialog')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-leaveGroupDialog')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-DeleteGroupDialog')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-errorDialog')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-sharedInfo')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroups-pageInfo')).toHaveLength(1);
    });
});
