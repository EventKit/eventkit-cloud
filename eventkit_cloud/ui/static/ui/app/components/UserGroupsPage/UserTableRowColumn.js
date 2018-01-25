import React, { Component, PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import { TableRowColumn } from 'material-ui/Table';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import GroupsDropDownMenu from './GroupsDropDownMenu';
import GroupsDropDownMenuItem from './GroupsDropDownMenuItem';

export class UserTableRowColumn extends Component {
    constructor(props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleGroupItemClick = this.handleGroupItemClick.bind(this);
        this.state = {
            open: false,
            popoverAnchor: null,
        };
    }

    handleOpen(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ open: true, popoverAnchor: e.currentTarget });
    }

    handleClose() {
        this.setState({ open: false });
    }

    handleNewGroupClick() {
        this.handleClose();
        this.props.handleNewGroupClick([this.props.user]);
    }

    handleGroupItemClick(group) {
        this.props.handleGroupItemClick(group, this.props.user);
    }

    render() {
        const styles = {
            tableRowColumn: {
                ...this.props.style,
                color: '#707274',
                fontSize: '14px',
            },
            iconMenu: {
                width: '24px',
                height: '40px',
                margin: '0px 12px',
                float: 'right',
            },
            iconButton: {
                padding: '0px',
                height: '40px',
                width: '24px',
                float: 'right',
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

        const {
            user,
            groups,
            groupsLoading,
            handleGroupItemClick,
            handleNewGroupClick,
            ...rest
        } = this.props;

        return (
            <TableRowColumn
                {...rest}
                style={styles.tableRowColumn}
                className="qa-UserTableRowColumn"
            >
                <div>
                    <div style={{ display: 'inline-block' }}>
                        <div className="qa-UserTableRowColumn-name">
                            <strong>{user.name}</strong>
                        </div>
                        <div className="qa-UserTableRowColumn-email">
                            {user.email}
                        </div>
                    </div>
                    <IconButton
                        style={styles.iconButton}
                        iconStyle={{ color: '#4598bf' }}
                        onClick={this.handleOpen}
                        className="qa-UserTableRowColumn-IconButton-options"
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <GroupsDropDownMenu
                        open={this.state.open}
                        anchorEl={this.state.popoverAnchor}
                        onClose={this.handleClose}
                        loading={groupsLoading}
                        width={200}
                        className="qa-UserTableRowColumn-GroupsDropDownMenu"
                    >
                        {this.props.groups.map(group => (
                            <GroupsDropDownMenuItem
                                key={group.id}
                                group={group}
                                onClick={this.handleGroupItemClick}
                                selected={user.groups.includes(group.id)}
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
                </div>
            </TableRowColumn>
        );
    }
}

UserTableRowColumn.defaultProps = {
    style: {},
};

UserTableRowColumn.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        username: PropTypes.string,
        groups: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    groupsLoading: PropTypes.bool.isRequired,
    handleGroupItemClick: PropTypes.func.isRequired,
    handleNewGroupClick: PropTypes.func.isRequired,
    style: PropTypes.object,
};

export default UserTableRowColumn;
