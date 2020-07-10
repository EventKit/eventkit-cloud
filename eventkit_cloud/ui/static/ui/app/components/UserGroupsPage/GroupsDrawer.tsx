import * as React from 'react';
import {
    withTheme, Theme, withStyles, createStyles,
} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import ButtonBase from '@material-ui/core/ButtonBase';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import {
    Tab, Tabs,
} from '@material-ui/core';
import {useEffect, useState} from 'react';
import CustomScrollbar from '../common/CustomScrollbar';
import IconMenu from '../common/IconMenu';
import {connect} from "react-redux";
import {getCollectiveGroups, getOneGroup} from "../../actions/groupActions";
import {useEffectOnMount} from "../../utils/hooks";

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
    divider: {
        backgroundColor: theme.eventkit.colors.text_primary,
    },
    tabs: {
        visibility: 'visible',
        marginLeft: '25px',
        marginRight: '-1px',
        color: theme.eventkit.colors.text_primary,
    },
    tab: {
        opacity: 0.9,
        textTransform: 'none',
        fontSize: '11px',
        minWidth: '0',
        borderTopRightRadius: '5px',
        borderTopLeftRadius: '5px',
        backgroundColor: '#d6d6d6',
        border: 'solid 1px #707274',
        margin: '1px',
        '&$selected': {
            backgroundColor: theme.eventkit.colors.white,
        },
    },
    selected: {},
});

export interface Props {
    className?: string;
    selectedValue: number | string;
    onSelectionChange: (value: string | number) => void;
    open: boolean;
    groups: Eventkit.Store.Groups;
    ownedGroups: Eventkit.Group[];
    sharedGroups: Eventkit.Group[];
    otherGroups: Eventkit.Group[];
    ownedGroupsCount: Eventkit.Group[];
    sharedGroupsCount: Eventkit.Group[];
    otherGroupsCount: Eventkit.Group[];
    usersCount: number;
    range: string;
    nextPage: boolean;
    total: number;
    onNewGroupClick: () => void;
    onAdministratorInfoClick: () => void;
    onMemberInfoClick: () => void;
    onOtherInfoClick: () => void;
    onLeaveGroupClick: (group: Eventkit.Group) => void;
    onDeleteGroupClick: (group: Eventkit.Group) => void;
    onRenameGroupClick: (group: Eventkit.Group) => void;
    handleLoadNextGroups: () => void;
    handleLoadPreviousGroups: () => void;
    getOneGroup: (args: any) => void;
    getCollectiveGroups: (args: any) => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
    user: Eventkit.User['user'];
    page: number;
}

