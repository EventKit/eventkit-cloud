import * as React from 'react';
import {
    createStyles, Theme,
    withStyles,
    withTheme
} from "@material-ui/core/styles";
import {Drawer, Divider} from '@material-ui/core';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import ButtonBase from '@material-ui/core/ButtonBase';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import {
    Tab, Tabs,
} from '@material-ui/core';
import {useState} from 'react';
import CustomScrollbar from '../common/CustomScrollbar';
import IconMenu from '../common/IconMenu';
import {connect} from "react-redux";
import {getOneGroup} from "../../actions/groupActions";
import SearchGroupsToolbar from "./SearchGroupsToolbar";

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
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
        '&$disabled': {
            opacity: 1,
        },
        '&$selected': {
            backgroundColor: theme.eventkit.colors.white,
        },
    },
    selected: {},
    disabled: {},
    paginationRange: {
        marginLeft: '5px',
        fontSize: '10px',
        fontStyle: 'italic'
    },
    noResultsContainer: {
        textAlign: 'center',
        marginTop: '80%',
    },
    noGroupTitle: {
        fontSize: '10px,'
    },
    noGroupResultsText: {
        fontStyle: 'italic',
        fontSize: '10px',
        color: theme.eventkit.colors.grey,
    },
    showButtons: {
        minWidth: '117px',
        margin: '5px 2.5px',
        fontSize: '12px',
        border: 'solid 1px #707274',
    },
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
    usersCount: number;
    nextPage: boolean;
    total: number;
    onNewGroupClick: () => void;
    onAdministratorInfoClick: () => void;
    onMemberInfoClick: () => void;
    onOtherInfoClick: () => void;
    onLeaveGroupClick: (group: Eventkit.Group) => void;
    onDeleteGroupClick: (group: Eventkit.Group) => void;
    onRenameGroupClick: (group: Eventkit.Group) => void;
    getOneGroup: (args: any) => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
    user: Eventkit.User['user'];
    handlePage: (args: any) => void;
    page: number;
}

