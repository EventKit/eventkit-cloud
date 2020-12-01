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
import AddCircleIcon from '@material-ui/icons/AddCircle';
import Button from '@material-ui/core/Button';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import {useEffect, useState} from 'react';
import {connect} from "react-redux";
import {getGroups, types} from "../../actions/groupActions";
import SearchGroupsToolbar from "./SearchGroupsToolbar";
import GroupsHeaderTabs from "./GroupsHeaderTabs";
import GroupPanelBody from "./GroupPanelBody";

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
    divider: {
        backgroundColor: theme.eventkit.colors.text_primary,
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
    totalAdmin: number;
    totalMember: number;
    totalOther: number;
    onNewGroupClick: () => void;
    onAdministratorInfoClick: () => void;
    onMemberInfoClick: () => void;
    onOtherInfoClick: () => void;
    onLeaveGroupClick: (group: Eventkit.Group) => void;
    onDeleteGroupClick: (group: Eventkit.Group) => void;
    onRenameGroupClick: (group: Eventkit.Group) => void;
    getGroups: (args: any) => void;
    setFetchingGroups: () => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
    user: Eventkit.User['user'];
    handlePage: (args: any) => void;
    page: number;
    selectedTab?: string;
}

export function GroupsDrawer(props: Props) {
    const pageSize = 20;
    const {classes, page} = props;
    const [selectedTab, setSelectedTab] = useState('admin');
    const [ previousSelected, setPreviousSelected ] = useState('');
    const [query, setQuery] = useState('');

    useEffect(() => {
       if (props.selectedTab) {
           handleChange(null, props.selectedTab);
           setPreviousSelected(selectedTab);
       } else {
           handleChange(null, previousSelected);
       }
    }, [props.selectedTab]);

    useEffect(() => {
        if (query !== '') {
            props.getGroups({
                user: props.user.username,
                pageSize,
                permission_level: selectedTab,
                search: query,
            });
        } else {
            props.getGroups({
                user: props.user.username,
                pageSize,
                page,
                permission_level: selectedTab,
                search: query,
            });
        }
    }, [props.user.username, pageSize, page, selectedTab, query]);

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
            props.handlePage(1);
        }
    };

    const loadNext = () => {
        if (props.nextPage) {
            props.handlePage(page + 1);
        }
    };

    const loadPrevious = () => {
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
            open={props.open}
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
            <GroupsHeaderTabs
                selectedTab={selectedTab}
                handleChange={handleChange}
                totalAdmin={props.totalAdmin}
                totalMember={props.totalMember}
                totalOther={props.totalOther}
            />
            <Divider className={classes.divider}/>
            <GroupPanelBody
                ownedGroups={props.ownedGroups}
                sharedGroups={props.sharedGroups}
                otherGroups={props.otherGroups}
                selectedTab={selectedTab}
                selectedValue={props.selectedValue}
                onRenameGroupClick={props.onRenameGroupClick}
                onLeaveGroupClick={props.onLeaveGroupClick}
                onDeleteGroupClick={props.onDeleteGroupClick}
                onSelectionChange={props.onSelectionChange}
                onAdministratorInfoClick={props.onAdministratorInfoClick}
                onMemberInfoClick={props.onMemberInfoClick}
                onOtherInfoClick={props.onOtherInfoClick}
                getGroupsRange={getGroupsRange}
                setFetchingGroups={props.setFetchingGroups}
            />
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
                    setQuery={setQuery}
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
        totalAdmin: state.groups.totalAdmin,
        totalMember: state.groups.totalMember,
        totalOther: state.groups.totalOther,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getGroups: params => (
            dispatch(getGroups(params))
        ),
        setFetchingGroups: () => {
            dispatch({type: types.FETCHING_GROUPS});
        },
    };
}

export default withTheme(withStyles(jss)(connect(mapStateToProps, mapDispatchToProps)(GroupsDrawer)));
