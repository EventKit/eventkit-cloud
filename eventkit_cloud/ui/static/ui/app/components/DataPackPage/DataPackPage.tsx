import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import { browserHistory } from 'react-router';
import * as Joyride from 'react-joyride';
import Help from '@material-ui/icons/Help';
import Toolbar from '@material-ui/core/Toolbar';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
import PageLoading from '../common/PageLoading';
import DataPackGrid from './DataPackGrid';
import DataPackList from './DataPackList';
import MapView from './MapView';
import DataPackSearchbar from './DataPackSearchbar';
import DataPackViewButtons from './DataPackViewButtons';
import DataPackSortDropDown from './DataPackSortDropDown';
import DataPackFilterButton from './DataPackFilterButton';
import DataPackOwnerSort from './DataPackOwnerSort';
import DataPackLinkButton from './DataPackLinkButton';
import FilterDrawer from './FilterDrawer';
import { getRuns, deleteRun } from '../../actions/datapackActions';
import { getProviders } from '../../actions/providerActions';
import { getGeocode } from '../../actions/geocodeActions';
import { processGeoJSONFile, resetGeoJSONFile } from '../../actions/fileActions';
import { updateDataCartPermissions } from '../../actions/datacartActions';
import { setPageOrder, setPageView } from '../../actions/uiActions';
import { flattenFeatureCollection } from '../../utils/mapUtils';
import { joyride } from '../../joyride.config';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

interface Props {
    runIds: string[];
    runsFetched: boolean;
    runsFetching: boolean;
    runsMeta: {
        range: string;
        nextPage: boolean;
        order: string;
        view: string;
    };
    featuredIds: string[];
    user: Eventkit.Store.User;
    getRuns: (args: object) => void;
    deleteRun: () => void;
    getProviders: () => void;
    runDeletion: {
        deleted: boolean;
        deleting: boolean;
    };
    drawer: string;
    importGeom: {
        processing: boolean;
    };
    geocode: object;
    getGeocode: () => void;
    processGeoJSONFile: (file: File) => void;
    resetGeoJSONFile: () => void;
    setOrder: (order: string) => void;
    setView: (view: string) => void;
    providers: Eventkit.Provider[];
    updateDataCartPermissions: () => void;
    updatePermissions: {
        updating: boolean;
        updated: boolean;
        error: any;
    };
    location: {
        query: {
            search: string;
            collection: string;
            order: string;
            view: string;
            page_size: string;
        };
    };
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

interface State {
    open: boolean;
    permissions: Eventkit.Permissions;
    minDate: null | string;
    maxDate: null | string;
    status: {
        completed: boolean;
        submitted: boolean;
        incomplete: boolean;
    };
    providers: any;
    pageLoading: boolean;
    loading: boolean;
    geojson_geometry: null | GeoJSON.Geometry;
    steps: any[];
    isRunning: boolean;
}

export class DataPackPage extends React.Component<Props, State> {
    private pageSize: number;
    private defaultQuery;
    private fetch: number;
    private view: any;
    private joyride: Joyride.default;

    static contextTypes = {
        config: PropTypes.shape({
            DATAPACK_PAGE_SIZE: PropTypes.string,
        }),
    };
    constructor(props: Props, context) {
        super(props);
        this.getViewRef = this.getViewRef.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.checkForEmptySearch = this.checkForEmptySearch.bind(this);
        this.handleOwnerFilter = this.handleOwnerFilter.bind(this);
        this.handleFilterApply = this.handleFilterApply.bind(this);
        this.handleFilterClear = this.handleFilterClear.bind(this);
        this.changeView = this.changeView.bind(this);
        this.autoRunRequest = this.autoRunRequest.bind(this);
        this.makeRunRequest = this.makeRunRequest.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.loadLess = this.loadLess.bind(this);
        this.getView = this.getView.bind(this);
        this.callback = this.callback.bind(this);
        this.handleSpatialFilter = this.handleSpatialFilter.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.handleJoyride = this.handleJoyride.bind(this);
        this.pageSize = Number(context.config.DATAPACK_PAGE_SIZE);
        this.state = {
            open: isWidthUp('xl', props.width),
            permissions: {
                value: '' as Eventkit.Permissions.Visibility,
                groups: {},
                members: {},
            },
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                submitted: false,
                incomplete: false,
            },
            providers: {},
            pageLoading: props.runsFetched === null,
            loading: true,
            geojson_geometry: null,
            steps: [],
            isRunning: false,
        };

