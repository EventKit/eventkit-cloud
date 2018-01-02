import React, { Component, PropTypes } from 'react';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import {
    Table,
    TableBody,
    TableHeader,
    TableRow,
} from 'material-ui/Table';
import NavigationMenu from 'material-ui/svg-icons/navigation/menu';
import CustomScrollbar from '../CustomScrollbar';
import BaseDialog from '../BaseDialog';
import UserTableRowColumn from './UserTableRowColumn';
import UserTableHeaderColum from './UserTableHeaderColumn';
import GroupsDrawer from './GroupsDrawer';
import CreateGroupDialog from './CreateGroupDialog';
import LeaveGroupDialog from './LeaveGroupDialog';
import DeleteGroupDialog from './DeleteGroupDialog';
import CustomTextField from '../CustomTextField';

export class UserGroupsPage extends Component {
    constructor(props) {
        super(props);
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
        this.handleItemClick = this.handleItemClick.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleLeaveGroupClick = this.handleLeaveGroupClick.bind(this);
        this.handleDeleteGroupClick = this.handleDeleteGroupClick.bind(this);
        this.handleLeaveOpen = this.handleLeaveOpen.bind(this);
        this.handleLeaveClose = this.handleLeaveClose.bind(this);
        this.handleLeaveClick = this.handleLeaveClick.bind(this);
        this.handleDeleteOpen = this.handleDeleteOpen.bind(this);
        this.handleDeleteClose = this.handleDeleteClose.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
        this.state = {
            drawerOpen: !(window.innerWidth < 768),
            selected: [],
            users: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            sort: 1,
            showCreate: false,
            menuValues: [],
            showLeave: false,
            showDelete: false,
            targetGroupName: '',
            usersUpdating: [],
        };
    }

    componentDidMount() {
        // make api request for users/groups
    }

    toggleDrawer() {
        this.setState({ drawerOpen: !this.state.drawerOpen });
    }

    handleSelectAll(selected) {
        if (selected === 'all') {
            // if all are selected we need to set selected state to an array containing all table indices
            const allIndices = Array.from(new Array(this.state.users.length), (val, ix) => ix);
            this.setState({ selected: allIndices });
        } else {
            // if all are deselected we need to set selected to an empty array
            this.setState({ selected: [] });
        }
    }

    handleIndividualSelect(selected) {
        // update the state with all selected indices
        this.setState({ selected });
    }

    handleSearchKeyDown(event) {
        if (event.key === 'Enter') {
            const text = event.target.value || '';
            console.log(text);
        }
    }

    handleSearchChange(event, value) {
        const text = value || '';
        console.log(text);
    }

    handleSortChange(e, ix, val) {
        this.setState({ sort: val });
    }

    handleCreateOpen() {
        this.setState({ showCreate: true });
    }

    handleCreateClose() {
        this.setState({ showCreate: false });
    }

    handleCreateInput(e, val) {
        console.log(val);
    }

    handleCreateSave() {
        console.log('save');
        this.handleCreateClose();
    }

    handleItemClick(value) {
        const values = [...this.state.menuValues];
        const index = values.indexOf(value);
        if (index !== -1) {
            // the item is being deselected
            values.splice(index, 1);
        } else {
            // the item is being added
            values.push(value);
        }
        this.setState({ menuValues: values });
    }

    handleNewGroupClick() {
        this.handleCreateOpen();
    }

    handleLeaveGroupClick(group) {
        console.log('leave');
        this.setState({ targetGroupName: group });
        this.handleLeaveOpen();
    }

    handleDeleteGroupClick(e, group) {
        e.stopPropagation();
        console.log('delete', group);
        this.setState({ targetGroupName: group });
        this.handleDeleteOpen();
    }

    handleLeaveOpen() {
        this.setState({ showLeave: true });
    }

    handleLeaveClose() {
        this.setState({ showLeave: false, targetGroupName: '' });
    }

    handleLeaveClick() {
        console.log('leave group', this.state.targetGroupName);
        this.handleLeaveClose();
    }

    handleDeleteOpen() {
        this.setState({ showDelete: true });
    }

    handleDeleteClose() {
        this.setState({ showDelete: false, targetGroupName: '' });
    }

    handleDeleteClick() {
        console.log('delete', this.state.targetGroupName);
        this.handleDeleteClose();
    }

