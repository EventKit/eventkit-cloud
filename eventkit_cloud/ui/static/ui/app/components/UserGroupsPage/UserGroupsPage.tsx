import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { browserHistory } from 'react-router';
import Joyride, { Step } from 'react-joyride';
import Help from '@material-ui/icons/Help';
import Button from '@material-ui/core/Button';
import ButtonBase from '@material-ui/core/ButtonBase';
import TextField from '@material-ui/core/TextField';
import Warning from '@material-ui/icons/Warning';
import AddCircle from '@material-ui/icons/AddCircle';
import PageHeader from '../common/PageHeader';
import PageLoading from '../common/PageLoading';
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
import LoadButtons from '../common/LoadButtons';
import { getGroups, deleteGroup, createGroup, updateGroup } from '../../actions/groupActions';
import { getUsers } from '../../actions/usersActions';
import { DrawerTimeout } from '../../actions/uiActions';
import { joyride } from '../../joyride.config';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import { Location } from 'history';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    header: {
        backgroundColor: theme.eventkit.colors.background,
        color: theme.eventkit.colors.white,
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
        color: theme.eventkit.colors.primary,
        padding: '0px 10px',
        margin: '0px -10px 0px 5px',
        display: 'none',
        [theme.breakpoints.down('sm')]: {
            display: 'inline-block',
        },
    },
    newGroupIcon: {
        color: theme.eventkit.colors.white,
        height: '35px',
        width: '18px',
        verticalAlign: 'bottom',
        marginRight: '5px',
    },
    body: {
        height: 'calc(100vh - 130px)',
        width: 'calc(100% - 250px)',
        [theme.breakpoints.down('sm')]: {
            width: '100%',
        }
    },
    groups: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
    },
    fixedHeader: {
        paddingTop: 15,
        backgroundColor: theme.eventkit.colors.white,
        maxWidth: '1000px',
        margin: 'auto',
        position: 'relative',
        zIndex: 4,
        boxShadow: '0px 0px 2px 2px rgba(0, 0, 0, 0.1)',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1400,
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
        height: '36px',
        width: 'calc(100% - 48px)',
        backgroundColor: theme.eventkit.colors.secondary,
        lineHeight: '36px',
        margin: '0px 24px 10px',
    },
    hint: {
        color: theme.eventkit.colors.text_primary,
        height: '36px',
        lineHeight: 'inherit',
        bottom: '0px',
        paddingLeft: '10px',
    },
    ownUser: {
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 3,
        backgroundColor: theme.eventkit.colors.white,
        boxShadow: '0px 0px 2px 2px rgba(0, 0, 0, 0.1)',
    },
    errorIcon: {
        marginRight: '10px',
        fill: theme.eventkit.colors.warning,
        verticalAlign: 'bottom',
    },
    tourButton: {
        color: theme.eventkit.colors.primary,
        cursor: 'pointer',
        display: 'inline-block',
    },
    tourIcon: {
        color: theme.eventkit.colors.primary,
        cursor: 'pointer',
        height: '35px',
        width: '18px',
        verticalAlign: 'middle',
    },
    tourText: {
        marginLeft: '5px',
        display: 'inline-block',
        [theme.breakpoints.down('sm')]: {
            display: 'none',
        },
    },
    input: {
        color: theme.eventkit.colors.black,
        height: '36px',
        paddingLeft: '10px',
        fontSize: '16px',
    },
    createButton: {
        height: '35px',
        lineHeight: '35px',
        marginLeft: '10px',
        fontSize: '12px',
        display: 'inline-block',
        [theme.breakpoints.only('xs')]: {
            display: 'none',
        },
    },
});

export interface Props {
    user: Eventkit.User['user'];
    groups: Eventkit.Store.Groups;
    users: Eventkit.Store.Users;
    getGroups: (args: any) => void;
    deleteGroup: (id: string | number) => void;
    createGroup: (name: string, usernames: string[]) => void;
    updateGroup: (id: string | number, args: any) => void;
    getUsers: (args: any) => void;
    location: Location;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [className: string]: string };
}

export interface State {
    drawerOpen: boolean;
    selectedUsers: Eventkit.User[];
    search: string;
    showAddUsers: boolean;
    showCreate: boolean;
    showLeave: boolean;
    showDelete: boolean;
    showRename: boolean;
    targetGroup: Eventkit.Group;
    createInput: string;
    createUsers: Eventkit.User[];
    addUsers: Eventkit.User[];
    renameInput: string;
    errors: Array<{ detail: string; }>;
    showAdministratorInfo: boolean;
    showMemberInfo: boolean;
    showOtherInfo: boolean;
    steps: Step[];
    stepIndex: number;
    isRunning: boolean;
}

