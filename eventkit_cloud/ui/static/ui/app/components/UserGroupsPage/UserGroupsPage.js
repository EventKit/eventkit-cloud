import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import Joyride from 'react-joyride';
import Help from 'material-ui/svg-icons/action/help';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import TextField from 'material-ui/TextField';
import Warning from 'material-ui/svg-icons/alert/warning';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import CircularProgress from 'material-ui/CircularProgress';
import CustomScrollbar from '../CustomScrollbar';
import UserRow from './UserRow';
import OwnUserRow from './OwnUserRow';
import UserHeader from './UserHeader';
import GroupsDrawer from './GroupsDrawer';
import CreateGroupDialog from './Dialogs/CreateGroupDialog';
import LeaveGroupDialog from './Dialogs/LeaveGroupDialog';
import DeleteGroupDialog from './Dialogs/DeleteGroupDialog';
import RenameGroupDialog from './Dialogs/RenameGroupDialog';
import AdministratorInfoDialog from './Dialogs/AdministratorInfoDialog';
import MemberInfoDialog from './Dialogs/MemberInfoDialog';
import OtherInfoDialog from './Dialogs/OtherInfoDialog';
import AddMembersDialog from './Dialogs/AddMembersDialog';
import BaseDialog from '../Dialog/BaseDialog';
import { getGroups, deleteGroup, createGroup, updateGroup } from '../../actions/userGroupsActions';
import { getUsers } from '../../actions/userActions';
import { DrawerTimeout } from '../../actions/exportsActions';
import { isViewportXS, isViewportS } from '../../utils/viewport';
import { joyride } from '../../joyride.config';

export class UserGroupsPage extends Component {
    constructor(props) {
        super(props);
        this.getQueryGroup = this.getQueryGroup.bind(this);
        this.getGroupTitle = this.getGroupTitle.bind(this);
        this.makeUserRequest = this.makeUserRequest.bind(this);
        this.toggleDrawer = this.toggleDrawer.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleSearchKeyDown = this.handleSearchKeyDown.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleOrderingChange = this.handleOrderingChange.bind(this);
        this.handleCreateOpen = this.handleCreateOpen.bind(this);
        this.handleCreateClose = this.handleCreateClose.bind(this);
        this.handleCreateInput = this.handleCreateInput.bind(this);
        this.handleCreateSave = this.handleCreateSave.bind(this);
        this.handleRenameOpen = this.handleRenameOpen.bind(this);
        this.handleRenameClose = this.handleRenameClose.bind(this);
        this.handleRenameInput = this.handleRenameInput.bind(this);
        this.handleRenameSave = this.handleRenameSave.bind(this);
        this.handleNewGroup = this.handleNewGroup.bind(this);
        this.handleAddUsers = this.handleAddUsers.bind(this);
        this.handleLeaveGroupClick = this.handleLeaveGroupClick.bind(this);
        this.handleDeleteGroupClick = this.handleDeleteGroupClick.bind(this);
        this.handleLeaveOpen = this.handleLeaveOpen.bind(this);
        this.handleLeaveClose = this.handleLeaveClose.bind(this);
        this.handleLeaveClick = this.handleLeaveClick.bind(this);
        this.handleDeleteOpen = this.handleDeleteOpen.bind(this);
        this.handleDeleteClose = this.handleDeleteClose.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
        this.handleDrawerSelectionChange = this.handleDrawerSelectionChange.bind(this);
        this.handleMakeAdmin = this.handleMakeAdmin.bind(this);
        this.handleDemoteAdmin = this.handleDemoteAdmin.bind(this);
        this.handleRemoveUser = this.handleRemoveUser.bind(this);
        this.handleBatchRemoveUser = this.handleBatchRemoveUser.bind(this);
        this.handleBatchAdminRights = this.handleBatchAdminRights.bind(this);
        this.handleAddUsersSave = this.handleAddUsersSave.bind(this);
        this.handleUserSelect = this.handleUserSelect.bind(this);
        this.showAddUsersDialog = this.showAddUsersDialog.bind(this);
        this.hideAddUsersDialog = this.hideAddUsersDialog.bind(this);
        this.showErrorDialog = this.showErrorDialog.bind(this);
        this.hideErrorDialog = this.hideErrorDialog.bind(this);
        this.callback = this.callback.bind(this);
        this.showAdministratorInfoDialog = this.showAdministratorInfoDialog.bind(this);
        this.hideAdministratorInfoDialog = this.hideAdministratorInfoDialog.bind(this);
        this.showMemberInfoDialog = this.showMemberInfoDialog.bind(this);
        this.hideMemberInfoDialog = this.hideMemberInfoDialog.bind(this);
        this.showOtherInfoDialog = this.showOtherInfoDialog.bind(this);
        this.hideOtherInfoDialog = this.hideOtherInfoDialog.bind(this);
        this.handleJoyride = this.handleJoyride.bind(this);
        this.state = {
            drawerOpen: !(isViewportS()),
            selectedUsers: [],
            showAddUsers: false,
            showCreate: false,
            showLeave: false,
            showDelete: false,
            showRename: false,
            targetGroup: null,
            createInput: '',
            createUsers: [],
            addUsers: [],
            renameInput: '',
            errors: [],
            showAdministratorInfo: false,
            showMemberInfo: false,
            showOtherInfo: false,
            steps: [],
            stepIndex: 0,
            isRunning: false,
        };
    }

