import React, { Component, PropTypes } from 'react';
import Drawer from 'material-ui/Drawer';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import InfoIcon from 'material-ui/svg-icons/action/info-outline';
import AddCircleIcon from 'material-ui/svg-icons/content/add-circle';
import IndeterminateIcon from 'material-ui/svg-icons/toggle/indeterminate-check-box';
import CustomScrollbar from '../CustomScrollbar';

export class GroupsDrawer extends Component {
    render() {
        const styles = {
            drawer: {
                backgroundColor: '#fff',
                top: '130px',
                height: window.innerHeight - 130,
                overflow: 'visible',
            },
            simpleMenuItem: {
                color: '#4598bf',
            },
            groupsHeading: {
                padding: '30px 24px 5px',
                color: '#707274',
                display: 'block',
            },
            addGroupIcon: {
                fill: '#4598bf',
                height: '20px',
                width: '17px',
                marginLeft: '10px',
                verticalAlign: 'text-top',
                cursor: 'pointer',
            },
            menuItemText: {
                width: '178px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            menuItemIcon: {
                fill: 'ce4427',
                width: '17px',
                cursor: 'pointer',
            },
            sharedGroupsHeading: {
                padding: '10px 24px 5px',
                color: '#707274',
                display: 'block',
            },
            sharedGroupsInfoIcon: {
                fill: '#4598bf',
                height: '20px',
                width: '17px',
                marginLeft: '10px',
                verticalAlign: 'text-top',
                cursor: 'pointer',
            },
        };

        const myGroups = [];
        const sharedGroups = [];

        this.props.groups.forEach((group) => {
            if (group.owners.find(owner => owner === this.props.user.username)) {
                myGroups.push(group);
            } else {
                sharedGroups.push(group);
            }
        });

        return (
            <Drawer
                width={250}
                openSecondary
                open={this.props.open}
                containerStyle={styles.drawer}
                className="qa-GroupsDrawer-Drawer"
            >
                <CustomScrollbar className="qa-GroupsDrawer-CustomScrollbar">
                    <Menu
                        disableAutoFocus
                        autoWidth={false}
                        desktop
                        width={250}
                        className="qa-GroupsDrawer-Menu"
                        onChange={this.props.onSelectionChange}
                        selectedMenuItemStyle={{ ...styles.simpleMenuItem, backgroundColor: '#e8eef5' }}
                        value={this.props.selectedValue}
                    >
                        <MenuItem
                            primaryText={`All Members (${this.props.usersCount})`}
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-allMembers"
                            value="all"
                        />
                        <MenuItem
                            primaryText="New"
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-new"
                            value="new"
                        />
                        <MenuItem
                            primaryText="Not Grouped"
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-notGrouped"
                            value="ungrouped"
                        />
                        <MenuItem
                            primaryText="Most Shared"
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-mostShared"
                            value="shared"
                        />

                        <span
                            style={styles.groupsHeading}
                            className="qa-GroupsDrawer-groupsHeading"
                        >
                            <strong>MY GROUPS</strong>
                            <AddCircleIcon
                                style={styles.addGroupIcon}
                                onClick={this.props.onNewGroupClick}
                                className="qa-GroupsDrawer-addGroupIcon"
                            />
                        </span>
                        {myGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={`${group.id}`}
                                primaryText={
                                    <div style={styles.menuItemText}>
                                        {`${group.name} (${group.members.length})`}
                                    </div>
                                }
                                innerDivStyle={{ paddingRight: '48px' }}
                                style={{ color: '#4598bf' }}
                                rightIcon={
                                    <IndeterminateIcon
                                        style={{ ...styles.menuItemIcon, opacity: '0.7' }}
                                        onClick={() => { this.props.onDeleteGroupClick(group); }}
                                        className="qa-GroupsDrawer-groupItem-icon"
                                    />
                                }
                                className="qa-GroupsDrawer-groupItem"
                            />
                        ))}

                        <Divider style={{ marginTop: '40px' }} className="qa-GroupsDrawer-Divider" />

                        <span
                            style={styles.sharedGroupsHeading}
                            className="qa-GroupsDrawer-sharedGroupsHeading"
                        >
                            <strong>SHARED WITH ME</strong>
                            <InfoIcon
                                style={styles.sharedGroupsInfoIcon}
                                onClick={this.props.onSharedInfoClick}
                                className="qa-GroupsDrawer-sharedGroupsInfoIcon"
                            />
                        </span>
                        {sharedGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                primaryText={
                                    <div style={styles.menuItemText}>
                                        {group.name}
                                    </div>
                                }
                                style={{ color: '#707274', opacity: '0.7' }}
                                innerDivStyle={{ paddingRight: '48px' }}
                                disabled
                                rightIcon={
                                    <IndeterminateIcon
                                        style={styles.menuItemIcon}
                                        onClick={() => { this.props.onLeaveGroupClick(group); }}
                                        className="qa-GroupsDrawer-sharedGroupItem-icon"
                                    />
                                }
                                className="qa-GroupsDrawer-sharedGroupItem"
                            />
                        ))}
                    </Menu>
                </CustomScrollbar>
            </Drawer>
        );
    }
}

GroupsDrawer.propTypes = {
    selectedValue: PropTypes.string.isRequired,
    onSelectionChange: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        owners: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    user: PropTypes.shape({
        name: PropTypes.string,
        username: PropTypes.string,
    }).isRequired,
    usersCount: PropTypes.number.isRequired,
    onNewGroupClick: PropTypes.func.isRequired,
    onSharedInfoClick: PropTypes.func.isRequired,
    onLeaveGroupClick: PropTypes.func.isRequired,
    onDeleteGroupClick: PropTypes.func.isRequired,
};

export default GroupsDrawer;
