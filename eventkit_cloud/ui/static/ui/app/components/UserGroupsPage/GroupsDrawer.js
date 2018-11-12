import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import ButtonBase from '@material-ui/core/ButtonBase';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import IconMenu from '../common/IconMenu';
import CustomScrollbar from '../CustomScrollbar';


export class GroupsDrawer extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            drawer: {
                backgroundColor: colors.white,
                top: '130px',
                height: 'calc(100vh - 130px)',
                overflow: 'visible',
                width: '250px',
            },
            item: {
                height: '32px',
                lineHeight: '32px',
                padding: '0px 20px',
                fontSize: '15px',
                color: colors.primary,
            },
            heading: {
                padding: '10px 20px 5px',
                display: 'block',
                fontSize: '18px',
            },
            subHeading: {
                padding: '10px 20px 5px',
                color: colors.text_primary,
                display: 'block',
            },
            newGroupIcon: {
                fill: colors.primary,
                height: '24px',
                width: '17px',
                marginRight: '5px',
                verticalAlign: 'bottom',
                cursor: 'pointer',
            },
            newGroupBtn: {
                fontSize: '13px',
                color: colors.primary,
                float: 'right',
                lineHeight: '24px',
                padding: '0px 10px',
            },
            groupName: {
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                flex: '0 1 auto',
                paddingRight: '5px',
            },
            infoIcon: {
                fill: colors.primary,
                height: '20px',
                width: '17px',
                marginLeft: '10px',
                verticalAlign: 'text-top',
                cursor: 'pointer',
            },
        };

        return (
            <Drawer
                variant="persistent"
                anchor="right"
                open={this.props.open}
                className="qa-GroupsDrawer-Drawer"
                PaperProps={{ style: styles.drawer }}
            >
                <MenuList
                    width={250}
                    className="qa-GroupsDrawer-MenuList"
                    style={{ padding: '16px 0px' }}
                >
                    <span
                        style={styles.heading}
                        className="qa-GroupsDrawer-membersHeading"
                    >
                        <strong>MEMBERS</strong>
                    </span>
                    <MenuItem
                        style={styles.item}
                        className="qa-GroupsDrawer-allMembers"
                        value="all"
                        onClick={() => this.props.onSelectionChange('all')}
                        selected={this.props.selectedValue === 'all'}
                    >
                        {`All (${this.props.usersCount})`}
                    </MenuItem>
                </MenuList>

                <Divider className="qa-GroupsDrawer-Divider" />

                <span
                    style={styles.heading}
                    className="qa-GroupsDrawer-membersHeading"
                >
                    <strong>GROUPS</strong>
                    <ButtonBase
                        style={styles.newGroupBtn}
                        onClick={this.props.onNewGroupClick}
                        className="qa-GroupsDrawer-addGroup"
                    >
                        <AddCircleIcon
                            style={styles.newGroupIcon}
                            className="qa-GroupsDrawer-newGroupIcon"
                        />
                        <strong>NEW GROUP</strong>
                    </ButtonBase>
                </span>

                <CustomScrollbar className="qa-GroupsDrawer-CustomScrollbar" style={{ height: 'calc(100% - 145px)' }} >
                    <MenuList
                        width={250}
                        className="qa-GroupsDrawer-MenuList"
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
                                onClick={() => this.props.onSelectionChange(group.id)}
                                selected={this.props.selectedValue === group.id}
                                style={styles.item}
                                className="qa-GroupsDrawer-groupItem"
                            >
                                <div style={{ display: 'flex', flex: '1 1 auto', maxWidth: 250 - 40 - 32 }}>
                                    <div style={styles.groupName}>
                                        {group.name}
                                    </div>
                                    <div style={{ flex: '0 0 auto' }}>
                                        ({group.members.length})
                                    </div>
                                </div>
                                <IconMenu
                                    className="qa-GroupsDrawer-groupOptions"
                                    style={{ height: '32px', width: '32px', padding: '0px' }}
                                >
                                    <MenuItem
                                        key="rename"
                                        className="qa-GroupsDrawer-group-rename"
                                        style={{ color: colors.text_primary, fontSize: '14px' }}
                                        onClick={() => { this.props.onRenameGroupClick(group); }}
                                    >
                                        Change Group Name
                                    </MenuItem>
                                    <MenuItem
                                        key="leave"
                                        className="qa-GroupsDrawer-group-leave"
                                        style={{ color: colors.warning, opacity: '0.7', fontSize: '14px' }}
                                        onClick={() => { this.props.onLeaveGroupClick(group); }}
                                    >
                                        Leave Group
                                    </MenuItem>
                                    <MenuItem
                                        key="delete"
                                        className="qa-GroupsDrawer-group-delete"
                                        style={{ color: colors.warning, opacity: '0.7', fontSize: '14px' }}
                                        onClick={() => { this.props.onDeleteGroupClick(group); }}
                                    >
                                        Delete Group
                                    </MenuItem>
                                </IconMenu>
                            </MenuItem>
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
                                onClick={() => this.props.onSelectionChange(group.id)}
                                selected={this.props.selectedValue === group.id}
                                style={styles.item}
                                className="qa-GroupsDrawer-sharedGroupItem"
                            >
                                <div style={{ display: 'flex', flex: '1 1 auto', maxWidth: 250 - 40 - 32 }}>
                                    <div style={styles.groupName}>
                                        {group.name}
                                    </div>
                                    <div style={{ flex: '0 0 auto' }}>
                                        ({group.members.length})
                                    </div>
                                </div>
                                <IconMenu
                                    className="qa-GroupsDrawer-groupOptions"
                                    style={{ width: '32px', height: '32px' }}
                                >
                                    [
                                    <MenuItem
                                        key="leave"
                                        className="qa-GroupsDrawer-group-leave"
                                        style={{ color: colors.warning, opacity: '0.7', fontSize: '14px' }}
                                        onClick={() => { this.props.onLeaveGroupClick(group); }}
                                    >
                                        Leave Group
                                    </MenuItem>
                                    ]
                                </IconMenu>
                            </MenuItem>
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
                                onClick={() => this.props.onSelectionChange(group.id)}
                                selected={this.props.selectedValue === group.id}
                                style={styles.item}
                                className="qa-GroupsDrawer-otherGroupItem"
                            >
                                <div style={{ display: 'flex', maxWidth: 250 - 40 - 32 }}>
                                    <div style={styles.groupName}>
                                        {group.name}
                                    </div>
                                    <div style={{ flex: '0 0 auto' }}>
                                        ({group.members.length})
                                    </div>
                                </div>
                            </MenuItem>
                        ))}
                    </MenuList>
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
    theme: PropTypes.object.isRequired,
};

export default withTheme()(GroupsDrawer);