    componentWillMount() {
        // If there is no ordering specified default to username
        if (!this.props.location.query.ordering) {
            // Set the current ordering to username so a change wont be detected
            // by componentWillReceiveProps
            this.props.location.query.ordering = 'username';
            // Replace the url with the ordering query included
            browserHistory.replace({
                ...this.props.location,
                query: { ...this.props.location.query, ordering: 'username' },
            });
        }
    }

    componentDidMount() {
        // make api request for users/groups
        this.makeUserRequest();
        this.props.getGroups();
        const steps = joyride.UserGroupsPage;
        this.joyrideAddSteps(steps);
    }

    componentWillReceiveProps(nextProps) {
        let changedQuery = false;
        if (Object.keys(nextProps.location.query).length
                !== Object.keys(this.props.location.query).length) {
            changedQuery = true;
        } else {
            const keys = Object.keys(nextProps.location.query);
            if (!keys.every(key => nextProps.location.query[key] === this.props.location.query[key])) {
                changedQuery = true;
            }
        }
        if (changedQuery) {
            this.makeUserRequest({ ...nextProps.location.query });
        }

        if (nextProps.users.fetched && !this.props.users.fetched) {
            // if we have new props.user array and there are selectedUsers
            // we need to create a new selectedUsers array, removing any users
            // not in the new props.users array
            if (this.state.selectedUsers.length) {
                const fixedSelection = [];
                this.state.selectedUsers.forEach((user) => {
                    const newUser = nextProps.users.users
                        .find(nextUser => nextUser.user.username === user.user.username);
                    if (newUser) {
                        fixedSelection.push(newUser);
                    }
                });
                this.setState({ selectedUsers: fixedSelection });
            }
        }
        if (nextProps.groups.updated && !this.props.groups.updated) {
            this.makeUserRequest();
            this.props.getGroups();
        }
        if (nextProps.groups.created && !this.props.groups.created) {
            this.props.getGroups();
            if (this.state.createUsers.length) {
                this.makeUserRequest();
                this.setState({ createUsers: [] });
            }
        }
        if (nextProps.groups.deleted && !this.props.groups.deleted) {
            this.props.getGroups();
            const query = { ...this.props.location.query };
            if (query.groups) {
                query.groups = null;
                delete query.groups;
            }
            browserHistory.push({
                ...this.props.location,
                query,
            });
        }
        if (nextProps.groups.error && !this.props.groups.error) {
            this.showErrorDialog(nextProps.groups.error);
        }
        if (nextProps.users.error && !this.props.users.error) {
            this.showErrorDialog(nextProps.users.error);
        }
    }

    getQueryGroup(targetGroups = null) {
        const groups = targetGroups || this.props.groups.groups;
        const id = this.props.location.query.groups;
        if (id) {
            return groups.find(group => group.id === Number(id));
        }
        return null;
    }

    getGroupTitle(group) {
        const selection = this.props.location.query.groups || 'all';
        if (selection === 'all') return 'All Members';
        if (!group) {
            return 'No Members Matching Group Found';
        }
        return `${group.name} Members`;
    }

    makeUserRequest(options = { groups: null, ordering: null, search: null }) {
        const params = { ...this.props.location.query };

        if (options.search === undefined && params.search) {
            // if the search option is undefined we need to clear search from the query
            params.search = null;
            delete params.search;
        } else if (options.search) {
            // if search in options is not null or undefined we use that
            params.search = options.search;
        }

        if (options.ordering === undefined && params.ordering) {
            // if the ordering option is undefined we need to clear ordering from the query
            params.ordering = null;
            delete params.ordering;
        } else if (options.ordering) {
            // if ordering in options is not null or undefined we use that
            params.ordering = options.ordering;
        }

        if (options.groups === undefined && params.groups) {
            // if the group option is undefined we need to clear group from the query
            params.group = null;
            delete params.groups;
        } else if (options.groups) {
            // if group in options is not null or undefined we use that
            params.groups = options.groups;
        }
        this.props.getUsers(params);
    }