export function GroupsDrawer(props: Props) {
    const pageSize = 20;
    const {classes} = props;
    const [selectedTab, setSelectedTab] = useState('admin');
    const [page, setPage] = useState(props.page);

    const makePartialGroupsRequest = async (params: {}) => {
        await props.getOneGroup({
            ...params,
        });
    };

    const getGroupsRange = () => {
        if (props.groups.groups.length > 0) {
            if (props.groups.range) {
                const rangeParts = props.groups.range.split('/');
                if (rangeParts.length !== 2) {
                    return '';
                }
                const startIndex = (page - 1) * pageSize + 1;
                const endIndex = pageSize * page;
                if (endIndex <= parseInt(rangeParts[1])) {
                    return `(${startIndex}-${endIndex} of ${rangeParts[1]})`;
                } else {
                    return `(${startIndex}-${rangeParts[1]} of ${rangeParts[1]})`;
                }
            }
            return '';
        }
        return '(0 of 0)';
    };

    const handleChange = (event, newValue) => {
        if (selectedTab === newValue) {
            setSelectedTab('');
        } else {
            setSelectedTab(newValue);
            makePartialGroupsRequest({
                page: 1,
                page_size: pageSize,
                permission_level: newValue
            });
            setPage(1);
            props.handlePage(1);
        }
    };

    const loadNext = () => {
        if (props.nextPage) {
            makePartialGroupsRequest({
                page: page + 1,
                page_size: pageSize,
                permission_level: selectedTab
            });
            setPage(page + 1);
            props.handlePage(page + 1);
        }
    };

    const loadPrevious = () => {
        makePartialGroupsRequest({
            page: page - 1,
            page_size: pageSize,
            permission_level: selectedTab
        });
        setPage(page - 1);
        props.handlePage(page - 1);
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
                    style={{width: '32%', display: 'grid'}}
                    value="admin"
                    classes={{
                        root: classes.tab,
                        selected: classes.selected,
                        disabled: classes.disabled,
                    }}
                    label={(<div><strong>Admin</strong></div>)}
                    disabled={selectedTab === 'admin'}
                />
                <Tab
                    style={{width: '32%', display: 'grid'}}
                    value="member"
                    classes={{
                        root: classes.tab,
                        selected: classes.selected,
                        disabled: classes.disabled,
                    }}
                    label={(<div><strong>Member</strong></div>)}
                    disabled={selectedTab === 'member'}
                />
                <Tab
                    style={{width: '32%', display: 'grid'}}
                    value="none"
                    classes={{
                        root: classes.tab,
                        selected: classes.selected,
                        disabled: classes.disabled,
                    }}
                    label={(<div><strong>Other</strong></div>)}
                    disabled={selectedTab === 'none'}
                />
            </Tabs>
            <Divider className={classes.divider}/>
            {selectedTab === 'admin' &&
            <>
                    <span className={`qa-GroupsDrawer-groupsHeading ${classes.subHeading}`}>
                        <strong>ADMINISTRATOR</strong>
                        <span
                            className={classes.paginationRange}
                            id="range"
                        >
                            {getGroupsRange()}
                        </span>
                        <InfoIcon
                            onClick={
                                props.onAdministratorInfoClick}
                            className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                        />
                    </span>
                <CustomScrollbar className="qa-GroupsDrawer-CustomScrollbar" style={{height: 'calc(100% - 145px)'}}>
                    <MenuList className="qa-GroupsDrawer-MenuList">
                        {
                            props.ownedGroups.length > 0 ? props.ownedGroups.map(group => (
                                    <MenuItem
                                        key={group.name}
                                        value={group.id}
                                        onClick={() => props.onSelectionChange(group.id)}
                                        selected={
                                            props.selectedValue === group.id}
                                        className={`qa-GroupsDrawer-ownedGroupItem ${classes.item}`}
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
                                ))
                                :
                                <div className={classes.noResultsContainer}>
                                    <div className={classes.noGroupTitle}>
                                        No Results Found in this Group.
                                    </div>
                                    <div className={classes.noGroupResultsText}>
                                        There may be results in the Member and Other tabs.
                                    </div>
                                </div>
                        }
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
                        <span
                            className={classes.paginationRange}
                            id="range"
                        >
                            {getGroupsRange()}
                        </span>
                        <InfoIcon
                            onClick={
                                props.onMemberInfoClick}
                            className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                        />
                </span>
                <CustomScrollbar style={{height: 'calc(100% - 145px)'}}>
                    <MenuList className="qa-GroupsDrawer-MenuList">
                        {props.sharedGroups.length > 0 ? props.sharedGroups.map(group => (
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
                            ))
                            :
                            <div className={classes.noResultsContainer}>
                                <div className={classes.noGroupTitle}>
                                    No Results Found in this Group.
                                </div>
                                <div className={classes.noGroupResultsText}>
                                    There may be results in the Admin and Other tabs.
                                </div>
                            </div>
                        }
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
                <span
                    className={classes.paginationRange}
                    id="range"
                >
                        {getGroupsRange()}
                </span>
                <InfoIcon
                    onClick={
                        props.onOtherInfoClick}
                    className={`qa-GroupsDrawer-infoIcon ${classes.infoIcon}`}
                />
                </span>
                <CustomScrollbar style={{height: 'calc(100% - 145px)'}}>
                    <MenuList className="qa-GroupsDrawer-MenuList">
                        {
                            props.otherGroups.length > 0 ? props.otherGroups.map(group => (
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
                                ))
                                :
                                <div className={classes.noResultsContainer}>
                                    <div className={classes.noGroupTitle}>
                                        No Results Found in this Group.
                                    </div>
                                    <div className={classes.noGroupResultsText}>
                                        There may be results in the Admin and Member tabs.
                                    </div>
                                </div>
                        }
                    </MenuList>
                </CustomScrollbar>
            </>
            }
            <div
                className="show-buttons"
                style={{display: 'flex', marginLeft: '2px'}}
            >
                <Button
                    className={classes.showButtons}
                    variant="contained"
                    color="secondary"
                    disabled={
                        loadPreviousDisabled()}
                    onClick={loadPrevious}
                >
                    <ArrowLeftIcon style={{fontSize: 'x-large'}}/>
                    PREVIOUS
                </Button>
                <Button
                    className={classes.showButtons}
                    variant="contained"
                    color="secondary"
                    disabled={
                        loadNextDisabled()}
                    onClick={loadNext}
                >
                    NEXT
                    <ArrowRightIcon style={{fontSize: 'x-large'}}/>
                </Button>
            </div>
            <Divider className={classes.divider}/>
            <div className="search-groups-toolbar">
                <SearchGroupsToolbar
                    user={props.user}
                    pageSize={pageSize}
                    page={page}
                    permission_level={selectedTab}
                />
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
    };
}

export default withTheme()(withStyles(jss)(connect(mapStateToProps, mapDispatchToProps)(GroupsDrawer)));