    render() {
        const mobile = window.innerWidth < 768;
        const bodyWidth = this.state.drawerOpen && !mobile ? 'calc(100% - 250px)' : '100%';
        const styles = {
            header: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                padding: '0px 10px 0px 30px',
            },
            headerTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                height: '35px',
            },
            button: {
                margin: '0px',
                minWidth: '50px',
                height: '35px',
                borderRadius: '0px',
            },
            label: {
                fontSize: '12px',
                paddingLeft: '20px',
                paddingRight: '20px',
                lineHeight: '35px',
            },
            body: {
                position: 'relative',
                left: 0,
                height: window.innerHeight - 130,
                width: bodyWidth,
                overflowY: 'hidden',
            },
            bodyContent: {
                paddingBottom: '30px',
                maxWidth: '1000px',
                margin: 'auto',
                position: 'relative',
            },
            drawerButton: {
                fill: 'white',
                height: '35px',
                marginLeft: '15px',
                cursor: 'pointer',
            },
            fixedHeader: {
                width: 'inherit',
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 3,
                paddingTop: 20,
                backgroundColor: '#fff',
            },
            container: {
                color: 'white',
                height: '36px',
                width: 'calc(100% - 48px)',
                backgroundColor: '#eee',
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
            tableRow: {
                height: '56px',
            },
        };

        this.context.muiTheme.checkbox.boxColor = '#4598bf';
        this.context.muiTheme.checkbox.checkedColor = '#4598bf';
        this.context.muiTheme.tableRow.selectedColor = 'initial';

        const groups = [];
        for (let i = 0; i < 20; i++) {
            groups.push({
                name: `Group ${i}`,
                memberCount: 10,
            });
        }

        const sharedGroups = [];
        for (let i = 0; i < 5; i++) {
            sharedGroups.push({
                name: `Shared Group ${i}`,
            });
        }

        const users = [
            { name: 'Jane Doe', email: 'jane.doe@email.com' },
            { name: 'John Doe', email: 'john.doe@email.com' },
        ];

        const rows = [];
        for (let i = 0; i < 20; i++) {
            const user = i % 2 === 0 ? users[0] : users[1];
            rows.push((
                <TableRow
                    key={i}
                    style={styles.tableRow}
                    selected={this.state.selected.includes(i)}
                >
                    <UserTableRowColumn
                        user={user}
                        groups={groups}
                        groupsLoading={this.state.usersUpdating.includes(user.email)}
                        menuValues={this.state.menuValues}
                        handleItemClick={this.handleItemClick}
                        handleNewGroupClick={this.handleNewGroupClick}
                    />
                </TableRow>
            ));
        }

        return (
            <div style={{ backgroundColor: 'white' }}>
                <AppBar
                    className="qa-UserGroupsPage-AppBar"
                    title="Members and Groups"
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
                    >
                        <CreateGroupDialog
                            show={this.state.showCreate}
                            onClose={this.handleCreateClose}
                            onInputChange={this.handleCreateInput}
                            onSave={this.handleCreateSave}
                        />
                    </RaisedButton>
                    <NavigationMenu
                        style={styles.drawerButton}
                        onClick={this.toggleDrawer}
                        className="qa-UserGroupsPage-drawerButton"
                    />
                </AppBar>
                <div style={styles.body}>
                    <CustomScrollbar style={{ height: window.innerHeight - 130, width: '100%' }}>
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
                                <Table
                                    selectable
                                    multiSelectable
                                    onRowSelection={this.handleSelectAll}
                                    allRowsSelected={this.state.selected.length === this.state.users.length}
                                    className="qa-UserGroups-headerTable"
                                >
                                    <TableHeader
                                        style={{ zIndex: 2 }}
                                        displaySelectAll
                                        adjustForCheckbox
                                        enableSelectAll
                                    >
                                        <TableRow>
                                            <UserTableHeaderColum
                                                selectedCount={this.state.selected.length}
                                                sortValue={this.state.sort}
                                                handleSortChange={this.handleSortChange}
                                                groups={groups}
                                                groupsLoading={!!this.state.usersUpdating.length}
                                                menuValues={this.state.menuValues}
                                                handleItemClick={this.handleItemClick}
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
                                className="qa-UserGroups-bodyTable"
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
                    open={this.state.drawerOpen}
                    groups={groups}
                    sharedGroups={sharedGroups}
                    className="qa-UserGroups-drawer"
                    onNewGroupClick={this.handleNewGroupClick}
                    onLeaveGroupClick={this.handleLeaveGroupClick}
                    onDeleteGroupClick={this.handleDeleteGroupClick}
                />
                <LeaveGroupDialog
                    show={this.state.showLeave}
                    onClose={this.handleLeaveClose}
                    onLeave={this.handleLeaveClick}
                    groupName={this.state.targetGroupName}
                />
                <DeleteGroupDialog
                    show={this.state.showDelete}
                    onClose={this.handleDeleteClose}
                    onDelete={this.handleDeleteClick}
                    groupName={this.state.targetGroupName}
                />
            </div>
        );
    }
}

UserGroupsPage.contextTypes = {
    muiTheme: PropTypes.object,
};

export default UserGroupsPage;