    toggleDrawer() {
        // this still executes the call to setState immediately
        // but it gives you the option to await the state change and the 450ms
        // that it takes for the drawer transition to complete
        return new Promise(async (resolve) => {
            // wait for the state change to be complete
            await new Promise((r2) => {
                this.setState({ drawerOpen: !this.state.drawerOpen }, r2);
            });
            // wait for drawer to be fully open (transition of 450ms)
            setTimeout(resolve, 450);
        });
    }

    handleSelectAll(selected) {
        if (selected) {
            // if all are selected we need to set selected state with all
            this.setState({
                selectedUsers: [
                    ...this.props.users.users
                        .filter(user => user.user.username !== this.props.user.username),
                ],
            });
        } else {
            // if all are deselected we need to set selected to an empty array
            this.setState({ selectedUsers: [] });
        }
    }

    handleUserSelect(user) {
        const selected = [...this.state.selectedUsers];
        const ix = selected.findIndex(u => u.user.username === user.user.username);
        if (ix > -1) {
            selected.splice(ix, 1);
        } else {
            selected.push(user);
        }
        this.setState({ selectedUsers: selected });
    }

    handleSearchKeyDown(event) {
        if (event.key === 'Enter') {
            const text = event.target.value || '';
            if (text) {
                const query = { ...this.props.location.query };
                query.search = text;
                browserHistory.push({ ...this.props.location, query });
            }
        }
    }

    handleSearchChange(event, value) {
        const text = value || '';
        if (!text && this.props.location.query.search) {
            // we need to undo any search
            const query = { ...this.props.location.query };
            query.search = null;
            delete query.search;
            browserHistory.push({ ...this.props.location, query });
        }
    }

    handleOrderingChange(e, val) {
        const query = { ...this.props.location.query };
        query.ordering = val;
        browserHistory.push({ ...this.props.location, query });
    }

    handleCreateOpen() {
        this.setState({ showCreate: true });
    }

    handleCreateClose() {
        this.setState({ showCreate: false, createInput: '' });
    }

    handleCreateInput(e, val) {
        this.setState({ createInput: val });
    }

    handleCreateSave() {
        const users = this.state.createUsers.map(user => user.user.username);
        this.props.createGroup(this.state.createInput, users);
        this.handleCreateClose();
    }

    handleRenameOpen(group) {
        this.setState({ showRename: true, targetGroup: group });
    }

    handleRenameClose() {
        this.setState({ showRename: false, renameInput: '', targetGroup: null });
    }

    handleRenameInput(e, val) {
        this.setState({ renameInput: val });
    }

    handleRenameSave() {
        this.props.updateGroup(this.state.targetGroup.id, { name: this.state.renameInput });
        this.handleRenameClose();
    }

    handleNewGroup(users) {
        if (users.length) {
            this.setState({ createUsers: users });
        }
        this.handleCreateOpen();
    }

    handleAddUsers(users) {
        if (users.length) {
            this.setState({ addUsers: users });
            this.showAddUsersDialog();
        }
    }

    handleLeaveGroupClick(group) {
        this.setState({ targetGroup: group });
        this.handleLeaveOpen();
    }

    handleDeleteGroupClick(group) {
        this.setState({ targetGroup: group });
        this.handleDeleteOpen();
    }

    handleLeaveOpen() {
        this.setState({ showLeave: true });
    }

    handleLeaveClose() {
        this.setState({ showLeave: false });
    }

    handleLeaveClick() {
        // if the user is an admin we want to remove them from admins and users
        // if the user is not an admin the api will ignore the options and just remove the user
        const administrators = this.state.targetGroup.administrators
            .filter(username => username !== this.props.user.username);
        const members = this.state.targetGroup.members
            .filter(username => username !== this.props.user.username);
        const options = { administrators, members };
        this.props.updateGroup(this.state.targetGroup.id, options);
        this.handleLeaveClose();
    }

    handleDeleteOpen() {
        this.setState({ showDelete: true });
    }

    handleDeleteClose() {
        this.setState({ showDelete: false });
    }

    handleDeleteClick() {
        this.props.deleteGroup(this.state.targetGroup.id);
        this.handleDeleteClose();
    }

    handleDrawerSelectionChange(e, v) {
        const target = e.target.tagName.toLowerCase();
        if (target === 'path' || target === 'svg') {
            // if the clicked element is path or svg we need to ignore
            // and just handle delete group.
            // YES this is a weird way to do it, but MUI was putting up a fight
            return;
        }
        const query = { ...this.props.location.query };
        if (v === 'all') {
            query.groups = null;
            delete query.groups;
        } else {
            query.groups = v;
        }
        browserHistory.push({ ...this.props.location, query });
    }

