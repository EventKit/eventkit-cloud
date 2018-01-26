import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
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
import CustomScrollbar from '../CustomScrollbar';
import UserTableRowColumn from './UserTableRowColumn';
import UserTableHeaderColum from './UserTableHeaderColumn';
import GroupsDrawer from './GroupsDrawer';
import CreateGroupDialog from './CreateGroupDialog';
import LeaveGroupDialog from './LeaveGroupDialog';
import DeleteGroupDialog from './DeleteGroupDialog';
import BaseDialog from '../BaseDialog';
import {
    getGroups,
    deleteGroup,
    createGroup,
    addGroupUsers,
    removeGroupUsers,
} from '../../actions/userGroupsActions.fake.js'; // TODO: REPLACE THIS WITH THE REAL FILE
import { getUsers } from '../../actions/userActions.fake.js'; // TODO: REPLACE THIS WITH THE REAL FILE

export class UserGroupsPage extends Component {
    constructor(props) {
        super(props);
        this.onDrawerIconMouseOver = this.onDrawerIconMouseOver.bind(this);
        this.onDrawerIconMouseOut = this.onDrawerIconMouseOut.bind(this);
        this.makeUserRequest = this.makeUserRequest.bind(this);
        this.toggleDrawer = this.toggleDrawer.bind(this);
        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleIndividualSelect = this.handleIndividualSelect.bind(this);
        this.handleSearchKeyDown = this.handleSearchKeyDown.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.handleCreateOpen = this.handleCreateOpen.bind(this);
        this.handleCreateClose = this.handleCreateClose.bind(this);
        this.handleCreateInput = this.handleCreateInput.bind(this);
        this.handleCreateSave = this.handleCreateSave.bind(this);
        this.handleSingleUserChange = this.handleSingleUserChange.bind(this);
        this.handleMultiUserChange = this.handleMultiUserChange.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleLeaveGroupClick = this.handleLeaveGroupClick.bind(this);
        this.handleDeleteGroupClick = this.handleDeleteGroupClick.bind(this);
        this.handleLeaveOpen = this.handleLeaveOpen.bind(this);
        this.handleLeaveClose = this.handleLeaveClose.bind(this);
        this.handleLeaveClick = this.handleLeaveClick.bind(this);
        this.handleDeleteOpen = this.handleDeleteOpen.bind(this);
        this.handleDeleteClose = this.handleDeleteClose.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
        this.handleDrawerSelectionChange = this.handleDrawerSelectionChange.bind(this);
        this.showErrorDialog = this.showErrorDialog.bind(this);
        this.hideErrorDialog = this.hideErrorDialog.bind(this);
        this.showPageInfoDialog = this.showPageInfoDialog.bind(this);
        this.hidePageInfoDialog = this.hidePageInfoDialog.bind(this);
        this.showSharedInfoDialog = this.showSharedInfoDialog.bind(this);
        this.hideSharedInfoDialog = this.hideSharedInfoDialog.bind(this);
        this.state = {
            drawerOpen: !(window.innerWidth < 768),
            selectedUsers: [],
            search: '',
            sort: 'user__username',
            showCreate: false,
            showLeave: false,
            showDelete: false,
            targetGroup: {},
            usersUpdating: [],
            createInput: '',
            createUsers: [],
            drawerSelection: 'all',
            errorMessage: '',
            showSharedInfo: false,
            showPageInfo: false,
            drawerIconHover: false,
        };
    }

