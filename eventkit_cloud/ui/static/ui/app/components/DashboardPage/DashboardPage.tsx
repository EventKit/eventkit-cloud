import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import { Theme, withTheme } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import Help from '@material-ui/icons/Help';
import Paper from '@material-ui/core/Paper';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
import PageLoading from '../common/PageLoading';
import { deleteRun, getFeaturedRuns, getRuns } from '../../actions/datapackActions';
import { getViewedJobs } from '../../actions/userActivityActions';
import { getNotifications } from '../../actions/notificationsActions';
import CustomScrollbar from '../common/CustomScrollbar';
import { getProviders } from '../../actions/providerActions';
import DashboardSection from './DashboardSection';
import DataPackGridItem from '../DataPackPage/DataPackGridItem';
import DataPackFeaturedItem from './DataPackFeaturedItem';
import NotificationGridItem from '../Notification/NotificationGridItem';
import { updateDataCartPermissions } from '../../actions/datacartActions';
import { joyride } from '../../joyride.config';
import history from '../../utils/history';
import EventkitJoyride from "../common/JoyrideWrapper";
import {Breakpoint} from "@material-ui/core/styles/createBreakpoints";

export const CUSTOM_BREAKPOINTS = {
    xl: 1920,
    lg: 1600,
    md: 1024,
    sm: 768,
};

interface Props {
    history: any;
    notificationsData: Eventkit.Store.NotificationsData;
    notificationsStatus: Eventkit.Store.NotificationsStatus;
    providers: Eventkit.Provider[];
    runDeletion: Eventkit.Store.RunDeletion;
    ownIds: string[];
    featuredIds: string[];
    viewedIds: string[];
    runsFetched: boolean;
    featuredRunsFetched: boolean;
    viewedRunsFetched: boolean;
    getRuns: (options?: object) => void;
    getFeaturedRuns: (options?: object) => void;
    getViewedJobs: (options?: object) => void;
    getProviders: (options?: object) => void;
    deleteRun: (options?: object) => void;
    getNotifications: (options?: object) => void;
    updatePermission: Eventkit.Store.UpdatePermissions;
    updateDataCartPermissions: () => void;
    theme: Eventkit.Theme & Theme;
    userData: any;
}