    handleMakeAdmin(user) {
        const group = this.getQueryGroup();
        if (!group) {
            return;
        }
        const administrators = [...group.administrators, user.user.username];
        this.props.updateGroup(group.id, { administrators });
    }

    handleDemoteAdmin(user) {
        const group = this.getQueryGroup();
        if (!group) {
            return;
        }
        const administrators = [...group.administrators];
        administrators.splice(administrators.indexOf(user.user.username), 1);
        this.props.updateGroup(group.id, { administrators });
    }

    handleRemoveUser(user) {
        const group = this.getQueryGroup();
        if (!group) {
            return;
        }
        const administrators = group.administrators
            .filter(username => username !== user.user.username);
        const members = group.members
            .filter(username => username !== user.user.username);
        this.props.updateGroup(group.id, { administrators, members });
    }

    handleBatchRemoveUser(users) {
        const group = this.getQueryGroup();
        if (!group) {
            return;
        }
        const usernames = users.map(user => user.user.username);
        const members = group.members
            .filter(username => usernames.indexOf(username) < 0);
        const administrators = group.administrators
            .filter(username => usernames.indexOf(username) < 0);
        this.props.updateGroup(group.id, {
            members,
            administrators,
        });
    }

    handleBatchAdminRights(users) {
        const group = this.getQueryGroup();
        if (!group) {
            return;
        }
        let administrators = [];
        const usernames = users.map(user => user.user.username);
        const removing = users.every(user => group.administrators.indexOf(user.user.username) > -1);
        if (removing) {
            administrators = group.administrators
                .filter(username => usernames.indexOf(username) < 0);
        } else {
            administrators = [...group.administrators, ...usernames];
        }
        this.props.updateGroup(group.id, { administrators });
    }

    handleAddUsersSave(groups, users) {
        this.hideAddUsersDialog();
        const usernames = users.map(user => user.user.username);
        groups.forEach((group) => {
            const members = [...group.members, ...usernames];
            this.props.updateGroup(group.id, { members });
        });
    }

    showAddUsersDialog() {
        this.setState({ showAddUsers: true });
    }

    hideAddUsersDialog() {
        this.setState({ showAddUsers: false });
    }

    showErrorDialog(message) {
        const { errors } = message;
        this.setState({ errors });
    }

    hideErrorDialog() {
        this.setState({ errors: [] });
    }

    showAdministratorInfoDialog() {
        this.setState({ showAdministratorInfo: true });
    }

    hideAdministratorInfoDialog() {
        this.setState({ showAdministratorInfo: false });
    }

    showMemberInfoDialog() {
        this.setState({ showMemberInfo: true });
    }

    hideMemberInfoDialog() {
        this.setState({ showMemberInfo: false });
    }

    showOtherInfoDialog() {
        this.setState({ showOtherInfo: true });
    }

    hideOtherInfoDialog() {
        this.setState({ showOtherInfo: false });
    }

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        if (isViewportXS()) {
            const ix = newSteps.findIndex(step => (
                step.selector === '.qa-UserGroupsPage-RaisedButton-create'
            ));
            if (ix > -1) {
                newSteps[ix + 1].text = newSteps[ix].text;
                newSteps.splice(ix, 1);
            }
        }