export class UserGroupsPage extends React.Component<Props, State> {
    static contextTypes = {
        config: PropTypes.shape({
            USER_GROUPS_PAGE_SIZE: PropTypes.string,
        }),
    };

    private pageSize: number;
    private joyride: Joyride;
    private scrollbar;
    constructor(props: Props, context) {
        super(props);
        this.bindMethods();
        this.pageSize = Number(context.config.USER_GROUPS_PAGE_SIZE);
        this.state = {
            drawerOpen: !(isWidthDown('sm', this.props.width)),
            selectedUsers: [],
            search: props.location.query.search || '',
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
        /* eslint-disable camelcase */
        // If there is no ordering specified default to username
        let { ordering, page_size } = this.props.location.query;
        if (!ordering) {
            ordering = 'username';
            // Set the current ordering to username so a change wont be detected
            // by componentDidUpdate
            this.props.location.query.ordering = ordering;
            // Replace the url with the ordering query included
        }
        if (!page_size) {
            page_size = this.pageSize;
            this.props.location.query.page_size = page_size;
        }
        browserHistory.replace({
            ...this.props.location,
            query: {
                ...this.props.location.query,
                ordering,
                page_size,
            },
        });
        /* eslint-enable camelcase */
    }

    componentDidMount() {
        // make api request for users/groups
        this.makeUserRequest();
        this.props.getGroups({ disable_page: true });
        const steps = joyride.UserGroupsPage as any[];
        this.joyrideAddSteps(steps);
    }

    componentDidUpdate(prevProps: Props) {
        let changedQuery = false;
        if (Object.keys(this.props.location.query).length
                !== Object.keys(prevProps.location.query).length) {
            changedQuery = true;
        } else {
            const keys = Object.keys(this.props.location.query);
            if (!keys.every(key => this.props.location.query[key] === prevProps.location.query[key])) {
                changedQuery = true;
            }
        }
        if (changedQuery) {
            this.makeUserRequest({ ...this.props.location.query });
        }

        if (this.props.users.fetched && !prevProps.users.fetched) {
            // if we have new props.user array and there are selectedUsers
            // we need to create a new selectedUsers array, removing any users
            // not in the new props.users array
            if (this.state.selectedUsers.length) {
                const fixedSelection = [];
                this.state.selectedUsers.forEach((user) => {
                    const newUser = this.props.users.users
                        .find(nextUser => nextUser.user.username === user.user.username);
                    if (newUser) {
                        fixedSelection.push(newUser);
                    }
                });
                this.setState({ selectedUsers: fixedSelection });
            }
        }
        if (this.props.groups.updated && !prevProps.groups.updated) {
            this.makeUserRequest();
            this.props.getGroups({ disable_page: true });
        }
        if (this.props.groups.created && !prevProps.groups.created) {
            this.props.getGroups({ disable_page: true });
            if (this.state.createUsers.length) {
                this.makeUserRequest();
                this.setState({ createUsers: [] });
            }
        }
        if (this.props.groups.deleted && !prevProps.groups.deleted) {
            this.props.getGroups({ disable_page: true });
            const query = { ...this.props.location.query };
            if (query.groups) {
                query.groups = null;
                delete query.groups;
            }
            if (query.search) {
                query.search = null;
                delete query.search;
            }
            this.setState({ search: '' });
            browserHistory.push({
                ...this.props.location,
                query,
            });
        }
        if (this.props.groups.error && !prevProps.groups.error) {
            this.showErrorDialog(this.props.groups.error);
        }
        if (this.props.users.error && !prevProps.users.error) {
            this.showErrorDialog(this.props.users.error);
        }
    }

    private getQueryGroup(targetGroups = null) {
        const groups = targetGroups || this.props.groups.groups;
        const id = this.props.location.query.groups;
        if (id) {
            return groups.find(group => group.id === Number(id));
        }
        return null;
    }

    private getGroupTitle(group: Eventkit.Group) {
        const selection = this.props.location.query.groups || 'all';
        if (selection === 'all') {
            return 'All Members';
        }
        if (!group) {
            return 'No Members Matching Group Found';
        }
        return `${group.name} Members`;
    }

    private makeUserRequest(options = { groups: null, ordering: null, search: null }) {
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

        params.prepend_self = true;

        this.props.getUsers(params);
    }

    private toggleDrawer() {
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

    private handleSelectAll(selected: boolean) {
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

    private handleUserSelect(user: Eventkit.User) {
        const selected = [...this.state.selectedUsers];
        const ix = selected.findIndex(u => u.user.username === user.user.username);
        if (ix > -1) {
            selected.splice(ix, 1);
        } else {
            selected.push(user);
        }
        this.setState({ selectedUsers: selected });
    }

    private handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            const text = (event.target as HTMLInputElement).value || '';
            if (text) {
                const query = { ...this.props.location.query };
                query.search = text;
                query.page_size = this.pageSize;
                browserHistory.push({ ...this.props.location, query });
            }
        }
    }

    private handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        const text = event.target.value || '';
        // always update state since that is what will show in the searchbar
        this.setState({ search: text });
        // if text is empty we need to clear the search and page size
        if (!text && this.props.location.query.search) {
            // we need to undo any search
            const query = { ...this.props.location.query };
            query.search = null;
            delete query.search;
            query.page_size = this.pageSize;
            browserHistory.push({ ...this.props.location, query });
        }
    }