    componentDidMount() {
        // make api request for users/groups
        this.makeUserRequest();
        this.props.getGroups();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.users.fetched && !this.props.users.fetched) {
            // if we have new props.user array and there are selectedUsers
            // we need to create a new selectedUsers array, removing any users
            // not in the new props.users array
            if (this.state.selectedUsers.length) {
                const fixedSelection = [];
                this.state.selectedUsers.forEach((user) => {
                    const newUser = nextProps.users.users.find(nextUser => nextUser.username === user.username);
                    if (newUser) {
                        fixedSelection.push(newUser);
                    }
                });
                this.setState({ selectedUsers: fixedSelection });
            }
        }
        if (nextProps.groups.added && !this.props.groups.added) {
            this.makeUserRequest();
            this.props.getGroups();
        }
        if (nextProps.groups.removed && !this.props.groups.removed) {
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
            this.setState({ drawerSelection: 'all' }, this.makeUserRequest);
        }
        if (nextProps.groups.error && !this.props.groups.error) {
            this.showErrorDialog(nextProps.groups.error);
        }
        if (nextProps.users.error && !this.props.users.error) {
            this.showErrorDialog(nextProps.users.error);
        }
    }

    onDrawerIconMouseOver() {
        this.setState({ drawerIconHover: true });
    }

    onDrawerIconMouseOut() {
        this.setState({ drawerIconHover: false });
    }

    makeUserRequest() {
        const params = {};
        
        params.ordering = this.state.sort;
        
        if (this.state.search) { params.search = this.state.search; }

        switch (this.state.drawerSelection) {
            case 'all': {
                // just get all users
                break;
            }
            case 'new': {
                // get users newer than 2 weeks
                const date = new Date();
                date.setDate(date.getDate() - 14);
                const dateString = date.toISOString().substring(0, 10);
                params.newer_than = dateString;
                break;
            }
            case 'ungrouped': {
                // get users not in a group
                params.ungrouped = true;
                break;
            }
            default: {
                // get users in a specific group
                params.group = this.state.drawerSelection;
                break;
            }
        }
        console.log(params);
        this.props.getUsers(params);
    }

    toggleDrawer() {
        this.setState({ drawerOpen: !this.state.drawerOpen, drawerIconHover: false });
    }

    handleSelectAll(selected) {
        if (selected === 'all') {
            // if all are selected we need to set selected state with all
            this.setState({ selectedUsers: [...this.props.users.users] });
        } else {
            // if all are deselected we need to set selected to an empty array
            this.setState({ selectedUsers: [] });
        }
    }

    handleIndividualSelect(selected) {
        // update the state with all selected users
        const users = [];
        selected.forEach((ix) => {
            users.push(this.props.users.users[ix]);
        });
        this.setState({ selectedUsers: users });
    }

    handleSearchKeyDown(event) {
        if (event.key === 'Enter') {
            const text = event.target.value || '';
            if (text) {
                this.setState({ search: text }, this.makeUserRequest);
            }
        }
    }

    handleSearchChange(event, value) {
        const text = value || '';
        if (!text && this.state.search) {
            // we need to undo any search
            this.setState({ search: '' }, this.makeUserRequest);
        }
    }

    handleSortChange(e, ix, val) {
        this.setState({ sort: val }, this.makeUserRequest);
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
        const users = this.state.createUsers.map(user => user.username);
        this.props.createGroup(this.state.createInput, users);
        this.handleCreateClose();
    }

    handleNewGroupClick(users) {
        if (users.length) {
            this.setState({ createUsers: users });
        }
        this.handleCreateOpen();
    }

    handleSingleUserChange(group, user) {
        // if user is not in group, add them. Otherwise remove them
        const adding = !user.groups.includes(group.id);

        if (!adding) {
            this.props.removeUsers(group, [user.username]);
        } else {
            this.props.addUsers(group, [user.username]);
        }
    }

    handleMultiUserChange(group) {
        // assume we are removing all the selected users
        let adding = false;
        const users = [];
        this.state.selectedUsers.forEach((user) => {
            if (!adding && !user.groups.includes(group.id)) {
                // if at least one user is not already a member we want to add all the users
                adding = true;
            }
            users.push(user.username);
        });

        // if no users quit
        if (!users.length) {
            return;
        }

        if (!adding) {
            this.props.removeUsers(group, users);
        } else {
            this.props.addUsers(group, users);
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
        this.props.removeUsers(this.state.targetGroup, [this.props.user.username]);
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
        this.setState({ drawerSelection: v }, this.makeUserRequest);
    }

    showErrorDialog(message) {
        this.setState({ errorMessage: message });
    }

    hideErrorDialog() {
        this.setState({ errorMessage: '' });
    }

    showSharedInfoDialog() {
        this.setState({ showSharedInfo: true });
    }

    hideSharedInfoDialog() {
        this.setState({ showSharedInfo: false });
    }

    showPageInfoDialog() {
        this.setState({ showPageInfo: true });
    }

    hidePageInfoDialog() {
        this.setState({ showPageInfo: false });
    }

    render() {
        const mobile = window.innerWidth < 768;
        const bodyWidth = !mobile ? 'calc(100% - 250px)' : '100%';
        const bodyHeight = window.innerHeight - 130;
        const styles = {
            pageInfoIcon: {
                fill: '#4598bf',
                height: '20px',
                width: '20px',
                marginLeft: '10px',
                verticalAlign: 'text-bottom',
                cursor: 'pointer',
            },
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
                margin: '0px',
                minWidth: '50px',
                height: '35px',
                borderRadius: '0px',
                display: 'flex',
                float: 'right',
            },
            label: {
                fontSize: '12px',
                paddingLeft: mobile ? '10px' : '20px',
                paddingRight: mobile ? '10px' : '20px',
                lineHeight: '35px',
            },
            body: {
                position: 'relative',
                left: 0,
                height: bodyHeight,
                width: bodyWidth,
                overflowY: 'hidden',
            },
            bodyContent: {
                paddingBottom: '30px',
                maxWidth: '1000px',
                margin: 'auto',
                position: 'relative',
            },
            fixedHeader: {
                width: 'inherit',
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 3,
                paddingTop: 15,
                backgroundColor: '#fff',
            },
            container: {
                color: 'white',
                height: '36px',
                width: mobile ? 'calc(100% - 72px)' : 'calc(100% - 48px)',
                backgroundColor: '#F8F8F8',
                lineHeight: '36px',
                margin: '0px auto 10px 24px',
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
            tableRow: {
                height: '56px',
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
            drawerButton: {
                width: '35px',
                height: '35px',
                lineHeight: '35px',
                position: 'absolute',
                right: this.state.drawerOpen ? '250px' : '0px',
                top: '15px',
                textAlign: 'center',
                backgroundColor: '#e8eef5',
                transitionProperty: 'right',
                transitionDuration: '450ms',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',                                        
            },
            drawerIcon: {
                fill: '#4598bf',
                height: '35px',
                width: '30px',
            },
        };

        // split the user group into groups owned by the logged in user,
        // and groups shared with logged in user
        const ownedGroups = this.props.groups.groups.filter(group => (
            group.administrators.includes(this.props.user.username)
        ));
        const sharedGroups = this.props.groups.groups.filter(group => (
            !group.administrators.includes(this.props.user.username)
        ));

        // for groups owned by the logged in user, remove their name from the list of members
        ownedGroups.forEach((group) => {
            const ix = group.members.indexOf(this.props.user.username);
            if (ix > -1) {
                group.members.splice(ix, 1);
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

        const rows = this.props.users.users.map((user, ix) => (
            // we should be filtering out the logged in user here
            <TableRow
                key={user.username}
                style={styles.tableRow}
                selected={this.state.selectedUsers.includes(user)}
                rowNumber={ix}
            >
                <UserTableRowColumn
                    user={user}
                    groups={ownedGroups}
                    groupsLoading={this.state.usersUpdating.includes(user.username)}
                    handleGroupItemClick={this.handleSingleUserChange}
                    handleNewGroupClick={this.handleNewGroupClick}
                />
            </TableRow>
        ));

        return (
            <div style={{ backgroundColor: 'white', position: 'relative' }}>
                {
                    <AppBar
                        className="qa-UserGroupsPage-AppBar"
                        title={
                            <span>
                                Members and Groups
                                <InfoIcon style={styles.pageInfoIcon} onClick={this.showPageInfoDialog} />
                            </span>
                        }
                        style={styles.header}
                        titleStyle={styles.headerTitle}
                        showMenuIconButton={false}
                    >
                        <RaisedButton
                            className="qa-UserGroupsPage-RaisedButton-create"
                            label="Create Group"
                            primary
                            labelStyle={styles.label}
                            style={styles.button}
                            buttonStyle={{ borderRadius: '0px', backgroundColor: '#4598bf' }}
                            overlayStyle={{ borderRadius: '0px' }}
                            onClick={this.handleCreateOpen}
                        />
                    </AppBar>
                }
                <div style={styles.body}>
                    <CustomScrollbar
                        style={{ height: bodyHeight, width: '100%' }}
                        className="qa-UserGroupsPage-CustomScrollbar"
                    >
                        <div style={styles.bodyContent} className="qa-UserGroupsPage-bodyContent">
                            <div style={styles.fixedHeader} className="qa-UserGroupsPage-fixedHeader">
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
                                {mobile ?
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        style={styles.drawerButton}
                                        onClick={this.toggleDrawer}
                                        onMouseEnter={this.onDrawerIconMouseOver}
                                        onMouseLeave={this.onDrawerIconMouseOut}
                                    >
                                        {this.state.drawerIconHover ?
                                            this.state.drawerOpen ?
                                                <ArrowRight style={styles.drawerIcon} />
                                                :
                                                <ArrowLeft style={styles.drawerIcon} />
                                            :
                                            <MenuIcon style={styles.drawerIcon} />
                                        }
                                    </div>
                                    :
                                    null
                                }
                                <Table
                                    selectable
                                    multiSelectable
                                    onRowSelection={this.handleSelectAll}
                                    allRowsSelected={this.state.selectedUsers.length === this.props.users.users.length}
                                    className="qa-UserGroupsPage-headerTable"
                                >
                                    <TableHeader
                                        style={{ zIndex: 2 }}
                                        displaySelectAll
                                        adjustForCheckbox
                                        enableSelectAll
                                    >
                                        <TableRow>
                                            <UserTableHeaderColum
                                                selectedUsers={this.state.selectedUsers}
                                                selectedGroups={commonGroups}
                                                sortValue={this.state.sort}
                                                handleSortChange={this.handleSortChange}
                                                groups={ownedGroups}
                                                groupsLoading={!!this.state.usersUpdating.length}
                                                handleGroupItemClick={this.handleMultiUserChange}
                                                handleNewGroupClick={this.handleNewGroupClick}
                                            />
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                            </div>
                            <Table
                                selectable
                                multiSelectable
                                onRowSelection={this.handleIndividualSelect}
                                style={{ borderBottom: '1px solid rgb(224, 224, 224)' }}
                                className="qa-UserGroupsPage-bodyTable"
                            >
                                <TableBody
                                    displayRowCheckbox
                                    showRowHover
                                    deselectOnClickaway={false}
                                >
                                    {rows}
                                </TableBody>
                            </Table>
                        </div>
                    </CustomScrollbar>
                </div>
                <GroupsDrawer
                    selectedValue={this.state.drawerSelection}
                    onSelectionChange={this.handleDrawerSelectionChange}
                    open={this.state.drawerOpen || !mobile}
                    ownedGroups={ownedGroups}
                    sharedGroups={sharedGroups}
                    usersCount={this.props.users.total}
                    className="qa-UserGroupsPage-drawer"
                    onNewGroupClick={this.handleCreateOpen}
                    onSharedInfoClick={this.showSharedInfoDialog}
                    onLeaveGroupClick={this.handleLeaveGroupClick}
                    onDeleteGroupClick={this.handleDeleteGroupClick}
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
                    groupName={this.state.targetGroup.name || ''}
                    className="qa-UserGroupsPage-leaveGroupDialog"
                />
                <DeleteGroupDialog
                    show={this.state.showDelete}
                    onClose={this.handleDeleteClose}
                    onDelete={this.handleDeleteClick}
                    groupName={this.state.targetGroup.name || ''}
                    className="qa-UserGroupsPage-deleteGroupDialog"
                />
                { this.props.groups.fetching || this.props.users.fetching
                || this.props.groups.creating || this.props.groups.adding
                || this.props.groups.removing || this.props.groups.deleting ?
                    <div style={styles.loadingBackground}>
                        <div style={styles.loadingContainer}>
                            <CircularProgress color="#4598bf" style={styles.loading} className="qa-UserGroupsPage-loading" />
                        </div>
                    </div>
                    :
                    null
                }
                <BaseDialog
                    show={!!this.state.errorMessage}
                    onClose={this.hideErrorDialog}
                    title="ERROR"
                    className="qa-UserGroupsPage-errorDialog"
                >
                    <Warning className="" style={styles.errorIcon} />
                    {this.state.errorMessage}
                </BaseDialog>

                <BaseDialog
                    show={!!this.state.showSharedInfo}
                    onClose={this.hideSharedInfoDialog}
                    title="SHARED GROUPS"
                    className="qa-UserGroupsPage-sharedInfo"
                >
                    <div style={{ lineHeight: '36px', display: 'flex', justifyContent: 'center' }}>
                        <div>
                            <span>For groups that have been shared with you:</span>
                            <ul style={{ paddingLeft: '20px' }}>
                                <li>You'll receive all notifications</li>
                                <li>You have limited administrative rights for all data shared with each group</li>
                            </ul>
                            <span>You may leave any group. By doing so, you opt out of notifications and your admin rights.</span>
                        </div>
                    </div>
                </BaseDialog>

                <BaseDialog
                    show={!!this.state.showPageInfo}
                    onClose={this.hidePageInfoDialog}
                    title="MEMBERS & GROUPS"
                    className="qa-UserGroupsPage-pageInfo"
                >
                    <div style={{ lineHeight: '36px', display: 'flex', justifyContent: 'center' }}>
                        <div>
                            <span>On this page you can:</span>
                            <ul style={{ paddingLeft: '20px' }}>
                                <li>View all EventKit members</li>
                                <li>Create and manage user groups for data sharing</li>
                                <li>View groups that have been shared with you</li>
                            </ul>
                        </div>
                    </div>
                </BaseDialog>
            </div>
        );
    }
}

UserGroupsPage.propTypes = {
    user: PropTypes.object.isRequired,
    groups: PropTypes.shape({
        groups: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
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
        adding: PropTypes.bool,
        added: PropTypes.bool,
        removing: PropTypes.bool,
        removed: PropTypes.bool,
        error: PropTypes.string,
    }).isRequired,
    users: PropTypes.shape({
        users: PropTypes.arrayOf(PropTypes.object),
        fetching: PropTypes.bool,
        fetched: PropTypes.bool,
        error: PropTypes.string,
        total: PropTypes.number,
    }).isRequired,
    getGroups: PropTypes.func.isRequired,
    deleteGroup: PropTypes.func.isRequired,
    createGroup: PropTypes.func.isRequired,
    addUsers: PropTypes.func.isRequired,
    removeUsers: PropTypes.func.isRequired,
    getUsers: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
    return {
        user: state.user.data.user,
        groups: state.groups,
        users: state.users,
    };
}

function mapDispatchToProps(dispatch) {
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
        addUsers: (group, users) => (
            dispatch(addGroupUsers(group, users))
        ),
        removeUsers: (group, users) => (
            dispatch(removeGroupUsers(group, users))
        ),
        getUsers: params => (
            dispatch(getUsers(params))
        ),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(UserGroupsPage);