        this.setState((currentState) => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    async callback(data) {
        const {
            action,
            index,
            type,
            step,
        } = data;

        if (!action) return;

        if (action === 'close' || action === 'skip' || type === 'finished') {
            const fakeIx = this.props.users.users.findIndex(u => u.user.fake);
            if (fakeIx > -1) {
                this.props.users.users.splice(fakeIx, 1);
            }
            this.setState({ isRunning: false, stepIndex: 0 });
            this.joyride.reset(true);
        } else {
            if (step.selector === '.qa-GroupsDrawer-addGroup' && isViewportS() && !this.state.drawerOpen) {
                // because the next step will render immediately after (before the drawer is fully open)
                // we need to wait till the drawer is open and then update the placement of the step items
                await this.toggleDrawer();
                this.joyride.calcPlacement();
            } else if (step.selector === '.qa-GroupsDrawer-groupsHeading') {
                if (type === 'step:before') {
                    this.scrollbar.scrollToTop();
                    const users = this.props.users.users.filter(u => u.user.username !== this.props.user.username);
                    if (users.length === 0) {
                        const fakeUser = {
                            user: {
                                fake: true,
                                username: 'Example User',
                                email: 'example_user@example.com',
                            },
                        };
                        this.props.users.users.push(fakeUser);
                    }
                } else if (type === 'step:after' && isViewportS()) {
                    this.toggleDrawer();
                }
            } else if (step.selector === '.qa-UserHeader-checkbox' && type === 'tooltip:before') {
                this.handleSelectAll(true);
            } else if (step.selector === '.qa-UserHeader-IconButton-options' && type === 'step:after') {
                // because the next step will render immidiately after (before the drawer is fully open)
                // we need to wait till the drawer is open and then update the placement of the step items
                await this.toggleDrawer();
                this.joyride.calcPlacement();
            }

            if (type === 'step:after' || type === 'error:target_not_found') {
                this.setState({ stepIndex: index + (action === 'back' ? -1 : 1) });
            }
        }
    }

    handleJoyride() {
        if (this.state.drawerOpen && isViewportS()) {
            this.toggleDrawer();
        }
        if (this.state.isRunning === true) {
            this.joyride.reset(true);
            this.setState({ isRunning: true });
        } else {
            this.setState({ isRunning: true });
        }
    }

    render() {
        const { steps, isRunning } = this.state;
        const smallViewport = isViewportS();
        const xsmallViewport = isViewportXS();
        const bodyWidth = !smallViewport ? 'calc(100% - 250px)' : '100%';
        const bodyHeight = window.innerHeight - 130;
        const styles = {
            header: {
                backgroundColor: '#161e2e',
                color: 'white',
                fontSize: '14px',
                padding: '0px 24px',
                flexWrap: 'wrap-reverse',
            },
            headerTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                height: '35px',
                overflow: 'visible',
            },
            button: {
                margin: '0px 0px 0px 10px',
                minWidth: '50px',
                height: '35px',
                borderRadius: '0px',
                width: '150px',
            },
            label: {
                fontSize: '12px',
                paddingLeft: '0px',
                paddingRight: '0px',
                lineHeight: '35px',
            },
            drawerButton: {
                fontSize: '12px',
                color: '#4598bf',
                padding: '0px 10px',
                margin: '0px -10px 0px 5px',
            },
            newGroupIcon: {
                color: '#fff',
                height: '35px',
                width: '18px',
                verticalAlign: 'bottom',
                marginRight: '5px',
            },
            body: {
                height: bodyHeight,
                width: bodyWidth,
            },
            fixedHeader: {
                paddingTop: 15,
                backgroundColor: '#fff',
                maxWidth: '1000px',
                margin: 'auto',
                position: 'relative',
                zIndex: 4,
                boxShadow: '0px 0px 2px 2px rgba(0, 0, 0, 0.1)',
            },
            memberTitle: {
                display: 'flex',
                flexWrap: 'wrap',
                margin: '0px 24px 10px',
                lineHeight: '30px',
            },
            memberText: {
                fontWeight: 700,
                fontSize: '17px',
                flex: '0 0 auto',
                marginRight: '10px',
                height: '24px',
                lineHeight: '24px',
            },
            container: {
                color: 'white',
                height: '36px',
                width: 'calc(100% - 48px)',
                backgroundColor: '#F8F8F8',
                lineHeight: '36px',
                margin: '0px 24px 10px',
            },
            hint: {
                color: '#5a5a5a',
                height: '36px',
                lineHeight: 'inherit',
                bottom: '0px',
                paddingLeft: '10px',
            },
            input: {
                color: '#707274',
                paddingLeft: '10px',
            },
            underline: {
                borderBottom: '1px solid #4498c0',
                bottom: '0px',
            },
            underlineFocus: {
                borderBottom: '2px solid #4498c0',
                bottom: '0px',
            },
            ownUser: {
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 3,
                backgroundColor: '#fff',
                boxShadow: '0px 0px 2px 2px rgba(0, 0, 0, 0.1)',
            },
            loadingBackground: {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.1)',
                zIndex: 2001,
            },
            loadingContainer: {
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: bodyWidth,
            },
            loading: {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
            },
            errorIcon: {
                marginRight: '10px',
                display: 'inlineBlock',
                fill: '#CE4427',
                verticalAlign: 'bottom',
            },
            tourButton: {
                color: '#4598bf',
                cursor: 'pointer',
                display: 'inline-block',
            },
            tourIcon: {
                color: '#4598bf',
                cursor: 'pointer',
                height: '35px',
                width: '18px',
                verticalAlign: 'middle',
            },
        };

        const tourButton = (
            <EnhancedButton
                onClick={this.handleJoyride}
                style={styles.tourButton}
            >
                <Help
                    style={styles.tourIcon}
                />
                {smallViewport ? '' : <span style={{ marginLeft: '5px' }}>Page Tour</span>}
            </EnhancedButton>
        );