        this.defaultQuery = {
            collection: 'all',
            order: props.runsMeta.order || '-job__featured',
            view: props.runsMeta.view || 'map',
            page_size: this.pageSize,
        };
    }

    componentWillMount() {
        const query = {
            ...this.defaultQuery,
            ...this.props.location.query,
        };
        this.updateLocationQuery(query);
    }

    componentDidMount() {
        this.props.getProviders();
        this.makeRunRequest();
        this.fetch = window.setInterval(this.autoRunRequest, 10000);
        // make sure no geojson upload is in the state
        this.props.resetGeoJSONFile();
        browserHistory.listen((location) => {
            // do not allow the page to navigate to itself without url parameters
            if (location.search === '' && location.pathname === '/exports') {
                browserHistory.push(this.getCurrentLocation());
            }
        });
    }

    shouldComponentUpdate(p: Props, s: State) {
        if (p.runsFetching !== this.props.runsFetching) {
            if (s.loading !== this.state.loading ||
                this.state.loading ||
                p.runIds !== this.props.runIds
            ) {
                return true;
            }
            return false;
        }
        return true;
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.runsFetched === null && this.props.runsFetched) {
            if (this.state.pageLoading) {
                this.setState({ pageLoading: false });
            }
        }

        // if a run was just deleted we need to update our state
        if (this.props.runDeletion.deleted && !prevProps.runDeletion.deleted) {
            this.setState({ loading: true }, this.makeRunRequest);
        }

        // if a run was just updated we need to update our state
        if (this.props.updatePermissions.updated && !prevProps.updatePermissions.updated) {
            this.setState({ loading: true }, this.makeRunRequest);
        }

        // if the location query has changed we need to update our state
        let changedQuery = false;
        if (Object.keys(this.props.location.query).length
                !== Object.keys(prevProps.location.query).length) {
            changedQuery = true;
        } else {
            const keys = Object.keys(this.props.location.query);
            if (!keys.every(key => this.props.location.query[key] === prevProps.location.query[key])) {
                changedQuery = true;
            }
        }

        if (changedQuery) {
            this.setState({ loading: true });
            this.makeRunRequest();
        }

        // if loading is active and we just received updated runs we can stop the loading view
        if (this.state.loading) {
            if (prevProps.runsFetching && !this.props.runsFetching) {
                this.setState({ loading: false });
            }
        }

