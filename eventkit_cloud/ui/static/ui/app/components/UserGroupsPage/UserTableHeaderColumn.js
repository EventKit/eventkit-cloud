import React, { Component, PropTypes } from 'react';
import { TableHeaderColumn } from 'material-ui/Table';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import Group from 'material-ui/svg-icons/social/group';
import Sort from 'material-ui/svg-icons/content/sort';
import DropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import GroupsDropDownMenu from './GroupsDropDownMenu';
import GroupsDropDownMenuItem from './GroupsDropDownMenuItem';

export class UserTableHeaderColumn extends Component {
    constructor(props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleGroupItemClick = this.handleGroupItemClick.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.state = {
            open: false,
            popoverAnchor: null,
        };
    }

    handleOpen(e) {
        e.preventDefault();
        this.setState({ open: true, popoverAnchor: e.currentTarget });
    }

    handleClose() {
        this.setState({ open: false });
    }

    handleGroupItemClick(group) {
        this.handleClose();
        this.props.handleGroupItemClick(group);
    }

    handleNewGroupClick() {
        this.handleClose();
        this.props.handleNewGroupClick(this.props.selectedUsers);
    }

    render() {
        const styles = {
            headerColumn: {
                color: '#707274',
                fontSize: '14px',
            },
            iconMenu: {
                width: '24px',
                height: '100%',
                margin: '0px 12px',
            },
            iconButton: {
                padding: '0px',
                marginLeft: '10px',
                height: '24px',
                width: '24pz',
                verticalAlign: 'middle',
            },
            dropDown: {
                height: '24px',
                fontSize: '14px',
                float: 'right',
            },
            dropDownLabel: {
                height: '24px',
                lineHeight: '24px',
                padding: '0px',
                display: 'inline-block',
                color: '#4598bf',
            },
            dropDownIcon: {
                padding: '0px',
                height: '24px',
                width: '24px',
                position: 'relative',
                right: '0',
                top: '0px',
                border: 'none',
                fill: '#4598bf',
            },
            menuItem: {
                fontSize: '14px',
                overflow: 'hidden',
                color: '#707274',
            },
            menuItemInner: {
                padding: '0px',
                margin: '0px 22px 0px 16px',
                height: '48px',
                display: 'flex',
            },
        };

        return (
            <TableHeaderColumn
                colSpan="1"
                style={styles.headerColumn}
                className="qa-UserTableHeaderColumn"
            >
                <div>
                    <strong className="qa-UserTableHeaderColumn-selectedCount">
                        {this.props.selectedUsers.length} Selected
                    </strong>
                    { this.props.selectedUsers.length ?
                        <IconButton
                            style={styles.iconButton}
                            iconStyle={{ color: '#4598bf' }}
                            onClick={this.handleOpen}
                            className="qa-UserTableHeaderColumn-IconButton-options"
                        >
                            <Group />
                            <DropDown />
                        </IconButton>
                        :
                        null
                    }
                    <GroupsDropDownMenu
                        open={this.state.open}
                        anchorEl={this.state.popoverAnchor}
                        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                        targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                        onClose={this.handleClose}
                        loading={this.props.groupsLoading}
                        width={200}
                        className="qa-UserTableRowColumn-GroupsDropDownMenu"
                    >
                        {this.props.groups.map(group => (
                            <GroupsDropDownMenuItem
                                key={group.id}
                                group={group}
                                onClick={this.props.handleGroupItemClick}
                                selected={this.props.selectedGroups.includes(group.id)}
                            />
                        ))}
                        <Divider className="qa-UserTableRowColumn-Divider" />
                        <MenuItem
                            style={styles.menuItem}
                            innerDivStyle={styles.menuItemInner}
                            onTouchTap={this.handleNewGroupClick}
                            className="qa-UserTableRowColumn-MenuItem-newGroup"
                        >
                            <span>Share with New Group</span>
                        </MenuItem>
                    </GroupsDropDownMenu>
                    <IconMenu
                        value={this.props.sortValue}
                        onChange={this.props.handleSortChange}
                        iconButtonElement={<IconButton style={{ padding: '0px', height: '24px' }}><Sort /><DropDown /></IconButton>}
                        style={styles.dropDown}
                        menuItemStyle={{ color: '#707274', fontSize: '14px' }}
                        selectedMenuItemStyle={{ color: '#4598bf', fontSize: '14px' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                        className="qa-UserTableHeaderColumn-DropDownMenu-sort"
                    >
                        <MenuItem
                            value="username"
                            primaryText="Username A-Z"
                            className="qa-UserTableHeaderColumn-MenuItem-sortAZ"
                        />
                        <MenuItem
                            value="-username"
                            primaryText="Username Z-A"
                            className="qa-UserTableHeaderColumn-MenuItem-sortZA"
                        />
                        <MenuItem
                            value="-date_joined"
                            primaryText="Newest"
                            className="qa-UserTableHeaderColumn-MenuItem-sortNewest"
                        />
                        <MenuItem
                            value="date_joined"
                            primaryText="Oldest"
                            className="qa-UserTableHeaderColumn-MenuItem-sortOldest"
                        />
                    </IconMenu>
                </div>
            </TableHeaderColumn>
        );
    }
}

UserTableHeaderColumn.propTypes = {
    sortValue: PropTypes.string.isRequired,
    handleSortChange: PropTypes.func.isRequired,
    selectedUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedGroups: PropTypes.arrayOf(PropTypes.number).isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    groupsLoading: PropTypes.bool.isRequired,
    handleGroupItemClick: PropTypes.func.isRequired,
    handleNewGroupClick: PropTypes.func.isRequired,
};

export default UserTableHeaderColumn;