export function GroupsDrawer(props: Props) {
    const pageSize = 20;
    const {classes} = props;
    const [selectedTab, setSelectedTab] = useState('admin');
    const [page, setPage] = useState(1);

    // useEffectOnMount(() => {
    //     props.getCollectiveGroups({
    //         user: props.user.username,
    //         page_size: 100,
    //     });
    // });

    const makePartialGroupsRequest = async (params: {}) => {
        await props.getOneGroup({
            ...params,
        });
    };

    const handleChange = (event, newValue) => {
        if (selectedTab === newValue) {
            setSelectedTab('');
        } else {
            setSelectedTab(newValue);
            makePartialGroupsRequest({page: 1, page_size: pageSize, permission_level: newValue});
            setPage(1);
        }
    };

    const loadNext = () => {
        if (props.nextPage) {
            makePartialGroupsRequest({page: page + 1, page_size: pageSize, permission_level: selectedTab});
            setPage(page + 1);
        }
    };

    const loadPrevious = () => {
        makePartialGroupsRequest({page: page - 1, page_size: pageSize, permission_level: selectedTab});
        setPage(page - 1);
    };

    const loadNextDisabled = () => {
        if (selectedTab === 'admin') {
            if (!props.nextPage) {
                return true;
            }
        }
        if (selectedTab === 'member') {
            if (!props.nextPage) {
                return true;
            }
        }
        if (selectedTab === 'none') {
            if (!props.nextPage) {
                return true;
            }
        }
    };

    const loadPreviousDisabled = () => {
        if (selectedTab === 'admin') {
            if (page === 1) {
                return true;
            }
        }
        if (selectedTab === 'member') {
            if (page === 1) {
                return true;
            }
        }
        if (selectedTab === 'none') {
            if (page === 1) {
                return true;
            }
        }
    };

    return (
        <Drawer
            variant="persistent"
            anchor="right"
            open={
                props.open}
            className="qa-GroupsDrawer-Drawer"
            classes={{paper: classes.drawer}}
        >
            <MenuList
                className="qa-GroupsDrawer-MenuList"
                style={{padding: '16px 0px'}}
            >
                <span
                    className={`qa-GroupsDrawer-membersHeading ${classes.heading}`}
                >
                    <strong>MEMBERS</strong>
                </span>
                <MenuItem
                    className={`qa-GroupsDrawer-allMembers ${classes.item}`}
                    value="all"
                    onClick={() => props.onSelectionChange('all')}
                    selected={
                        props.selectedValue === 'all'}
                >
                    {`All (${
                        props.usersCount})`}
                </MenuItem>
            </MenuList>

            <Divider className={classes.divider}/>

            <span
                className={`qa-GroupsDrawer-membersHeading ${classes.heading}`}
            >
                <strong>GROUPS</strong>
                <ButtonBase
                    onClick={
                        props.onNewGroupClick}
                    className={`qa-GroupsDrawer-addGroup ${classes.newGroupBtn}`}
                >
                    <AddCircleIcon
                        className={`qa-GroupsDrawer-newGroupIcon ${classes.newGroupIcon}`}
                    />
                    <strong>NEW GROUP</strong>
                </ButtonBase>
            </span>
            <Tabs
                className={classes.tabs}
                value={(selectedTab) || false}
                onChange={handleChange}
            >
                <Tab
                    style={{width: '32%'}}
                    value="admin"
                    classes={{
                        root: classes.tab,
                        selected: classes.selected,
                    }}
                    label={(
                        <span style={{display: "inline"}}>
                            <div><strong>Admin</strong></div>
                            {/*<div style={{fontStyle: 'italic', color: 'grey'}}>*/}
                            {/* TODO: figure out how to display response.totalGroup count here*/}
                            {/*({props.ownedGroupsCount})*/}
                            {/*({props.total})*/}
                            {/*</div>*/}
                        </span>
                    )}
                />
                <Tab
                    style={{width: '32%'}}
                    value="member"
                    classes={{
                        root: classes.tab,
                        selected: classes.selected,
                    }}
                    label={(
                        <span style={{display: "inline"}}>
                            <div><strong>Member</strong></div>
                            {/*<div style={{fontStyle: 'italic', color: 'grey'}}>*/}
                            {/*({props.sharedGroupsCount})*/}
                            {/*({props.total})*/}
                            {/*</div>*/}
                        </span>
                    )}
                />
                <Tab
                    style={{width: '32%'}}
                    value="none"
                    classes={{
                        root: classes.tab,
                        selected: classes.selected,
                    }}
                    label={(
                        <span style={{display: "inline"}}>
                            <div><strong>Other</strong></div>
                            {/*<div style={{fontStyle: 'italic', color: 'grey'}}>*/}
                            {/*({props.otherGroupsCount})*/}
                            {/*({props.total})*/}
                            {/*</div>*/}
                        </span>
                    )}
                />
            </Tabs>
            <Divider className={classes.divider}/>
            {selectedTab === 'admin' &&
            <>
                    <span
                        className={`qa-GroupsDrawer-groupsHeading ${classes.subHeading}`}
                        style={{display: 'flex'}}
                    >
                        <strong>ADMINISTRATOR</strong>
                        {/* TODO: create function that sets this dynamically for each group category*/}
                        {/*<div*/}
                        {/*    className="pagination-range"*/}
                        {/*    id="range"*/}
                        {/*    style={{marginLeft: '5px', fontSize: '12px'}}*/}
                        {/*>*/}
                        {/*    { props.range ? props.range : null}*/}
                        {/*</div>*/}
                        <InfoIcon
                            onClick={
                                props.onAdministratorInfoClick}
                            className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                        />
                    </span>
                <CustomScrollbar className="qa-GroupsDrawer-CustomScrollbar" style={{height: 'calc(100% - 145px)'}}>
                    <MenuList className="qa-GroupsDrawer-MenuList">
                        {
                            props.ownedGroups.map(group => (
                                <MenuItem
                                    key={group.name}
                                    value={group.id}
                                    onClick={() => props.onSelectionChange(group.id)}
                                    selected={
                                        props.selectedValue === group.id}
                                    className={`qa-GroupsDrawer-groupItem ${classes.item}`}
                                >
                                    <div style={{display: 'flex', flex: '1 1 auto', maxWidth: 250 - 40 - 32}}>
                                        <div className={classes.groupName}>
                                            {group.name}
                                        </div>
                                        <div style={{flex: '0 0 auto'}}>
                                            ({group.members.length})
                                        </div>
                                    </div>
                                    <IconMenu
                                        className="qa-GroupsDrawer-groupOptions"
                                        style={{height: '32px', width: '32px', padding: '0px'}}
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
                            ))}
                    </MenuList>
                </CustomScrollbar>
            </>
            }
            {selectedTab === 'member' &&
            <>
                <span
                    className={`qa-GroupsDrawer-sharedGroupsHeading ${classes.subHeading}`}
                >
                        <strong>MEMBER ONLY</strong>
                        <InfoIcon
                            onClick={
                                props.onMemberInfoClick}
                            className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                        />
                </span>
                <CustomScrollbar style={{height: 'calc(100% - 145px)'}}>
                    <MenuList className="qa-GroupsDrawer-MenuList">
                        {props.sharedGroups.map(group => (
                            <MenuItem
                                key={group.name}
                                value={group.id}
                                onClick={() => props.onSelectionChange(group.id)}
                                selected={
                                    props.selectedValue === group.id}
                                className={`qa-GroupsDrawer-sharedGroupItem ${classes.item}`}
                            >
                                <div style={{display: 'flex', flex: '1 1 auto', maxWidth: 250 - 40 - 32}}>
                                    <div className={classes.groupName}>
                                        {group.name}
                                    </div>
                                    <div style={{flex: '0 0 auto'}}>
                                        ({group.members.length})
                                    </div>
                                </div>
                                <IconMenu
                                    className="qa-GroupsDrawer-groupOptions"
                                    style={{width: '32px', height: '32px'}}
                                >
                                    [
                                    <MenuItem
                                        key="leave"
                                        className={`qa-GroupsDrawer-group-leave ${classes.itemWarn}`}
                                        onClick={() => {
                                            props.onLeaveGroupClick(group);
                                        }}
                                    >
                                        Leave Group
                                    </MenuItem>
                                    ]
                                </IconMenu>
                            </MenuItem>
                        ))}
                    </MenuList>
                </CustomScrollbar>
            </>
            }
            {selectedTab === 'none' &&
            <>
                <span
                    className={`qa-GroupsDrawer-allGroupsHeading ${classes.subHeading}`}
                >
                <strong>ALL OTHERS</strong>
                <InfoIcon
                    onClick={
                        props.onOtherInfoClick}
                    className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                />
                </span>
                <CustomScrollbar style={{height: 'calc(100% - 145px)'}}>
                    <MenuList className="qa-GroupsDrawer-MenuList">
                        {
                            props.otherGroups.map(group => (
                                <MenuItem
                                    key={group.name}
                                    value={group.id}
                                    onClick={() => props.onSelectionChange(group.id)}
                                    selected={
                                        props.selectedValue === group.id}
                                    className={`qa-GroupsDrawer-otherGroupItem ${classes.item}`}
                                >
                                    <div style={{display: 'flex', maxWidth: 250 - 40 - 32}}>
                                        <div className={classes.groupName}>
                                            {group.name}
                                        </div>
                                        <div style={{flex: '0 0 auto'}}>
                                            ({group.members.length})
                                        </div>
                                    </div>
                                </MenuItem>
                            ))}
                    </MenuList>
                </CustomScrollbar>
            </>
            }
            <div
                className="show-buttons"
                style={{display: 'flex'}}
            >
                <Button
                    className="qa-showPrevious"
                    variant="contained"
                    color="secondary"
                    style={{minWidth: '117px', margin: '5px 2.5px', fontSize: '12px'}}
                    disabled={
                        loadPreviousDisabled()}
                    onClick={loadPrevious}
                >
                    <ArrowLeftIcon style={{fontSize: 'x-large'}}/>
                    PREVIOUS
                </Button>
                <Button
                    className="qa-showNext"
                    variant="contained"
                    color="secondary"
                    style={{minWidth: '117px', margin: '5px 2.5px', fontSize: '12px'}}
                    disabled={
                        loadNextDisabled()}
                    onClick={loadNext}
                >
                    NEXT
                    <ArrowRightIcon style={{fontSize: 'x-large'}}/>
                </Button>
            </div>
        </Drawer>
    );
}

function mapStateToProps(state) {
    return {
        groups: state.groups,
        user: state.user.data.user,
        nextPage: state.groups.nextPage,
        total: state.groups.total,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getOneGroup: params => (
            dispatch(getOneGroup(params))
        ),
        getCollectiveGroups: params => (
            dispatch(getCollectiveGroups(params))
        ),
    };
}

export default withTheme()(withStyles(jss)(connect(mapStateToProps, mapDispatchToProps)(GroupsDrawer)));