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
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const styles = {
            drawer: {
                backgroundColor: '#fff',
                top: '130px',
                height: window.innerHeight - 130,
                overflowY: 'hidden',
                overflowX: 'hidden',
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
                        autoWidth={false}
                        desktop
                        width={250}
                        className="qa-GroupsDrawer-Menu"
                    >
                        <MenuItem
                            primaryText="All Members (200)"
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-allMembers"
                            onClick={() => { console.log('all members'); }}
                        />
                        <MenuItem
                            primaryText="New"
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-new"
                            onClick={() => { console.log('new members'); }}
                        />
                        <MenuItem
                            primaryText="Not Grouped"
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-notGrouped"
                            onClick={() => { console.log('not grouped members'); }}
                        />
                        <MenuItem
                            primaryText="Most Shared"
                            style={styles.simpleMenuItem}
                            className="qa-GroupsDrawer-mostShared"
                            onClick={() => { console.log('most shared members'); }}
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
                        {this.props.groups.map(group => (
                            <MenuItem
                                key={group.name}
                                primaryText={
                                    <div style={styles.menuItemText}>
                                        {`${group.name} (${group.memberCount})`}
                                    </div>
                                }
                                innerDivStyle={{ paddingRight: '48px' }}
                                style={{ color: '#4598bf' }}
                                onClick={() => { console.log('menuItem clicked'); }}
                                rightIcon={
                                    <IndeterminateIcon
                                        style={{ ...styles.menuItemIcon, opacity: '0.7' }}
                                        onClick={(e) => { this.props.onDeleteGroupClick(e, group.name); }}
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
                                onClick={() => { console.log('shared info'); }}
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
                                        onClick={() => { this.props.onLeaveGroupClick(group.name); }}
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
    open: PropTypes.bool.isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    sharedGroups: PropTypes.arrayOf(PropTypes.object).isRequired,
    onNewGroupClick: PropTypes.func.isRequired,
    onLeaveGroupClick: PropTypes.func.isRequired,
    onDeleteGroupClick: PropTypes.func.isRequired,
};

export default GroupsDrawer;
