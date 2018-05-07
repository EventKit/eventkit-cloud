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
import ActionSearch from 'material-ui/svg-icons/action/search';
import CustomScrollbar from '../CustomScrollbar';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import { TextField } from 'material-ui';

export class GroupsDrawer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            text: '',
        };
    }
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
            heading: {
                padding: '10px 20px 5px',
                display: 'block',
                fontSize: '18px',
            },
            subHeading: {
                padding: '10px 20px 5px',
                color: '#707274',
                display: 'block',
            },
            addGroupIcon: {
                fill: '#4598bf',
                height: '24px',
                width: '17px',
                marginRight: '5px',
                verticalAlign: 'bottom',
                cursor: 'pointer',
            },
            innerDiv: {
                padding: '0px 48px 0px 20px',
            },
            groupName: {
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                flex: '0 1 auto',
                paddingRight: '5px',
            },
            infoIcon: {
                fill: '#4598bf',
                height: '20px',
                width: '17px',
                marginLeft: '10px',
                verticalAlign: 'text-top',
                cursor: 'pointer',
            },
            groupActionList: {
                paddingTop: '4px',
                paddingBottom: '4px',
            },
            groupActionItem: {
                fontSize: '14px',
                minHeight: '36px',
                lineHeight: '36px',
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
                    <span
                        style={styles.heading}
                        className="qa-GroupsDrawer-membersHeading"
                    >
                        <strong>MEMBERS</strong>
                    </span>
                    <MenuItem
                        primaryText={`All (${this.props.usersCount})`}
                        style={styles.simpleMenuItem}
                        innerDivStyle={styles.innerDiv}
                        className="qa-GroupsDrawer-allMembers"
                        value="all"
                    />
                </Menu>
                <Divider className="qa-GroupsDrawer-Divider" />
                
                <span
                    style={styles.heading}
                    className="qa-GroupsDrawer-membersHeading"
                >
                    <strong>GROUPS</strong>
                    <EnhancedButton
                        style={{ fontSize: '13px', color: '#4598bf', float: 'right', lineHeight: '24px', padding: '0px 10px' }}
                        onClick={this.props.onNewGroupClick}
                    >
                        <AddCircleIcon
                            style={styles.addGroupIcon}
                            className="qa-GroupsDrawer-addGroupIcon"
                        />
                        <strong>NEW GROUP</strong>
                    </EnhancedButton>
                </span>
                <CustomScrollbar className="qa-GroupsDrawer-CustomScrollbar" style={{ height: 'calc(100% - 145px)' }} >
                    <div style={{ padding: '10px 20px 5px' }}>
                        <ActionSearch style={{ marginTop: '2px', height: '28px', width: '28px', verticalAlign: 'top' }} />
                        <TextField
                            id="group-search"
                            type="search"
                            hintText="Search Groups"
                            hintStyle={{ bottom: 0 }}
                            style={{ width: '170px', height: '30px', lineHeight: '30px', padding: '0px 10px 0px 5px' }}
                            underlineStyle={{ bottom: '3px', borderBottom: 'none #fff' }}
                            underlineFocusStyle={{ borderBottom: '1px solid #4598bf', width: 'calc(100% - 15px)' }}
                            value={this.state.text}
                            onChange={(e, v) => { this.setState({ text: v }); }}
                        />
                    </div>
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
                        <span
                            style={styles.subHeading}
                            className="qa-GroupsDrawer-groupsHeading"
                        >
                            <strong>ADMINISTRATOR</strong>
                            <InfoIcon
                                style={styles.infoIcon}
                                onClick={this.props.onAdministratorInfoClick}
                                className="qa-GroupsDrawer-infoIcon"
                            />
                        </span>
                        {this.props.ownedGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                primaryText={
                                    <div style={{ display: 'flex', maxWidth: '178px' }}>
                                        <div style={styles.groupName}>
                                            {group.name}
                                        </div>
                                        <div style={{ flex: '0 0 auto' }}>
                                            ({group.members.length})
                                        </div>
                                    </div>
                                }
                                innerDivStyle={styles.innerDiv}
                                style={{ color: '#4598bf' }}
                                rightIcon={
                                    <IconMenu
                                        iconButtonElement={
                                            <IconButton style={{ padding: '0px', width: '24px', height: '24px' }}>
                                                <Vert />
                                            </IconButton>
                                        }
                                        listStyle={styles.groupActionList}
                                        menuItemStyle={styles.groupActionItem}
                                        className="qa-GroupsDrawer-groupOptions"
                                    >
                                        <MenuItem
                                            className="qa-GroupsDrawer-group-rename"
                                            primaryText="Change Group Name"
                                            style={{ color: '#707274' }}
                                            onClick={() => { this.props.onRenameGroupClick(group); }}
                                        />
                                        <MenuItem
                                            className="qa-GroupsDrawer-group-leave"
                                            primaryText="Leave Group"
                                            style={{ color: '#ce4427', opacity: '0.7' }}
                                            onClick={() => { this.props.onLeaveGroupClick(group); }}
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

                        <span
                            style={styles.subHeading}
                            className="qa-GroupsDrawer-sharedGroupsHeading"
                        >
                            <strong>MEMBER ONLY</strong>
                            <InfoIcon
                                style={styles.infoIcon}
                                onClick={this.props.onMemberInfoClick}
                                className="qa-GroupsDrawer-infoIcon"
                            />
                        </span>
                        {this.props.sharedGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                primaryText={
                                    <div style={{ display: 'flex', maxWidth: '178px' }}>
                                        <div style={styles.groupName}>
                                            {group.name}
                                        </div>
                                        <div style={{ flex: '0 0 auto' }}>
                                            ({group.members.length})
                                        </div>
                                    </div>
                                }
                                style={{ color: '#4598bf' }}
                                innerDivStyle={styles.innerDiv}
                                rightIcon={
                                    <IconMenu
                                        iconButtonElement={
                                            <IconButton style={{ padding: '0px', width: '24px', height: '24px' }}>
                                                <Vert />
                                            </IconButton>
                                        }
                                        listStyle={styles.groupActionList}
                                        menuItemStyle={styles.groupActionItem}
                                        className="qa-GroupsDrawer-groupOptions"
                                    >
                                        <MenuItem
                                            className="qa-GroupsDrawer-group-leave"
                                            primaryText="Leave Group"
                                            style={{ color: '#ce4427', opacity: '0.7' }}
                                            onClick={() => { this.props.onLeaveGroupClick(group); }}
                                        />
                                    </IconMenu>
                                }
                                className="qa-GroupsDrawer-sharedGroupItem"
                            />
                        ))}

                        <span
                            style={styles.subHeading}
                            className="qa-GroupsDrawer-allGroupsHeading"
                        >
                            <strong>ALL OTHERS</strong>
                            <InfoIcon
                                style={styles.infoIcon}
                                onClick={this.props.onOtherInfoClick}
                                className="qa-GroupsDrawer-infoIcon"
                            />
                        </span>
                        {this.props.otherGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                primaryText={
                                    <div style={{ display: 'flex', maxWidth: '178px' }}>
                                        <div style={styles.groupName}>
                                            {group.name}
                                        </div>
                                        <div style={{ flex: '0 0 auto' }}>
                                            ({group.members.length})
                                        </div>
                                    </div>
                                }
                                style={{ color: '#4598bf' }}
                                innerDivStyle={styles.innerDiv}
                                className="qa-GroupsDrawer-otherGroupItem"
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
    otherGroups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    usersCount: PropTypes.number.isRequired,
    onNewGroupClick: PropTypes.func.isRequired,
    onAdministratorInfoClick: PropTypes.func.isRequired,
    onMemberInfoClick: PropTypes.func.isRequired,
    onOtherInfoClick: PropTypes.func.isRequired,
    onLeaveGroupClick: PropTypes.func.isRequired,
    onDeleteGroupClick: PropTypes.func.isRequired,
    onRenameGroupClick: PropTypes.func.isRequired,
};

export default GroupsDrawer;
