import React, { Component, PropTypes } from 'react';
import { TableHeaderColumn } from 'material-ui/Table';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreHorizIcon from 'material-ui/svg-icons/navigation/more-horiz';
import GroupsDropDownMenu from './GroupsDropDownMenu';

export class UserTableHeaderColumn extends Component {
    constructor(props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
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

    handleNewGroupClick() {
        this.handleClose();
        this.props.handleNewGroupClick();
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
                margin: '0px 12px',
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
        };

        return (
            <TableHeaderColumn
                colSpan="1"
                style={styles.headerColumn}
                className="qa-UserTableHeaderColumn"
            >
                <div>
                    <strong className="qa-UserTableHeaderColumn-selectedCount">
                        {this.props.selectedCount} Selected
                    </strong>
                    <IconButton
                        style={styles.iconButton}
                        iconStyle={{ color: '#4598bf' }}
                        onClick={this.handleOpen}
                    >
                        <MoreHorizIcon />
                    </IconButton>
                    <GroupsDropDownMenu
                        open={this.state.open}
                        anchorEl={this.state.popoverAnchor}
                        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                        targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                        onClose={this.handleClose}
                        onMenuItemClick={this.props.handleItemClick}
                        onNewGroupClick={this.handleNewGroupClick}
                        values={this.props.menuValues}
                        groups={this.props.groups}
                        groupsLoading={this.props.groupsLoading}
                    />
                    <DropDownMenu
                        value={this.props.sortValue}
                        onChange={this.props.handleSortChange}
                        style={styles.dropDown}
                        labelStyle={styles.dropDownLabel}
                        iconStyle={styles.dropDownIcon}
                        underlineStyle={{ display: 'none' }}
                        menuItemStyle={{ color: '#707274' }}
                        selectedMenuItemStyle={{ color: '#4598bf' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                        className="qa-UserTableHeaderColumn-DropDownMenu-sort"
                    >
                        <MenuItem value={1} primaryText="Sort By" />
                        <MenuItem value={2} primaryText="Or This One" />
                        <MenuItem value={3} primaryText="Another" />
                        <MenuItem value={4} primaryText="Last One" />
                    </DropDownMenu>
                </div>
            </TableHeaderColumn>
        );
    }
}

UserTableHeaderColumn.propTypes = {
    selectedCount: PropTypes.number.isRequired,
    sortValue: PropTypes.number.isRequired,
    handleSortChange: PropTypes.func.isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    groupsLoading: PropTypes.bool.isRequired,
    menuValues: PropTypes.arrayOf(PropTypes.number).isRequired,
    handleItemClick: PropTypes.func.isRequired,
    handleNewGroupClick: PropTypes.func.isRequired,
};

export default UserTableHeaderColumn;