    private handleOrderingChange(value: string) {
        const query = { ...this.props.location.query };
        query.ordering = value;
        browserHistory.push({ ...this.props.location, query });
    }

    private handleLoadMore() {
        const query = { ...this.props.location.query };
        query.page_size = Number(query.page_size) + this.pageSize;
        browserHistory.push({ ...this.props.location, query });
    }

    private handleLoadLess() {
        const query = { ...this.props.location.query };
        query.page_size = Number(query.page_size) - this.pageSize;
        browserHistory.push({ ...this.props.location, query });
    }

    private handleCreateOpen() {
        this.setState({ showCreate: true });
    }

    private handleCreateClose() {
        this.setState({ showCreate: false, createInput: '' });
    }

    private handleCreateInput(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ createInput: e.target.value });
    }

    private handleCreateSave() {
        const users = this.state.createUsers.map(user => user.user.username);
        this.props.createGroup(this.state.createInput, users);
        this.handleCreateClose();
    }

    private handleRenameOpen(group: Eventkit.Group) {
        this.setState({ showRename: true, targetGroup: group });
    }

    private handleRenameClose() {
        this.setState({ showRename: false, renameInput: '', targetGroup: null });
    }

    private handleRenameInput(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ renameInput: e.target.value });
    }

    private handleRenameSave() {
        this.props.updateGroup(this.state.targetGroup.id, { name: this.state.renameInput });
        this.handleRenameClose();
    }

    private handleNewGroup(users: Eventkit.User[]) {
        if (users.length) {
            this.setState({ createUsers: users });
        }
        this.handleCreateOpen();
    }

    private handleAddUsers(users: Eventkit.User[]) {
        if (users.length) {
            this.setState({ addUsers: users });
            this.showAddUsersDialog();
        }
    }

    private handleLeaveGroupClick(group: Eventkit.Group) {
        this.setState({ targetGroup: group });
        this.handleLeaveOpen();
    }

    private handleDeleteGroupClick(group: Eventkit.Group) {
        this.setState({ targetGroup: group });
        this.handleDeleteOpen();
    }

    private handleLeaveOpen() {
        this.setState({ showLeave: true });
    }

    private handleLeaveClose() {
        this.setState({ showLeave: false });
    }

    private handleLeaveClick() {
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

    private handleDeleteOpen() {
        this.setState({ showDelete: true });
    }

    private handleDeleteClose() {
        this.setState({ showDelete: false });
    }

    private handleDeleteClick() {
        this.props.deleteGroup(this.state.targetGroup.id);
        this.handleDeleteClose();
    }

    private handleDrawerSelectionChange(value: string) {
        const query = { ...this.props.location.query };
        if (value === 'all') {
            query.groups = null;
            delete query.groups;
        } else {
            query.groups = value;
        }
        // because we are navigating to new group we need to reset the page size and the search
        this.setState({ search: '' });
        query.search = null;
        delete query.search;
        query.page_size = this.pageSize;
        browserHistory.push({ ...this.props.location, query });
    }

    private handleMakeAdmin(user: Eventkit.User) {
        const group = this.getQueryGroup();
        if (!group) {
            return;
        }
        const administrators = [...group.administrators, user.user.username];
        this.props.updateGroup(group.id, { administrators });
    }

    private handleDemoteAdmin(user: Eventkit.User) {
        const group = this.getQueryGroup();
        if (!group) {
            return;
        }
        const administrators = [...group.administrators];
        administrators.splice(administrators.indexOf(user.user.username), 1);
        this.props.updateGroup(group.id, { administrators });
    }

    private handleRemoveUser(user: Eventkit.User) {
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

    private handleBatchRemoveUser(users: Eventkit.User[]) {
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

    private handleBatchAdminRights(users: Eventkit.User[]) {
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

    private handleAddUsersSave(groups: Eventkit.Group[], users: Eventkit.User[]) {
        this.hideAddUsersDialog();
        const usernames = users.map(user => user.user.username);
        groups.forEach((group) => {
            const members = [...group.members, ...usernames];
            this.props.updateGroup(group.id, { members });
        });
    }

    private showAddUsersDialog() {
        this.setState({ showAddUsers: true });
    }

    private hideAddUsersDialog() {
        this.setState({ showAddUsers: false });
    }

    private showErrorDialog(message: any) {
        const { errors } = message;
        this.setState({ errors });
    }

    private hideErrorDialog() {
        this.setState({ errors: [] });
    }

    private showAdministratorInfoDialog() {
        this.setState({ showAdministratorInfo: true });
    }

    private hideAdministratorInfoDialog() {
        this.setState({ showAdministratorInfo: false });
    }

    private showMemberInfoDialog() {
        this.setState({ showMemberInfo: true });
    }

    private hideMemberInfoDialog() {
        this.setState({ showMemberInfo: false });
    }

    private showOtherInfoDialog() {
        this.setState({ showOtherInfo: true });
    }

    private hideOtherInfoDialog() {
        this.setState({ showOtherInfo: false });
    }

    private joyrideAddSteps(steps: Step[]) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) {
            return;
        }

        if (isWidthDown('xs', this.props.width)) {
            const ix = newSteps.findIndex(step => (
                step.selector === '.qa-UserGroupsPage-Button-create'
            ));
            if (ix > -1) {
                newSteps[ix + 1].text = newSteps[ix].text;
                newSteps.splice(ix, 1);
            }
        }

        this.setState((currentState: State) => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    private async callback(data: any) {
        const {
            action,
            index,
            type,
            step,
        } = data;

        if (!action) {
            return;
        }

        if (action === 'close' || action === 'skip' || type === 'finished') {
            const fakeIx = this.props.users.users.findIndex(u => u.user.fake);
            if (fakeIx > -1) {
                this.props.users.users.splice(fakeIx, 1);
            }
            this.setState({ isRunning: false, stepIndex: 0 });
            this.joyride.reset(true);
        } else {
            if (step.selector === '.qa-GroupsDrawer-addGroup' && isWidthDown('sm', this.props.width) && !this.state.drawerOpen) {
                // because the next step will render immediately after (before the drawer is fully open)
                // we need to wait till the drawer is open and then update the placement of the step items
                await this.toggleDrawer();
                // @ts-ignore
                this.joyride.calcPlacement();
            } else if (step.selector === '.qa-GroupsDrawer-groupsHeading') {
                if (type === 'step:before') {
                    this.scrollbar.scrollToTop();
                    const users = this.props.users.users.filter(u => u.user.username !== this.props.user.username);
                    if (users.length === 0) {
                        const fakeUser: Eventkit.User = {
                            user: {
                                fake: true,
                                username: 'Example User',
                                email: 'example_user@example.com',
                                first_name: undefined,
                                last_name: undefined,
                                last_login: undefined,
                                date_joined: undefined,
                                commonname: undefined,
                                identification: undefined,
                            },
                            groups: [],
                            accepted_licenses: undefined,
                        };
                        this.props.users.users.push(fakeUser);
                    }
                } else if (type === 'step:after' && isWidthDown('sm', this.props.width)) {
                    this.toggleDrawer();
                }
            } else if (step.selector === '.qa-UserHeader-checkbox' && type === 'tooltip:before') {
                this.handleSelectAll(true);
            } else if (step.selector === '.qa-UserHeader-options' && type === 'step:after') {
                // because the next step will render immidiately after (before the drawer is fully open)
                // we need to wait till the drawer is open and then update the placement of the step items
                await this.toggleDrawer();
                // @ts-ignore
                this.joyride.calcPlacement();
            }

            if (type === 'step:after' || type === 'error:target_not_found') {
                this.setState({ stepIndex: index + (action === 'back' ? -1 : 1) });
            }
        }
    }

    private handleJoyride() {
        if (this.state.drawerOpen && isWidthDown('sm', this.props.width)) {
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
        const { colors } = this.props.theme.eventkit;
        const { classes } = this.props;
        const { steps, isRunning } = this.state;
        const smallViewport = isWidthDown('sm', this.props.width);

        const tourButton = (
            <ButtonBase
                onClick={this.handleJoyride}
                className={classes.tourButton}
            >
                <Help
                    className={classes.tourIcon}
                />
                <span className={classes.tourText}>Page Tour</span>
            </ButtonBase>
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
                if (aIsAdmin && !bIsAdmin) {
                    return -1;
                }
                if (bIsAdmin && !aIsAdmin) {
                    return 1;
                }
                return 0;
            });
        }

        const pageSize = Number(this.props.location.query.page_size);
        const len = queryGroup ? queryGroup.members.length : this.props.users.total;

        const loadMoreDisabled = !this.props.users.nextPage;
        const loadLessDisabled = pageSize <= this.pageSize || this.pageSize >= len;

        return (
            <div style={{ backgroundColor: colors.white, position: 'relative' }}>
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
                        back: (<span>Back</span>) as any,
                        close: (<span>Close</span>) as any,
                        last: (<span>Done</span>) as any,
                        next: (<span>Next</span>) as any,
                        skip: (<span>Skip</span>) as any,
                    }}
                    run={isRunning}
                />
                {
                    <PageHeader
                        title="Members and Groups"
                        className="qa-UserGroupsPage-AppBar"
                    >
                        {tourButton}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.handleCreateOpen}
                            className={`qa-UserGroupsPage-Button-create ${classes.createButton}`}
                        >
                            <AddCircle className={classes.newGroupIcon} />
                            New Group
                        </Button>

                        <ButtonBase
                            onClick={this.toggleDrawer}
                            className={`qa-UserGroupsPage-drawerButton ${classes.drawerButton}`}
                        >
                            {`${this.state.drawerOpen ? 'HIDE' : 'SHOW'} PAGE MENU`}
                        </ButtonBase>
                    </PageHeader>
                }
                <div className={classes.body}>
                    <div
                        className={`qa-UserGroupsPage-fixedHeader ${classes.fixedHeader}`}
                    >
                        <div className={`qa-UserGroupsPage-title ${classes.memberTitle}`}>
                            <div className={classes.memberText}>
                                {this.getGroupTitle(queryGroup)}
                            </div>
                        </div>
                        <TextField
                            type="text"
                            placeholder="Search Users"
                            value={this.state.search}
                            InputProps={{ className: classes.input }}
                            onChange={this.handleSearchChange}
                            onKeyDown={this.handleSearchKeyDown}
                            className={`qa-UserGroupsPage-search ${classes.container}`}
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
                            style={{ height: 'calc(100vh - 130px - 155px)', width: '100%' }}
                            className="qa-UserGroupsPage-CustomScrollbar"
                            ref={(instance) => { this.scrollbar = instance; }}
                        >
                            <div className={classes.groups}>
                                <div>
                                    <div className={classes.ownUser}>
                                        {ownUser}
                                    </div>
                                    {users.map(user => (
                                        <UserRow
                                            key={user.user.username}
                                            selected={selectedUsernames.indexOf(user.user.username) > -1}
                                            onSelect={this.handleUserSelect}
                                            user={user}
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
                                </div>
                                <LoadButtons
                                    style={{ paddingTop: '10px' }}
                                    range={this.props.users.range}
                                    handleLoadMore={this.handleLoadMore}
                                    handleLoadLess={this.handleLoadLess}
                                    loadMoreDisabled={loadMoreDisabled}
                                    loadLessDisabled={loadLessDisabled}
                                />
                            </div>
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
                    <div className={classes.loadingContainer}>
                        <PageLoading background="transparent" partial />
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
                                className={`qa-UserGroupsPage-errorIcon ${classes.errorIcon}`}
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

    private bindMethods() {
        this.getQueryGroup = this.getQueryGroup.bind(this);
        this.getGroupTitle = this.getGroupTitle.bind(this);
        this.makeUserRequest = this.makeUserRequest.bind(this);
        this.toggleDrawer = this.toggleDrawer.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleSearchKeyDown = this.handleSearchKeyDown.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleOrderingChange = this.handleOrderingChange.bind(this);
        this.handleLoadLess = this.handleLoadLess.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
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
    }
}

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
        getGroups: params => (
            dispatch(getGroups(params))
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

export default withWidth()(withTheme()(withStyles(jss)(connect(mapStateToProps, mapDispatchToProps)(UserGroupsPage))));
