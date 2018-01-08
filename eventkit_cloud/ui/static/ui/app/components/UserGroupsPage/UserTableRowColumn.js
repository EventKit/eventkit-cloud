import React, { Component, PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import { TableRowColumn } from 'material-ui/Table';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import GroupsDropDownMenu from './GroupsDropDownMenu';

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
        this.props.handleNewGroupClick(this.props.user.email);
    }

    handleGroupItemClick(groupUID) {
        const userEmail = this.props.user.email;
        this.props.handleGroupItemClick(groupUID, userEmail);
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
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <GroupsDropDownMenu
                        open={this.state.open}
                        anchorEl={this.state.popoverAnchor}
                        onClose={this.handleClose}
                        onMenuItemClick={this.handleGroupItemClick}
                        onNewGroupClick={this.handleNewGroupClick}
                        selectedGroups={user.groups}
                        groups={groups}
                        groupsLoading={groupsLoading}
                    />
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
        email: PropTypes.string,
        groups: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    groupsLoading: PropTypes.bool.isRequired,
    handleGroupItemClick: PropTypes.func.isRequired,
    handleNewGroupClick: PropTypes.func.isRequired,
    style: PropTypes.object,
};

export default UserTableRowColumn;