        const ownedGroups = [];
        const sharedGroups = [];
        const otherGroups = [];
        // split the user group into groups owned by the logged in user,
        // and groups shared with logged in user
        this.props.groups.groups.forEach((group) => {
            if (group.administrators.includes(this.props.user.username)) {
                ownedGroups.push(group);
            } else if (group.members.includes(this.props.user.username)) {
                sharedGroups.push(group);
            } else {
                otherGroups.push(group);
            }
        });

        // if multiple users are selected, find any groups they have in common
        // so that the table header can know if a selection of users should be
        // added to or removed from a group
        const commonGroups = [];
        if (this.state.selectedUsers.length) {
            ownedGroups.forEach((group) => {
                const allSelectedIncluded = this.state.selectedUsers.every((user) => {
                    if (user.groups.includes(group.id)) {
                        return true;
                    }
                    return false;
                });
                if (allSelectedIncluded) {
                    commonGroups.push(group.id);
                }
            });
        }

        const queryGroup = this.getQueryGroup();
        // check if the logged in user is an admin of the current group
        const ownedQueryGroup = this.getQueryGroup(ownedGroups);
        const otherQueryGroup = this.getQueryGroup(otherGroups);

        // get a list of all the usernames from selected users
        const selectedUsernames = this.state.selectedUsers.map(user => user.user.username);
        // if viewing all, new, or ungrouped, we want to show the admin buttons
        const showAdminLabel = this.props.location.query.groups && !this.props.users.fetching;
        const showAdminButton = showAdminLabel && !!ownedQueryGroup;

        let ownUser = null;
        const ownIX = this.props.users.users.findIndex(u => u.user.username === this.props.user.username);
        const users = [...this.props.users.users];

        if (ownIX > -1) {
            const [user] = users.splice(ownIX, 1);
            ownUser = (
                <OwnUserRow
                    key={user.user.username}
                    user={user}
                    handleDemoteAdmin={this.handleDemoteAdmin}
                    handleRemoveUser={this.handleRemoveUser}
                    isAdmin={queryGroup && queryGroup.administrators.includes(user.user.username)}
                    showAdminButton={showAdminButton}
                    showAdminLabel={showAdminLabel}
                    showRemoveButton={otherQueryGroup === undefined}
                />
            );
        }

        if (this.props.location.query.ordering === 'admin' && !!queryGroup) {
            users.sort((a, b) => {
                const aIsAdmin = queryGroup.administrators.includes(a.user.username);
                const bIsAdmin = queryGroup.administrators.includes(b.user.username);
                if (aIsAdmin && !bIsAdmin) return -1;
                if (bIsAdmin && !aIsAdmin) return 1;
                return 0;
            });
        }

        return (
            <div style={{ backgroundColor: 'white', position: 'relative' }}>
                <Joyride
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps}
                    stepIndex={this.state.stepIndex}
                    autoStart
                    type="continuous"
                    showSkipButton
                    showStepsProgress
                    locale={{
                        back: (<span>Back</span>),
                        close: (<span>Close</span>),
                        last: (<span>Done</span>),
                        next: (<span>Next</span>),
                        skip: (<span>Skip</span>),
                    }}
                    run={isRunning}
                />
                {
                    <AppBar
                        title={
                            <div style={{ lineHeight: '35px' }}>
                                Members and Groups
                            </div>
                        }
                        style={styles.header}
                        titleStyle={styles.headerTitle}
                        showMenuIconButton={false}
                        className="qa-UserGroupsPage-AppBar"
                    >
                        {tourButton}
                        {!xsmallViewport ?
                            <RaisedButton
                                label={
                                    <div>
                                        <AddCircle style={styles.newGroupIcon} />
                                        New Group
                                    </div>
                                }
                                primary
                                labelStyle={styles.label}
                                style={styles.button}
                                buttonStyle={{ borderRadius: '0px', backgroundColor: '#4598bf' }}
                                overlayStyle={{ borderRadius: '0px' }}
                                onClick={this.handleCreateOpen}
                                className="qa-UserGroupsPage-RaisedButton-create"
                            />
                            :
                            null
                        }

                        {smallViewport ?
                            <EnhancedButton
                                onClick={this.toggleDrawer}
                                style={styles.drawerButton}
                                className="qa-UserGroupsPage-drawerButton"
                            >
                                {`${this.state.drawerOpen ? 'HIDE' : 'SHOW'} PAGE MENU`}
                            </EnhancedButton>
                            :
                            null
                        }
                    </AppBar>
                }
                <div style={styles.body}>
                    <div
                        style={styles.fixedHeader}
                        className="qa-UserGroupsPage-fixedHeader"
                    >
                        <div style={styles.memberTitle} className="qa-UserGroupsPage-title">
                            <div style={styles.memberText}>
                                {this.getGroupTitle(queryGroup)}
                            </div>
                        </div>
                        <TextField
                            style={styles.container}
                            hintText="Search Users"
                            hintStyle={styles.hint}
                            inputStyle={styles.input}
                            onChange={this.handleSearchChange}
                            underlineStyle={styles.underline}
                            underlineFocusStyle={styles.underlineFocus}
                            onKeyDown={this.handleSearchKeyDown}
                            className="qa-UserGroupsPage-search"
                        />
                        <UserHeader
                            selected={this.state.selectedUsers.length === users.length}
                            onSelect={this.handleSelectAll}
                            selectedUsers={this.state.selectedUsers}
                            selectedGroup={queryGroup}
                            orderingValue={this.props.location.query.ordering || 'username'}
                            handleOrderingChange={this.handleOrderingChange}
                            handleRemoveUsers={this.handleBatchRemoveUser}
                            handleNewGroup={this.handleNewGroup}
                            handleAddUsers={this.handleAddUsers}
                            handleAdminRights={this.handleBatchAdminRights}
                            showRemoveButton={!!ownedQueryGroup}
                            showAdminButton={showAdminButton}
                            className="qa-UserGroupsPage-UserHeader"
                        />

