import React, { Component, PropTypes } from 'react';
import Drawer from 'material-ui/Drawer';
import Menu from 'material-ui/Menu';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import Vert from 'material-ui/svg-icons/navigation/more-vert';
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
                fill: '#ce4427',
                width: '17px',
                cursor: 'pointer',
            },
            ownedGroupName: {
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                flex: '0 1 auto',
                paddingRight: '5px',
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
                            primaryText={`New (${this.props.newCount})`}
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-new"
                            value="new"
                        />
                        <MenuItem
                            primaryText={`Not Grouped (${this.props.ungroupedCount})`}
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-notGrouped"
                            value="ungrouped"
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
                        {this.props.ownedGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                primaryText={
                                    <div style={{ display: 'flex', maxWidth: '178px' }}>
                                        <div style={styles.ownedGroupName}>
                                            {group.name}
                                        </div>
                                        <div style={{ flex: '0 0 auto' }}>
                                            ({group.members.length - 1})
                                        </div>
                                    </div>
                                }
                                innerDivStyle={{ paddingRight: '48px' }}
                                style={{ color: '#4598bf' }}
                                rightIcon={
                                    <IconMenu
                                        iconButtonElement={
                                            <IconButton style={{ padding: '0px', width: '24px', height: '24px' }}>
                                                <Vert />
                                            </IconButton>
                                        }
                                        menuItemStyle={{ fontSize: '14px' }}
                                        className="qa-GroupsDrawer-groupOptions"
                                    >
                                        <MenuItem
                                            className="qa-GroupsDrawer-group-rename"
                                            primaryText="Change Group Name"
                                            style={{ color: '#707274' }}
                                            onClick={() => { this.props.onRenameGroupClick(group); }}
                                        />
                                        <MenuItem
                                            className="qa-GroupsDrawer-group-delete"
                                            primaryText="Delete Group"
                                            style={{ color: '#ce4427', opacity: '0.7' }}
                                            onClick={() => { this.props.onDeleteGroupClick(group); }}
                                        />
                                    </IconMenu>
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
                        {this.props.sharedGroups.map(group => (
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
    selectedValue: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
    ]).isRequired,
    onSelectionChange: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    ownedGroups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    sharedGroups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    usersCount: PropTypes.number.isRequired,
    newCount: PropTypes.number.isRequired,
    ungroupedCount: PropTypes.number.isRequired,
    onNewGroupClick: PropTypes.func.isRequired,
    onSharedInfoClick: PropTypes.func.isRequired,
    onLeaveGroupClick: PropTypes.func.isRequired,
    onDeleteGroupClick: PropTypes.func.isRequired,
    onRenameGroupClick: PropTypes.func.isRequired,
};

export default GroupsDrawer;
