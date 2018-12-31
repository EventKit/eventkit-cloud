import * as React from 'react';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import ButtonBase from '@material-ui/core/ButtonBase';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import IconMenu from '../common/IconMenu';
import CustomScrollbar from '../CustomScrollbar';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    drawer: {
        backgroundColor: theme.eventkit.colors.white,
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
        color: theme.eventkit.colors.primary,
    },
    heading: {
        padding: '10px 20px 5px',
        display: 'block',
        fontSize: '18px',
    },
    subHeading: {
        padding: '10px 20px 5px',
        color: theme.eventkit.colors.text_primary,
        display: 'block',
    },
    newGroupIcon: {
        fill: theme.eventkit.colors.primary,
        height: '24px',
        width: '17px',
        marginRight: '5px',
        verticalAlign: 'bottom',
        cursor: 'pointer',
    },
    newGroupBtn: {
        fontSize: '13px',
        color: theme.eventkit.colors.primary,
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
        fill: theme.eventkit.colors.primary,
        height: '20px',
        width: '17px',
        marginLeft: '10px',
        verticalAlign: 'text-top',
        cursor: 'pointer',
    },
    itemWarn: {
        color: theme.eventkit.colors.warning,
        opacity: 0.7,
        fontSize: '14px',
    },
    itemRename: {
        color: theme.eventkit.colors.text_primary,
        fontSize: '14px',
    },
});

export interface Props {
    className?: string;
    selectedValue: number | string;
    onSelectionChange: (value: string | number) => void;
    open: boolean;
    ownedGroups: Eventkit.Group[];
    sharedGroups: Eventkit.Group[];
    otherGroups: Eventkit.Group[];
    usersCount: number;
    onNewGroupClick: () => void;
    onAdministratorInfoClick: () => void;
    onMemberInfoClick: () => void;
    onOtherInfoClick: () => void;
    onLeaveGroupClick: (group: Eventkit.Group) => void;
    onDeleteGroupClick: (group: Eventkit.Group) => void;
    onRenameGroupClick: (group: Eventkit.Group) => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export class GroupsDrawer extends React.Component<Props, {}> {
    render() {
        const { classes } = this.props;

        return (
            <Drawer
                variant="persistent"
                anchor="right"
                open={this.props.open}
                className="qa-GroupsDrawer-Drawer"
                classes={{ paper: classes.drawer }}
            >
                <MenuList
                    className="qa-GroupsDrawer-MenuList"
                    style={{ padding: '16px 0px' }}
                >
                    <span
                        className={`qa-GroupsDrawer-membersHeading ${classes.heading}`}
                    >
                        <strong>MEMBERS</strong>
                    </span>
                    <MenuItem
                        className={`qa-GroupsDrawer-allMembers ${classes.item}`}
                        value="all"
                        onClick={() => this.props.onSelectionChange('all')}
                        selected={this.props.selectedValue === 'all'}
                    >
                        {`All (${this.props.usersCount})`}
                    </MenuItem>
                </MenuList>

                <Divider className="qa-GroupsDrawer-Divider" />

                <span
                    className={`qa-GroupsDrawer-membersHeading ${classes.heading}`}
                >
                    <strong>GROUPS</strong>
                    <ButtonBase
                        onClick={this.props.onNewGroupClick}
                        className={`qa-GroupsDrawer-addGroup ${classes.newGroupBtn}`}
                    >
                        <AddCircleIcon
                            className={`qa-GroupsDrawer-newGroupIcon ${classes.newGroupIcon}`}
                        />
                        <strong>NEW GROUP</strong>
                    </ButtonBase>
                </span>

                <CustomScrollbar className="qa-GroupsDrawer-CustomScrollbar" style={{ height: 'calc(100% - 145px)' }} >
                    <MenuList
                        className="qa-GroupsDrawer-MenuList"
                    >
                        <span
                            className={`qa-GroupsDrawer-groupsHeading ${classes.subHeading}`}
                        >
                            <strong>ADMINISTRATOR</strong>
                            <InfoIcon
                                onClick={this.props.onAdministratorInfoClick}
                                className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                            />
                        </span>
                        {this.props.ownedGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                onClick={() => this.props.onSelectionChange(group.id)}
                                selected={this.props.selectedValue === group.id}
                                className={`qa-GroupsDrawer-groupItem ${classes.item}`}
                            >
                                <div style={{ display: 'flex', flex: '1 1 auto', maxWidth: 250 - 40 - 32 }}>
                                    <div className={classes.groupName}>
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
                                        className={`qa-GroupsDrawer-group-rename ${classes.itemRename}`}
                                        onClick={() => { this.props.onRenameGroupClick(group); }}
                                    >
                                        Change Group Name
                                    </MenuItem>
                                    <MenuItem
                                        key="leave"
                                        className={`qa-GroupsDrawer-group-leave ${classes.itemWarn}`}
                                        onClick={() => { this.props.onLeaveGroupClick(group); }}
                                    >
                                        Leave Group
                                    </MenuItem>
                                    <MenuItem
                                        key="delete"
                                        className={`qa-GroupsDrawer-group-delete ${classes.itemWarn}`}
                                        onClick={() => { this.props.onDeleteGroupClick(group); }}
                                    >
                                        Delete Group
                                    </MenuItem>
                                </IconMenu>
                            </MenuItem>
                        ))}

                        <span
                            className={`qa-GroupsDrawer-sharedGroupsHeading ${classes.subHeading}`}
                        >
                            <strong>MEMBER ONLY</strong>
                            <InfoIcon
                                onClick={this.props.onMemberInfoClick}
                                className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                            />
                        </span>
                        {this.props.sharedGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                onClick={() => this.props.onSelectionChange(group.id)}
                                selected={this.props.selectedValue === group.id}
                                className={`qa-GroupsDrawer-sharedGroupItem ${classes.item}`}
                            >
                                <div style={{ display: 'flex', flex: '1 1 auto', maxWidth: 250 - 40 - 32 }}>
                                    <div className={classes.groupName}>
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
                                        className={`qa-GroupsDrawer-group-leave ${classes.itemWarn}`}
                                        onClick={() => { this.props.onLeaveGroupClick(group); }}
                                    >
                                        Leave Group
                                    </MenuItem>
                                    ]
                                </IconMenu>
                            </MenuItem>
                        ))}

                        <span
                            className={`qa-GroupsDrawer-allGroupsHeading ${classes.subHeading}`}
                        >
                            <strong>ALL OTHERS</strong>
                            <InfoIcon
                                onClick={this.props.onOtherInfoClick}
                                className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                            />
                        </span>
                        {this.props.otherGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                onClick={() => this.props.onSelectionChange(group.id)}
                                selected={this.props.selectedValue === group.id}
                                className={`qa-GroupsDrawer-otherGroupItem ${classes.item}`}
                            >
                                <div style={{ display: 'flex', maxWidth: 250 - 40 - 32 }}>
                                    <div className={classes.groupName}>
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

export default withTheme()(withStyles(jss)(GroupsDrawer));