                    </div>
                    <div style={{ maxWidth: '1000px', margin: 'auto', position: 'relative' }}>
                        <CustomScrollbar
                            style={{ height: bodyHeight - 155, width: '100%' }}
                            className="qa-UserGroupsPage-CustomScrollbar"
                            ref={(instance) => { this.scrollbar = instance; }}
                        >
                            <div style={styles.ownUser}>
                                {ownUser}
                            </div>
                            {users.map(user => (
                                <UserRow
                                    key={user.user.username}
                                    selected={selectedUsernames.indexOf(user.user.username) > -1}
                                    onSelect={this.handleUserSelect}
                                    user={user}
                                    groups={ownedGroups}
                                    handleNewGroup={this.handleNewGroup}
                                    handleAddUser={this.handleAddUsers}
                                    handleMakeAdmin={this.handleMakeAdmin}
                                    handleDemoteAdmin={this.handleDemoteAdmin}
                                    handleRemoveUser={this.handleRemoveUser}
                                    isAdmin={
                                        !!queryGroup
                                        && queryGroup.administrators.includes(user.user.username)
                                    }
                                    showAdminButton={showAdminButton}
                                    showAdminLabel={showAdminLabel}
                                    showRemoveButton={!!ownedQueryGroup}
                                    className="qa-UserGroupsPage-UserRow"
                                />
                            ))}
                            <div style={{ width: '100%', borderTop: '1px solid #e0e0e0' }} />
                        </CustomScrollbar>
                    </div>
                </div>
                <GroupsDrawer
                    selectedValue={Number(this.props.location.query.groups) || 'all'}
                    onSelectionChange={this.handleDrawerSelectionChange}
                    open={this.state.drawerOpen || !smallViewport}
                    ownedGroups={ownedGroups}
                    sharedGroups={sharedGroups}
                    otherGroups={otherGroups}
                    usersCount={this.props.users.total}
                    onNewGroupClick={this.handleCreateOpen}
                    onAdministratorInfoClick={this.showAdministratorInfoDialog}
                    onMemberInfoClick={this.showMemberInfoDialog}
                    onOtherInfoClick={this.showOtherInfoDialog}
                    onLeaveGroupClick={this.handleLeaveGroupClick}
                    onDeleteGroupClick={this.handleDeleteGroupClick}
                    onRenameGroupClick={this.handleRenameOpen}
                    className="qa-UserGroupsPage-drawer"
                />
                <AddMembersDialog
                    show={this.state.showAddUsers}
                    onClose={this.hideAddUsersDialog}
                    onSave={this.handleAddUsersSave}
                    groups={ownedGroups}
                    selectedUsers={this.state.addUsers}
                    className="qa-UserGroupsPage-addMembersDialog"
                />
                <CreateGroupDialog
                    show={this.state.showCreate}
                    onClose={this.handleCreateClose}
                    onInputChange={this.handleCreateInput}
                    onSave={this.handleCreateSave}
                    value={this.state.createInput}
                    className="qa-UserGroupsPage-createGroupDialog"
                />
                <LeaveGroupDialog
                    show={this.state.showLeave}
                    onClose={this.handleLeaveClose}
                    onLeave={this.handleLeaveClick}
                    groupName={this.state.targetGroup ? this.state.targetGroup.name : ''}
                    className="qa-UserGroupsPage-leaveGroupDialog"
                />
                <DeleteGroupDialog
                    show={this.state.showDelete}
                    onClose={this.handleDeleteClose}
                    onDelete={this.handleDeleteClick}
                    groupName={this.state.targetGroup ? this.state.targetGroup.name : ''}
                    className="qa-UserGroupsPage-deleteGroupDialog"
                />
                <RenameGroupDialog
                    show={this.state.showRename}
                    onClose={this.handleRenameClose}
                    onSave={this.handleRenameSave}
                    onInputChange={this.handleRenameInput}
                    value={this.state.renameInput}
                    valid={
                        this.props.groups.groups.find(group =>
                            group.name === this.state.renameInput) === undefined
                    }
                    className="qa-UserGroupsPage-RenameGroupDialog"
                />
                { this.props.groups.fetching || this.props.users.fetching
                || this.props.groups.creating || this.props.groups.deleting
                || this.props.groups.updating ?
                    <div style={styles.loadingBackground}>
                        <div style={styles.loadingContainer}>
                            <CircularProgress
                                color="#4598bf"
                                style={styles.loading}
                                className="qa-UserGroupsPage-loading"
                            />
                        </div>
                    </div>
                    :
                    null
                }
                <BaseDialog
                    show={!!this.state.errors.length}
                    onClose={this.hideErrorDialog}
                    title="ERROR"
                    className="qa-UserGroupsPage-errorDialog"
                >
                    {this.state.errors.map(error => (
                        <div className="qa-UserGroupsPage-error" key={error.detail}>
                            <Warning
                                className="qa-UserGroupsPage-errorIcon"
                                style={styles.errorIcon}
                            />
                            {error.detail}
                        </div>
                    ))}
                </BaseDialog>
                <AdministratorInfoDialog
                    onClose={this.hideAdministratorInfoDialog}
                    show={this.state.showAdministratorInfo}
                    className="qa-UserGroupsPage-AdministratorInfoDialog"
                />
                <MemberInfoDialog
                    onClose={this.hideMemberInfoDialog}
                    show={this.state.showMemberInfo}
                    className="qa-UserGroupsPage-MemberInfoDialog"
                />
                <OtherInfoDialog
                    onClose={this.hideOtherInfoDialog}
                    show={this.state.showOtherInfo}
                    className="qa-UserGroupsPage-OtherInfoDialog"
                />
            </div>
        );
    }
}

