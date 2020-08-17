import * as React from 'react';
import {
    createStyles, Theme, withStyles, withTheme,
} from '@material-ui/core';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import { connect } from 'react-redux';
import IconMenu from '../common/IconMenu';
import CustomScrollbar from '../common/CustomScrollbar';
import PageLoading from '../common/PageLoading';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    item: {
        height: '32px',
        lineHeight: '32px',
        padding: '0px 20px',
        fontSize: '15px',
        color: theme.eventkit.colors.primary,
    },
    subHeading: {
        padding: '10px 20px 5px',
        color: theme.eventkit.colors.text_primary,
        display: 'block',
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
    paginationRange: {
        marginLeft: '5px',
        fontSize: '10px',
        fontStyle: 'italic',
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
    noResultsContainer: {
        textAlign: 'center',
        marginTop: '80%',
    },
    noGroupTitle: {
        fontSize: '10px,',
    },
    noGroupResultsText: {
        fontStyle: 'italic',
        fontSize: '10px',
        color: theme.eventkit.colors.grey,
    },
    spinnerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1400,
        pointerEvents: 'none',
    },
});

export interface Props {
    ownedGroups: Eventkit.Group[];
    sharedGroups: Eventkit.Group[];
    otherGroups: Eventkit.Group[];
    groups: Eventkit.Store.Groups;
    selectedTab: string;
    selectedValue: number | string;
    onLeaveGroupClick: (group: Eventkit.Group) => void;
    onDeleteGroupClick: (group: Eventkit.Group) => void;
    onRenameGroupClick: (group: Eventkit.Group) => void;
    onAdministratorInfoClick: () => void;
    onMemberInfoClick: () => void;
    onOtherInfoClick: () => void;
    getGroupsRange: () => string;
    setFetchingGroups: () => void;
    onSelectionChange: (value: string | number) => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export function GroupPanelBody(props: Props) {
    const { classes } = props;

    const selectedGroup = (groupVal) => {
        if (groupVal === 'admin' && props.ownedGroups.length) {
            return props.ownedGroups;
        }
        if (groupVal === 'member' && props.sharedGroups.length) {
            return props.sharedGroups;
        }
        if (groupVal === 'none' && props.otherGroups.length) {
            return props.otherGroups;
        }
    };

    const handleGroupClick = (val) => {
        if (val === 'admin') {
            return props.onAdministratorInfoClick;
        }
        if (val === 'member') {
            return props.onMemberInfoClick;
        }
        if (val === 'none') {
            return props.onOtherInfoClick;
        }
    };

    const handleResultsText = (val) => {
        if (val === 'admin') {
            return 'There may be results in the Member and Other tabs.';
        }
        if (val === 'member') {
            return 'There may be results in the Admin and Other tabs.';
        }
        if (val === 'none') {
            return 'There may be results in the Admin and Member tabs.';
        }
    };

    return (
        <>
            <span className={`qa-GroupsDrawer-groupsHeading ${classes.subHeading}`}>
                {props.selectedTab === 'admin'
                && <strong>ADMINISTRATOR</strong>
                }
                {props.selectedTab === 'member'
                && <strong>MEMBER ONLY</strong>
                }
                {props.selectedTab === 'none'
                && <strong>ALL OTHERS</strong>
                }
                <span
                    className={classes.paginationRange}
                    id="range"
                >
                    {props.getGroupsRange()}
                </span>
                <InfoIcon
                    onClick={
                        handleGroupClick(props.selectedTab)}
                    className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                />
            </span>
            <CustomScrollbar className="qa-GroupsDrawer-CustomScrollbar" style={{ height: 'calc(100% - 145px)' }}>
                <span className={classes.spinnerContainer}>
                    {props.groups.fetching
                        ? (
                            <PageLoading background="transparent" partial />
                        )
                        : null
                    }
                </span>
                <MenuList className="qa-GroupsDrawer-MenuList">
                    {
                        selectedGroup(props.selectedTab) ? selectedGroup(props.selectedTab).map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                onClick={() => props.onSelectionChange(group.id)}
                                selected={
                                    props.selectedValue === group.id}
                                className={`.qa-GroupsDrawer-groupItem ${classes.item}`}
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
                                        onClick={() => {
                                            props.onRenameGroupClick(group);
                                        }}
                                    >
                                            Change Group Name
                                    </MenuItem>
                                    <MenuItem
                                        key="leave"
                                        className={`qa-GroupsDrawer-group-leave ${classes.itemWarn}`}
                                        onClick={() => {
                                            props.onLeaveGroupClick(group);
                                        }}
                                    >
                                            Leave Group
                                    </MenuItem>
                                    <MenuItem
                                        key="delete"
                                        className={`qa-GroupsDrawer-group-delete ${classes.itemWarn}`}
                                        onClick={() => {
                                            props.onDeleteGroupClick(group);
                                        }}
                                    >
                                            Delete Group
                                    </MenuItem>
                                </IconMenu>
                            </MenuItem>
                        ))
                            : (
                                <div className={classes.noResultsContainer}>
                                    <div className={classes.noGroupTitle}>
                                        No Results Found in this Group.
                                    </div>
                                    <div className={classes.noGroupResultsText}>
                                        {handleResultsText(props.selectedTab)}
                                    </div>
                                </div>
                            )
                    }
                </MenuList>
            </CustomScrollbar>
        </>
    );
}

function mapStateToProps(state) {
    return {
        groups: state.groups,
    };
}

export default withTheme()(withStyles(jss)(connect(mapStateToProps)(GroupPanelBody)));