export const DashboardPage = (props: Props) => {
    let autoRefreshIntervalId: number | undefined = undefined;
    let autoRefreshInterval: number = 10000;
    let onResize: () => void;
    let joyrideRef = useRef(null);
    let helpersRef = useRef(null);

    const getWidth = () => {
        const windowWidth = window.innerWidth;
        let value = 'xs';
        if (windowWidth >= CUSTOM_BREAKPOINTS.xl) {
            value = 'xl';
        } else if (windowWidth >= CUSTOM_BREAKPOINTS.lg) {
            value = 'lg';
        } else if (windowWidth >= CUSTOM_BREAKPOINTS.md) {
            value = 'md';
        } else if (windowWidth >= CUSTOM_BREAKPOINTS.sm) {
            value = 'sm';
        }

        return value;
    };

    const setScreenSize = () => {
        const nWidth = getWidth();

        if (nWidth !== width) {
            setWidth(nWidth);
        }
    };

    const getGridPadding = () => {
        return width !== 'xs' ? 6 : 2;
    };

    const getGridColumns = ({getMax = false} = {}) => {
        if (width === 'xl' || getMax) {
            return 6;
        } else if (width === 'lg') {
            return 5;
        } else if (width === 'md') {
            return 4;
        } else if (width === 'sm') {
            return 3;
        }

        return 2;
    };

    const getGridWideColumns = ({getMax = false} = {}) => {
        if (width === 'lg' || width === 'xl' || getMax) {
            return 2;
        }

        return 1;
    };

    const getNotificationsColumns = ({getMax = false} = {}) => {
        if (width === 'lg' || width === 'xl' || getMax) {
            return 3;
        } else if (width === 'md') {
            return 2;
        }

        return 1;
    };

    const getNotificationsRows = () => {
        return 3;
    };

    const refreshMyDataPacks = ({isAuto = false} = {}) => {
        props.getRuns({
            pageSize: getGridColumns({getMax: true}) * 3,
            ordering: '-created_at',
            ownerFilter: props.userData.user.username,
            isAuto,
        });
    };

    const refreshFeatured = ({isAuto = false} = {}) => {
        props.getFeaturedRuns({
            pageSize: getGridWideColumns({getMax: true}) * 3,
            isAuto,
        });
    };

    const refreshRecentlyViewed = ({isAuto = false} = {}) => {
        props.getViewedJobs({
            pageSize: getGridColumns({getMax: true}) * 3,
            isAuto,
        });
    };

    const refresh = ({isAuto = false} = {}) => {
        props.getNotifications({
            pageSize: getNotificationsColumns({getMax: true}) * getNotificationsRows() * 3,
        });
        refreshMyDataPacks({isAuto});
        refreshFeatured({isAuto});
        refreshRecentlyViewed({isAuto});
    };

    const autoRefresh = () => {
        refresh({isAuto: true});
    };

    const handleNotificationsViewAll = () => {
        history.push('/notifications');
    };

    const handleFeaturedViewAll = () => {
        history.push('/exports');
    };

    const handleMyDataPacksViewAll = () => {
        history.push(`/exports?collection=${props.userData.user.username}`);
    };

    const isLoading = () => {
        return (
            props.notificationsStatus === null ||
            props.runsFetched === null ||
            props.featuredRunsFetched === null ||
            props.viewedRunsFetched === null ||
            props.runDeletion.deleting ||
            props.updatePermission.updating
        );
    };

    const joyrideAddSteps = (newSteps) => {
        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) {
            return;
        }

        setSteps(steps.concat(newSteps));
    };

    const callback = (data) => {
        const {action, step, type} = data;

        if (!action) {
            return;
        }

        if (action === 'close' || action === 'skip' || type === 'tour:end') {
            helpersRef?.current?.reset(true);
            joyrideRef?.current?.reset(true);
            setIsRunning(false);
            window.location.hash = '';
        }
    };

    const handleWalkthroughClick = () => {
        if (isRunning) {
            setIsRunning(false);
            joyrideRef?.current?.reset(true);
        } else {
            setIsRunning(true);
        }
    };

    const [loadingPage, setLoadingPage] = useState(isLoading());
    const [steps, setSteps] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [width, setWidth] = useState(getWidth());
    onResize = debounce(setScreenSize, 166);

    if (loadingPage && !isLoading()) {
        setLoadingPage(false);
    }

    useEffect( () => {
        refresh();
    }, [props.runDeletion.deleted, props.updatePermission.updated]);

    useEffect(() => {
        // Anything in here is fired on component mount.
        props.getProviders();

        refresh();
        autoRefreshIntervalId = window.setInterval(autoRefresh, autoRefreshInterval);
        const dashSteps = joyride.DashboardPage;
        if (props.featuredIds.length === 0) {
            const ix = dashSteps.findIndex(s => s.selector === '.qa-DashboardSection-Featured');
            if (ix > -1) {
                dashSteps.splice(ix, 1);
            }
        }
        joyrideAddSteps(dashSteps);
        window.addEventListener('resize', onResize);
        return () => {
            // Anything in here is fired on component unmount.
            window.clearInterval(autoRefreshIntervalId);
            autoRefreshIntervalId = undefined;
            window.removeEventListener('resize', onResize);
        }
    }, [])

    const {colors, images} = props.theme.eventkit;

    const mainAppBarHeight = 95;
    const pageAppBarHeight = 35;
    const styles = {
        root: {
            position: 'relative' as 'relative',
            height: `calc(100vh - ${mainAppBarHeight}px)`,
            width: '100%',
            backgroundImage: `url(${images.topo_dark})`,
        },
        customScrollbar: {
            height: `calc(100vh - ${mainAppBarHeight + pageAppBarHeight}px)`,
        },
        loadingOverlay: {
            position: 'absolute' as 'absolute',
            height: '100%',
            width: '100%',
            background: colors.backdrop,
            zIndex: '100',
        },
        loadingPage: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
        },
        content: {
            marginBottom: '12px',
            maxWidth: '1920px',
            margin: 'auto',
        },
        noData: {
            margin: `0 ${10 + (getGridPadding() / 2)}px`,
            padding: '22px',
            fontSize: '18px',
            color: colors.grey,
        },
        link: {
            color: colors.primary,
        },
        tourButton: {
            color: colors.primary,
            cursor: 'pointer',
            display: 'inline-block',
            marginLeft: '10px',
            fontSize: '14px',
            height: '30px',
            lineHeight: '30px',
        },
        tourIcon: {
            color: colors.primary,
            cursor: 'pointer',
            height: '18px',
            width: '18px',
            verticalAlign: 'middle',
            marginRight: '5px',
            marginBottom: '5px',
        },
        banner: {
            position: 'relative' as 'relative',
            width: '100%',
            height: '35px'
        },
        dashboard: {
            height: 'calc(100vh - 226px)',
            position: 'absolute' as 'absolute',
            width: '100%'
        }
    };

    const iconElementRight = (
        <ButtonBase
            onClick={handleWalkthroughClick}
            style={styles.tourButton}
        >
            <Help style={styles.tourIcon}/>
            Page Tour
        </ButtonBase>
    );

    return (
        <div style={styles.root}>
            <PageHeader
                id="Dashboard"
                className="qa-Dashboard-PageHeader"
                title="Dashboard"
            >
                {iconElementRight}
            </PageHeader>
            <div className='dashboard' style={styles.dashboard}>
                {loadingPage ?
                    <PageLoading background={"transparent"}/>
                    : null
                }
                <CustomScrollbar
                    style={styles.customScrollbar}
                >
                    <EventkitJoyride
                        name={"Dashboard Page"}
                        callback={callback}
                        getRef={(_ref) => (joyrideRef = _ref)}
                        getHelpers={(helpers: any) => {
                            helpersRef = helpers;
                        }}
                        // @ts-ignore
                        steps={steps}
                        continuous
                        showSkipButton
                        showProgress
                        locale={{
                            // @ts-ignore
                            back: (<span>Back</span>),
                            // @ts-ignore
                            close: (<span>Close</span>),
                            // @ts-ignore
                            last: (<span>Done</span>),
                            // @ts-ignore
                            next: (<span>Next</span>),
                            // @ts-ignore
                            skip: (<span>Skip</span>),
                        }}
                        run={isRunning}
                    />
                    {loadingPage ?
                        null
                        :
                        <div id={"dashboardContent"} style={styles.content}>
                            <DashboardSection
                                className="qa-DashboardSection-Notifications"
                                title="Notifications"
                                name="Notifications"
                                columns={getNotificationsColumns()}
                                rows={getNotificationsRows()}
                                gridPadding={getGridPadding()}
                                onViewAll={handleNotificationsViewAll}
                                noDataElement={
                                    <Paper
                                        className="qa-DashboardSection-Notifications-NoData"
                                        style={styles.noData}
                                    >
                                        <span>{"You don't have any notifications."}</span>
                                    </Paper>
                                }
                                rowMajor={false}
                                width={width as Breakpoint}
                            >
                                {props.notificationsData.notificationsSorted.map(notification => (
                                    <NotificationGridItem
                                        key={`Notification-${notification.id}`}
                                        notification={notification}
                                        history={props.history}
                                        width={width as Breakpoint}
                                    />
                                ))}
                            </DashboardSection>

                            <DashboardSection
                                className="qa-DashboardSection-RecentlyViewed"
                                title="Recently Viewed"
                                name="RecentlyViewed"
                                columns={getGridColumns()}
                                gridPadding={getGridPadding()}
                                noDataElement={
                                    <Paper
                                        className="qa-DashboardSection-RecentlyViewed-NoData"
                                        style={styles.noData}
                                    >
                                        <span>{"You don't have any recently viewed DataPacks."}&nbsp;</span>
                                        <Link
                                            to="/exports"
                                            href="/exports"
                                            style={styles.link}
                                        >
                                            View DataPack Library
                                        </Link>
                                    </Paper>
                                }
                                width={width as Breakpoint}
                            >
                                {props.viewedIds.map((id, index) => {
                                    return (
                                        <DataPackGridItem
                                            data-testid={"viewed"}
                                            className="qa-DashboardSection-RecentlyViewedGrid-Item"
                                            runId={id}
                                            userData={props.userData}
                                            key={`RecentlyViewedDataPack-${id}`}
                                            onRunDelete={props.deleteRun}
                                            onRunShare={props.updateDataCartPermissions}
                                            providers={props.providers}
                                            gridName="RecentlyViewed"
                                            index={index}
                                            showFeaturedFlag={false}
                                        />
                                    );
                                })}
                            </DashboardSection>

                            {props.featuredIds.length === 0 ?
                                null
                                :
                                <DashboardSection
                                    className="qa-DashboardSection-Featured"
                                    title="Featured"
                                    name="Featured"
                                    columns={getGridWideColumns()}
                                    gridPadding={getGridPadding()}
                                    cellHeight={width !== 'xs' ? 335 : 435}
                                    onViewAll={handleFeaturedViewAll}
                                    width={width as Breakpoint}
                                >
                                    {props.featuredIds.map((id, index) => (
                                        <DataPackFeaturedItem
                                            data-testid={"featured"}
                                            className="qa-DashboardSection-FeaturedGrid-WideItem"
                                            runId={id}
                                            key={`FeaturedDataPack-${id}`}
                                            gridName="Featured"
                                            index={index}
                                            height={width !== 'xs' ? '335px' : '435px'}
                                        />
                                    ))}
                                </DashboardSection>
                            }

                            <DashboardSection
                                className="qa-DashboardSection-MyDataPacks"
                                title="My DataPacks"
                                name="MyDataPacks"
                                columns={getGridColumns()}
                                gridPadding={getGridPadding()}
                                onViewAll={handleMyDataPacksViewAll}
                                noDataElement={
                                    <Paper
                                        className="qa-DashboardSection-MyDataPacks-NoData"
                                        style={styles.noData}
                                    >
                                        <span>{"You don't have any DataPacks."}&nbsp;</span>
                                        <Link
                                            to="/create"
                                            href="/create"
                                            style={styles.link}
                                        >
                                            Create DataPack
                                        </Link>
                                    </Paper>
                                }
                                width={width as Breakpoint}
                            >
                                {props.ownIds.map((id, index) => (
                                    <DataPackGridItem
                                        data-testid={"pack"}
                                        className="qa-DashboardSection-MyDataPacksGrid-Item"
                                        runId={id}
                                        userData={props.userData}
                                        key={`MyDataPacksDataPack-${id}`}
                                        onRunDelete={props.deleteRun}
                                        onRunShare={props.updateDataCartPermissions}
                                        providers={props.providers}
                                        gridName="MyDataPacks"
                                        index={index}
                                        showFeaturedFlag={false}
                                    />
                                ))}
                            </DashboardSection>
                        </div>
                    }
                </CustomScrollbar>
            </div>
        </div>
    );
};

function mapStateToProps(state) {
    return {
        userData: state.user.data,
        notificationsData: state.notifications.data,
        notificationsStatus: state.notifications.status,
        providers: state.providers.objects,
        runDeletion: state.runDeletion,
        ownIds: state.exports.ownInfo.ids,
        featuredIds: state.exports.featuredInfo.ids,
        viewedIds: state.exports.viewedInfo.ids,
        runsFetched: state.exports.allInfo.status.fetched,
        featuredRunsFetched: state.exports.featuredInfo.status.fetched,
        viewedRunsFetched: state.exports.viewedInfo.status.fetched,
        updatePermission: state.updatePermission,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: args => dispatch(getRuns(args)),
        getFeaturedRuns: args => dispatch(getFeaturedRuns(args)),
        getViewedJobs: args => dispatch(getViewedJobs(args)),
        getProviders: () => dispatch(getProviders()),
        deleteRun: uid => dispatch(deleteRun(uid)),
        getNotifications: args => dispatch(getNotifications(args)),
        updateDataCartPermissions: (uid, permissions) => dispatch(updateDataCartPermissions(uid, permissions)),
    };
}

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(DashboardPage));