UserGroupsPage.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        email: PropTypes.string,
        last_login: PropTypes.string,
        date_joined: PropTypes.string,
    }).isRequired,
    groups: PropTypes.shape({
        groups: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.number,
            name: PropTypes.string,
            members: PropTypes.arrayOf(PropTypes.string),
            administrators: PropTypes.arrayOf(PropTypes.string),
        })),
        cancelSource: PropTypes.object,
        fetching: PropTypes.bool,
        fetched: PropTypes.bool,
        creating: PropTypes.bool,
        created: PropTypes.bool,
        deleting: PropTypes.bool,
        deleted: PropTypes.bool,
        updating: PropTypes.bool,
        updated: PropTypes.bool,
        error: PropTypes.shape({
            errors: PropTypes.arrayOf(PropTypes.shape({
                status: PropTypes.number,
                detail: PropTypes.string,
                title: PropTypes.string,
            })),
        }),
    }).isRequired,
    users: PropTypes.shape({
        users: PropTypes.arrayOf(PropTypes.shape({
            user: PropTypes.shape({
                username: PropTypes.string,
                first_name: PropTypes.string,
                last_name: PropTypes.string,
                email: PropTypes.string,
                last_login: PropTypes.string,
                date_joined: PropTypes.string,
            }),
            groups: PropTypes.arrayOf(PropTypes.number),
            accepted_licenses: PropTypes.object,
        })),
        fetching: PropTypes.bool,
        fetched: PropTypes.bool,
        error: PropTypes.string,
        total: PropTypes.number,
        new: PropTypes.number,
        ungrouped: PropTypes.number,
    }).isRequired,
    getGroups: PropTypes.func.isRequired,
    deleteGroup: PropTypes.func.isRequired,
    createGroup: PropTypes.func.isRequired,
    updateGroup: PropTypes.func.isRequired,
    getUsers: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
    return {
        user: state.user.data.user,
        groups: state.groups,
        users: state.users,
    };
}

function mapDispatchToProps(dispatch) {
    const timeout = new DrawerTimeout();
    return {
        getGroups: () => (
            dispatch(getGroups())
        ),
        deleteGroup: id => (
            dispatch(deleteGroup(id))
        ),
        createGroup: (name, users) => (
            dispatch(createGroup(name, users))
        ),
        updateGroup: (groupId, options) => (
            dispatch(updateGroup(groupId, options))
        ),
        getUsers: params => (
            dispatch(getUsers(params))
        ),
        openDrawer: () => (
            dispatch(timeout.openDrawer())
        ),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(UserGroupsPage);