        if (prevProps.location.query.view !== this.props.location.query.view) {
            const steps = this.getJoyRideSteps();
            this.joyrideAddSteps(steps);
        }
    }

    componentWillUnmount() {
        window.clearInterval(this.fetch);
        // save view and order to redux state so it can be set next time the page is visited
        if (this.props.runsMeta.order !== this.props.location.query.order) {
            this.props.setOrder(this.props.location.query.order);
        }
        if (this.props.runsMeta.view !== this.props.location.query.view) {
            this.props.setView(this.props.location.query.view);
        }
    }

    private onSearch(searchText: string) {
        this.updateLocationQuery({ search: searchText });
    }

    private getViewRef(instance: HTMLElement) {
        this.view = instance;
    }

    private getCurrentLocation() {
        return this.props.location;
    }

    private getJoyRideSteps(): any[] {
        switch (this.props.location.query.view) {
            case 'map':
                return joyride.DataPackPage.map;
            case 'grid':
                return joyride.DataPackPage.grid;
            case 'list':
                return joyride.DataPackPage.list;
            default: return null;
        }
    }

    private getView(view: string) {
        const commonProps = {
            runIds: this.props.runIds,
            user: this.props.user,
            onRunDelete: this.props.deleteRun,
            onRunShare: this.props.updateDataCartPermissions,
            range: this.props.runsMeta.range,
            handleLoadLess: this.loadLess,
            handleLoadMore: this.loadMore,
            loadLessDisabled: this.props.runIds.length <= this.pageSize,
            loadMoreDisabled: !this.props.runsMeta.nextPage,
            providers: this.props.providers,
        };
        switch (view) {
            case 'list':
                return (
                    <DataPackList
                        {...commonProps}
                        onSort={this.handleSortChange}
                        order={this.props.location.query.order}
                        customRef={this.getViewRef}
                    />
                );
            case 'grid':
                return (
                    <DataPackGrid
                        {...commonProps}
                        name="DataPackLibrary"
                        customRef={this.getViewRef}
                    />
                );
            case 'map':
                return (
                    <MapView
                        {...commonProps}
                        geocode={this.props.geocode}
                        getGeocode={this.props.getGeocode}
                        importGeom={this.props.importGeom}
                        processGeoJSONFile={this.props.processGeoJSONFile}
                        resetGeoJSONFile={this.props.resetGeoJSONFile}
                        onMapFilter={this.handleSpatialFilter}
                        customRef={this.getViewRef}
                    />
                );
            default: return null;
        }
    }

    private isPageLoading() {
        return this.props.runsFetched === null;
    }

    private updateLocationQuery(query: any) {
        browserHistory.push({
            ...this.props.location,
            query: {
                ...this.props.location.query,
                ...query,
            },
        });
    }

    private checkForEmptySearch(searchText: string) {
        if (searchText === '' && this.props.location.query.search) {
            const query = { ...this.props.location.query };
            query.search = undefined;
            this.updateLocationQuery(query);
        }
    }

    private handleSortChange(value: string) {
        this.updateLocationQuery({ order: value });
    }

    private autoRunRequest() {
        // Call make run request and pass true to indicate this is an auto run request
        // The auto run request will not have the power to cancel any current requests
        this.makeRunRequest(true);
    }

    private makeRunRequest(isAuto = false) {
        return this.props.getRuns({
            page_size: Number(this.props.location.query.page_size),
            ordering: this.props.location.query.order,
            ownerFilter: this.props.location.query.collection,
            search: this.props.location.query.search,
            status: this.state.status,
            minDate: this.state.minDate,
            maxDate: this.state.maxDate,
            providers: this.state.providers,
            geojson: this.state.geojson_geometry,
            permissions: this.state.permissions,
            isAuto,
        });
    }

    private handleOwnerFilter(value: string) {
        this.updateLocationQuery({ collection: value });
    }

    private handleFilterApply(state: State) {
        this.setState({ ...this.state, ...state, loading: true }, this.makeRunRequest);
        if (!isWidthUp('xl', this.props.width)) {
            this.setState({ open: false });
        }
    }

    private handleFilterClear() {
        this.setState({
            permissions: {
                value: '' as Eventkit.Permissions.Visibility,
                groups: {},
                members: {},
            },
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            providers: {},
            loading: true,
        }, this.makeRunRequest);
        if (!isWidthUp('xl', this.props.width)) {
            this.setState({ open: false });
        }
    }

    private handleSpatialFilter(geojson: GeoJSON.FeatureCollection) {
        let geom = null;
        if (geojson) {
            geom = flattenFeatureCollection(geojson).features[0].geometry;
        }
        this.setState({ geojson_geometry: geom, loading: true }, this.makeRunRequest);
    }

    private changeView(view: string) {
        const sharedViewOrders = ['started_at', '-started_at', 'job__name', '-job__name', '-job__featured', 'job__featured'];
        if (sharedViewOrders.indexOf(this.props.location.query.order) < 0) {
            this.updateLocationQuery({ view, order: '-started_at' });
        } else {
            this.updateLocationQuery({ view });
        }
    }

    private handleToggle() {
        this.setState({ open: !this.state.open });
    }

    private loadMore() {
        if (this.props.runsMeta.nextPage) {
            this.updateLocationQuery({
                page_size: Number(this.props.location.query.page_size) + this.pageSize,
            });
        }
    }

    private loadLess() {
        if (Number(this.props.location.query.page_size) > this.pageSize) {
            this.updateLocationQuery({
                page_size: Number(this.props.location.query.page_size) - this.pageSize,
            });
        }
    }

    private joyrideAddSteps(steps: object[]) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) {
            return;
        }

        this.setState({ steps: newSteps });
    }

    private callback(data: any) {
        if (data.action === 'close' || data.action === 'skip' || data.type === 'finished') {
            // This explicitly stops the tour (otherwise it displays a "beacon" to resume the tour)
            this.setState({ isRunning: false, steps: [] });
            this.joyride.reset(true);
        }
        if (data.step) {
            if (data.step.title === 'Filters' && data.type === 'step:before') {
                if (this.state.open === false) {
                    this.setState({ open: true });
                }
            }
            if (data.step.title === 'Filters' && data.type === 'step:after' && !isWidthUp('xl', this.props.width)) {
                this.setState({ open: false });
            }
            if (data.step.title === 'Featured DataPacks' && data.type === 'step:before' && !isWidthUp('xl', this.props.width)) {
                this.setState({ open: false });
            }
            if (data.step.title === 'Menu Options'
                && data.type === 'step:before'
                && this.props.location.query.view === 'list'
                && !isWidthUp('xl', this.props.width)
            ) {
                this.setState({ open: false });
            }
        }
    }

    private handleJoyride() {
        const { colors } = this.props.theme.eventkit;

        if (this.state.isRunning === true) {
            this.setState({ isRunning: false });
            this.joyride.reset(true);
        } else {
            let { view } = this;
            // react-redux connect does not have good support for forwarded refs
            // so if its a connected component we need to access the wrappedInstance
            if (view.wrappedInstance) {
                view = view.wrappedInstance;
            }
            view.getScrollbar().scrollToTop();

            this.setState({ isRunning: true, steps: [] });
            const steps = this.getJoyRideSteps();

            const hasFeatured = this.props.runIds.some(id => (this.props.featuredIds.indexOf(id) >= 0));

            const stepsIncludeFeatured = steps.find(step => step.title === 'Featured DataPacks');

            const newStep = {
                title: 'Featured DataPacks',
                text: 'Popular or sought after DataPacks can be tagged as “Featured” and will be prominently displayed in each view',
                selector: '.tour-datapack-featured',
                style: {
                    backgroundColor: colors.white,
                    borderRadius: '0',
                    color: colors.black,
                    mainColor: colors.primary,
                    textAlign: 'left',
                    header: {
                        textAlign: 'left',
                        fontSize: '20px',
                        borderColor: colors.primary,
                    },
                    main: {
                        paddingTop: '20px',
                        paddingBottom: '20px',
                    },
                    button: {
                        color: colors.white,
                        backgroundColor: colors.primary,
                    },
                    skip: {
                        display: 'none',
                    },
                    back: {
                        color: colors.text_primary,
                    },
                    hole: {
                        backgroundColor: 'rgba(226,226,226, 0.2)',
                    },
                },
                position: 'top',
            };

            if (hasFeatured && !stepsIncludeFeatured) {
                steps.splice(2, 0, newStep);
            }

            this.joyrideAddSteps(steps);
        }
    }

    render() {
        const { colors, images } = this.props.theme.eventkit;

        const { steps, isRunning } = this.state;
        const pageTitle = <div style={{ display: 'inline-block', paddingRight: '10px' }}>DataPack Library</div>;

        const styles = {
            wholeDiv: {
                height: isWidthUp('sm', this.props.width) ?
                    'calc(100vh - 231px)'
                    :
                    'calc(100vh - 223px)',
                backgroundRepeat: 'repeat repeat',
                marginRight: this.state.open && isWidthUp('xl', this.props.width) ? '250px' : '0px',
                marginTop: isWidthUp('sm', this.props.width) ? '10px' : '2px',
                position: 'relative' as 'relative',
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                paddingLeft: '10px',
                height: '35px',
            },
            toolbarSearch: {
                height: '56px',
                minHeight: '56px',
                backgroundColor: colors.background_light,
            },
            toolbarSort: {
                backgroundColor: colors.background_light,
                height: '35px',
                minHeight: '35px',
                display: 'inline-block',
                width: '100%',
            },
            containerStyle: {
                backgroundColor: colors.white,
                top: '221px',
                height: 'calc(100vh - 221px)',
                overflowY: 'hidden',
                overflowX: 'hidden',
            },
            backgroundStyle: {
                backgroundImage: `url(${images.topo_dark})`,
            },
            range: !isWidthUp('md', this.props.width) ?
                { color: colors.text_primary, lineHeight: '36px', fontSize: '12px' }
                :
                {
                    display: 'inline-block',
                    position: 'absolute' as 'absolute',
                    color: colors.text_primary,
                    lineHeight: '36px',
                    right: '10px',
                    fontSize: '12px',
                },
            tourButton: {
                color: colors.primary,
                cursor: 'pointer',
                display: 'inline-block',
                marginRight: '15px',
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
            loadingContainer: {
                position: 'absolute' as 'absolute',
                width: '100%',
                height: '100%',
                zIndex: 100,
            },
        };

        const iconElementRight = (
            <ButtonBase
                onClick={this.handleJoyride}
                style={styles.tourButton}
            >
                <Help style={styles.tourIcon} />
                Page Tour
            </ButtonBase>
        );

        return (
            <div style={styles.backgroundStyle}>
                <Joyride.default
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps as Joyride.Step[]}
                    autoStart
                    type="continuous"
                    showSkipButton
                    showStepsProgress
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
                <PageHeader
                    className="qa-DataPackPage-PageHeader"
                    title={pageTitle}
                >
                    {iconElementRight}
                    <DataPackLinkButton />
                </PageHeader>

                <Toolbar className="qa-DataPackPage-Toolbar-search" style={styles.toolbarSearch}>
                    <DataPackSearchbar
                        onSearchChange={this.checkForEmptySearch}
                        onSearchSubmit={this.onSearch}
                        defaultValue={this.props.location.query.search}
                    />
                </Toolbar>

                <Toolbar className="qa-DataPackPage-Toolbar-sort" style={styles.toolbarSort}>
                    <DataPackOwnerSort
                        handleChange={this.handleOwnerFilter}
                        value={this.props.location.query.collection || 'all'}
                        owner={this.props.user.data.user.username}
                    />
                    <DataPackFilterButton
                        handleToggle={this.handleToggle}
                        active={this.state.open}
                    />
                    {this.props.location.query.view === 'list' && isWidthUp('md', this.props.width) ?
                        null
                        :
                        <DataPackSortDropDown
                            handleChange={this.handleSortChange}
                            value={this.props.location.query.order || '-job__featured'}
                        />
                    }
                    <DataPackViewButtons
                        handleViewChange={this.changeView}
                        view={this.props.location.query.view || 'map'}
                    />
                </Toolbar>

                <div style={styles.wholeDiv}>
                    <FilterDrawer
                        onFilterApply={this.handleFilterApply}
                        onFilterClear={this.handleFilterClear}
                        open={this.state.open}
                        providers={this.props.providers}
                    />

                    {this.state.pageLoading ?
                        <PageLoading background="transparent" />
                        :
                        <div style={{ position: 'relative' }} className="qa-DataPackPage-view">
                            {this.state.loading ||
                            this.props.runDeletion.deleting ||
                            this.props.updatePermissions.updating ||
                            this.props.importGeom.processing ?
                                <div style={styles.loadingContainer}>
                                    <PageLoading background="transparent" partial />
                                </div>
                                : null
                            }
                            {this.getView(this.props.location.query.view)}
                        </div>
                    }
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        runIds: state.exports.orderedIds,
        runsFetched: state.exports.allInfo.status.fetched,
        runsFetching: state.exports.allInfo.status.fetching,
        runsMeta: state.exports.allInfo.meta,
        featuredIds: state.exports.featuredInfo.ids,
        user: state.user,
        runDeletion: state.runDeletion,
        drawer: state.drawer,
        providers: state.providers,
        importGeom: state.importGeom,
        geocode: state.geocode,
        updatePermissions: state.updatePermission,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: (args: any) => (
            dispatch(getRuns(args))
        ),
        deleteRun: (uid: string) => {
            dispatch(deleteRun(uid));
        },
        getProviders: () => {
            dispatch(getProviders());
        },
        getGeocode: (query: object) => {
            dispatch(getGeocode(query));
        },
        processGeoJSONFile: (file: File) => {
            dispatch(processGeoJSONFile(file));
        },
        resetGeoJSONFile: () => {
            dispatch(resetGeoJSONFile());
        },
        setOrder: (order: string) => {
            dispatch(setPageOrder(order));
        },
        setView: (view: string) => {
            dispatch(setPageView(view));
        },
        updateDataCartPermissions: (uid: string, permissions: Eventkit.Permissions) => {
            dispatch(updateDataCartPermissions(uid, permissions));
        },
    };
}

export default withWidth()(withTheme()(connect(mapStateToProps, mapDispatchToProps)(DataPackPage)));
