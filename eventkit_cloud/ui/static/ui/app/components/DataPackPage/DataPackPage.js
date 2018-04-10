import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import AppBar from 'material-ui/AppBar';
import CircularProgress from 'material-ui/CircularProgress';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
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
import { getRuns, deleteRuns, setPageOrder, setPageView } from '../../actions/dataPackActions';
import { getProviders } from '../../actions/exportsActions';
import { getGeocode } from '../../actions/searchToolbarActions';
import { processGeoJSONFile, resetGeoJSONFile } from '../../actions/mapToolActions';
import { flattenFeatureCollection } from '../../utils/mapUtils';
import Help from 'material-ui/svg-icons/action/help';
import Joyride from 'react-joyride';

export class DataPackPage extends React.Component {
    constructor(props) {
        super(props);
        this.handleToggle = this.handleToggle.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.checkForEmptySearch = this.checkForEmptySearch.bind(this);
        this.handleOwnerFilter = this.handleOwnerFilter.bind(this);
        this.handleFilterApply = this.handleFilterApply.bind(this);
        this.handleFilterClear = this.handleFilterClear.bind(this);
        this.changeView = this.changeView.bind(this);
        this.makeRunRequest = this.makeRunRequest.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.loadLess = this.loadLess.bind(this);
        this.getView = this.getView.bind(this);
        this.callback = this.callback.bind(this);
        this.handleSpatialFilter = this.handleSpatialFilter.bind(this);
        this.state = {
            open: window.innerWidth >= 1200,
            search: '',
            published: null,
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                submitted: false,
                incomplete: false,
            },
            providers: {},
            view: props.runsList.view || 'map',
            pageLoading: true,
            order: props.runsList.order || '-job__featured',
            ownerFilter: '',
            pageSize: 12,
            loading: false,
            geojson_geometry: null,
            steps: [],
            isRunning: false,
            targetJob: '',
        };
    }

    componentDidMount() {

        this.props.getProviders();
        this.makeRunRequest();
        this.fetch = setInterval(this.makeRunRequest, 10000);
        // make sure no geojson upload is in the state
        this.props.resetGeoJSONFile();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.runsList.fetched && !this.props.runsList.fetched) {
            if (this.state.pageLoading) {
                this.setState({ pageLoading: false });
            }
            if (this.state.loading) {
                this.setState({ loading: false });
            }
        }
        if (nextProps.runsDeletion.deleted && !this.props.runsDeletion.deleted) {
            this.setState({ loading: true }, this.makeRunRequest);
        }
    }


    componentWillUnmount() {
        clearInterval(this.fetch);
        // save view and order to redux state so it can be set next time the page is visited
        if (this.props.runsList.order !== this.state.order) {
            this.props.setOrder(this.state.order);
        }
        if (this.props.runsList.view !== this.state.view) {
            this.props.setView(this.state.view);
        }
    }

    onSearch(searchText) {
        this.setState({ search: searchText, loading: true }, this.makeRunRequest);
    }

    setJoyRideSteps() {
        const tooltipStyle = {
            backgroundColor: 'white',
            borderRadius: '0',
            color: 'black',
            mainColor: '#ff4456',
            textAlign: 'left',
            header: {
                textAlign: 'left',
                fontSize: '20px',
                borderColor: '#4598bf',
            },
            main: {
                paddingTop: '20px',
                paddingBottom: '20px',
            },
            button: {
                color: 'white',
                backgroundColor: '#4598bf',
            },
            skip: {
                display: 'none',
            },
            back: {
                color: '#8b9396',
            },
            hole: {
                backgroundColor: 'rgba(226,226,226, 0.2)',
            },
        };

        const welcomeTooltipStyle = {
            backgroundColor: 'white',
            borderRadius: '0',
            color: 'black',
            mainColor: '#ff4456',
            textAlign: 'left',
            header: {
                textAlign: 'left',
                fontSize: '20px',
                borderColor: '#4598bf',
            },
            arrow: {
                display: 'none',
            },
            main: {
                paddingTop: '20px',
                paddingBottom: '20px',
            },

            button: {
                color: 'white',
                backgroundColor: '#4598bf',
            },
            skip: {
                display: 'none',
            },
            back: {
                color: '#8b9396',
            },
            hole: {
                display: 'none',
            },
        };

        switch (this.state.view) {
        case 'map':
            return [
                {
                    title: 'Welcome to the DataPack Library.',
                    text: 'DataPacks are the core elements of EventKit. Use the DataPack Library to review existing DataPacks, visualize them on a map, search based on name, date, and data source, and find “Featured DataPacks”.',
                    selector: '.qa-DataPackPage-Toolbar-sort',
                    style: welcomeTooltipStyle,
                    position: 'top',
                },
                {
                    title: 'Create DataPack',
                    text: 'Click here to begin creating a DataPack. This will leave the DataPack Library and take you to the Create DataPack page.',
                    selector: '.qa-DataPackLinkButton-RaisedButton',
                    position: 'bottom',
                    style: tooltipStyle,

                },
                {
                    title: 'Search DataPacks',
                    text: 'Text search of existing DataPacks. The name, description, and project fields of every DataPack are indexed and searchable.',
                    selector: '.qa-DataPackSearchBar-TextField',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Filter DataPacks',
                    text: 'Filter DataPacks based on sharing permissions, job status, date range, and data sources.',
                    selector: '.qa-FilterDrawer-Drawer > div',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'DataPack Status',
                    text: 'Check the status (success, error, fail) of previously created DataPacks',
                    selector: '.qa-DataPackListItem-subtitle-date',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Status and Download',
                    text: 'Navigate to the “Status & Download” page of an existing DataPack, where you can download the data.',
                    selector: '.qa-DataPackListItem-IconMenu',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Change Views',
                    text: 'Change the view of the DataPack Library, options include the default map view, a “baseball card” view, and traditional table view.',
                    selector: '.qa-DataPackViewButtons-Icons',
                    position: 'bottom',
                    style: tooltipStyle,
                },
            ];
        case 'grid':
            return [
                {
                    title: 'Welcome to the DataPack Library.',
                    text: 'DataPacks are the core elements of EventKit. Use the DataPack Library to review existing DataPacks, visualize them on a map, search based on name, date, and data source, and find “Featured DataPacks”.',
                    selector: '.qa-DataPackPage-Toolbar-sort',
                    style: welcomeTooltipStyle,
                    position: 'top',
                },
                {
                    title: 'Create DataPack',
                    text: 'Click here to begin creating a DataPack. This will leave the DataPack Library and take you to the Create DataPack page.',
                    selector: '.qa-DataPackLinkButton-RaisedButton',
                    position: 'bottom',
                    style: tooltipStyle,

                },
                {
                    title: 'Search DataPacks',
                    text: 'Text search of existing DataPacks. The name, description, and project fields of every DataPack are indexed and searchable.',
                    selector: '.qa-DataPackSearchBar-TextField',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Filter DataPacks',
                    text: 'Filter DataPacks based on sharing permissions, job status, date range, and data sources.',
                    selector: '.qa-FilterDrawer-Drawer > div',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'DataPack Status',
                    text: 'Check the status (success, error, fail) of previously created DataPacks',
                    selector: '.qa-DataPackGridItem-CardActions',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Status and Download',
                    text: 'Navigate to the “Status & Download” page of an existing DataPack, where you can download the data.',
                    selector: '.qa-DataPackGridItem-IconMenu',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Change Views',
                    text: 'Change the view of the DataPack Library, options include the default map view, a “baseball card” view, and traditional table view.',
                    selector: '.qa-DataPackViewButtons-Icons',
                    position: 'bottom',
                    style: tooltipStyle,
                },
            ];
        case 'list':
            return [
                {
                    title: 'Welcome to the DataPack Library.',
                    text: 'DataPacks are the core elements of EventKit. Use the DataPack Library to review existing DataPacks, visualize them on a map, search based on name, date, and data source, and find “Featured DataPacks”.',
                    selector: '.qa-DataPackPage-Toolbar-sort',
                    style: welcomeTooltipStyle,
                    position: 'top',
                },
                {
                    title: 'Create DataPack',
                    text: 'Click here to begin creating a DataPack. This will leave the DataPack Library and take you to the Create DataPack page.',
                    selector: '.qa-DataPackLinkButton-RaisedButton',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Search DataPacks',
                    text: 'Text search of existing DataPacks. The name, description, and project fields of every DataPack are indexed and searchable.',
                    selector: '.qa-DataPackSearchBar-TextField',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Filter DataPacks',
                    text: 'Filter DataPacks based on sharing permissions, job status, date range, and data sources.',
                    selector: '.qa-FilterDrawer-Drawer > div',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'DataPack Status',
                    text: 'Check the status of previously created DataPacks',
                    selector: '.qa-DataPackTableItem-TableRowColumn-status',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Status and Download',
                    text: 'Navigate to the “Status & Download” page of an existing DataPack, where you can download the data.',
                    selector: '.qa-DataPackTableItem-IconMenu',
                    position: 'bottom',
                    style: tooltipStyle,
                },
                {
                    title: 'Change Views',
                    text: 'Change the view of the DataPack Library, options include the default map view, a “baseball card” view, and traditional table view.',
                    selector: '.qa-DataPackViewButtons-Icons',
                    position: 'bottom',
                    style: tooltipStyle,
                },
            ];
        default: return null;
        }
    }

    getView(view) {
        const commonProps = {
            runs: this.props.runsList.runs,
            user: this.props.user,
            onRunDelete: this.props.deleteRuns,
            range: this.props.runsList.range,
            handleLoadLess: this.loadLess,
            handleLoadMore: this.loadMore,
            loadLessDisabled: this.props.runsList.runs.length <= 12,
            loadMoreDisabled: !this.props.runsList.nextPage,
            providers: this.props.providers,
        };
        switch (view) {
        case 'list':
            return (
                <DataPackList
                    {...commonProps}
                    onSort={this.handleSortChange}
                    order={this.state.order}
                />
            );
        case 'grid':
            return (
                <DataPackGrid
                    {...commonProps}
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
                />
            );
        default: return null;
        }
    }

    checkForEmptySearch(searchText) {
        if (searchText === '' && this.state.search) {
            this.setState({ search: '', loading: true }, this.makeRunRequest);
        }
    }

    handleSortChange(value) {
        this.setState({ order: value, loading: true }, this.makeRunRequest);
    }

    makeRunRequest() {
        const status = [];
        Object.keys(this.state.status).forEach((key) => {
            if (this.state.status[key]) {
                status.push(key.toUpperCase());
            }
        });

        const providers = Object.keys(this.state.providers);

        const params = {};
        params.page_size = this.state.pageSize;
        params.ordering = this.state.order.includes('featured') ?
            `${this.state.order},-started_at`
            :
            this.state.order;
        if (this.state.ownerFilter) params.user = this.state.ownerFilter;
        if (this.state.published) params.published = this.state.published;
        if (status.length) params.status = status.join(',');
        if (this.state.minDate) {
            params.min_date = this.state.minDate.toISOString().substring(0, 10);
        }
        if (this.state.maxDate) {
            const maxDate = new Date(this.state.maxDate.getTime());
            maxDate.setDate(maxDate.getDate() + 1);
            params.max_date = maxDate.toISOString().substring(0, 10);
        }
        if (this.state.search) params.search_term = this.state.search.slice(0, 1000);
        if (providers.length) params.providers = providers.join(',');

        return this.props.getRuns(params, this.state.geojson_geometry);
    }

    handleOwnerFilter(event, index, value) {
        this.setState({ ownerFilter: value, loading: true }, this.makeRunRequest);
    }

    handleFilterApply(state) {
        this.setState({ ...this.state, ...state, loading: true }, this.makeRunRequest);
        if (window.innerWidth < 1200) {
            this.setState({ open: false });
        }
    }

    handleFilterClear() {
        this.setState({
            published: null,
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
        if (window.innerWidth < 1200) {
            this.setState({ open: false });
        }
    }

    handleSpatialFilter(geojson) {
        let geom = null;
        if (geojson) {
            geom = flattenFeatureCollection(geojson).features[0].geometry;
        }
        this.setState({ geojson_geometry: geom, loading: true }, this.makeRunRequest);
    }

    changeView(view) {
        if (['started_at', '-started_at', 'job__name', '-job__name', '-job__featured', 'job__featured'].indexOf(this.state.order) < 0) {
            this.setState({ order: '-started_at', loading: true }, () => {
                const promise = this.makeRunRequest();
                promise.then(() => this.setState({ view }));
            });
        } else {
            this.setState(
                { view },
                function () {
                    const steps = this.setJoyRideSteps();
                    this.joyrideAddSteps(steps);
                },
            );
        }
    }

    handleToggle() {
        this.setState({ open: !this.state.open });
    }

    loadMore() {
        if (this.props.runsList.nextPage) {
            this.setState(
                { pageSize: this.state.pageSize + 12, loading: true },
                this.makeRunRequest,
            );
        }
    }

    loadLess() {
        if (this.state.pageSize > 12) {
            this.setState(
                { pageSize: this.state.pageSize - 12, loading: true },
                this.makeRunRequest,
            );
        }
    }

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        this.setState({ steps: newSteps });
    }

    callback(data) {
        if (data.action === 'close' || data.action === 'skip' || data.type === 'finished') {
            // This explicitly stops the tour (otherwise it displays a "beacon" to resume the tour)
            this.setState({ isRunning: false });
            this.refs.joyride.reset(true);
        }
        if (data.step) {
            if (data.step.title === 'Filter DataPacks' && data.type === 'step:before') {
                if (this.state.open === false) {
                    this.setState({open: true});
                }
            }
        }
    }

    handleJoyride() {
        if (this.state.isRunning === true) {
            this.setState({ isRunning: false, steps: [] });
            this.refs.joyride.reset(true);
        } else {
            this.setState({ isRunning: true });
            const steps = this.setJoyRideSteps();

            for (let index = 0; index < this.props.runsList.runs.length; index += 1) {
                const run = this.props.runsList.runs[index];
                if (run.job.featured === true) {
                    const newStep = {
                        title: 'Featured DataPacks',
                        text: 'Popular or sought after DataPacks can be tagged as “Featured” and will be prominently displayed in each view',
                        selector: this.state.view ==='list' ?
                            '.qa-DataPackTableItem-TableRowColumn-featured'
                            :
                            '.qa-FeaturedFlag-div',
                        style: {
                            backgroundColor: 'white',
                            borderRadius: '0',
                            color: 'black',
                            mainColor: '#ff4456',
                            textAlign: 'left',
                            header: {
                                textAlign: 'left',
                                fontSize: '20px',
                                borderColor: '#4598bf',
                            },
                            main: {
                                paddingTop: '20px',
                                paddingBottom: '20px',
                            },
                            button: {
                                color: 'white',
                                backgroundColor: '#4598bf',
                            },
                            skip: {
                                display: 'none',
                            },
                            back: {
                                color: '#8b9396',
                            },
                            hole: {
                                backgroundColor: 'rgba(226,226,226, 0.2)',
                            },
                        },
                        position: 'top',
                    };
                    steps.push(newStep);
                    break;
                }
            }
            this.joyrideAddSteps(steps);
        }
    }

    render() {
        const { steps, isRunning } = this.state;
        const pageTitle = <div style={{ display: 'inline-block', paddingRight: '10px' }}>DataPack Library</div>
        const iconElementRight = <div onTouchTap={this.handleJoyride.bind(this)} style={{ color: '#4598bf', cursor: 'pointer', display: 'inline-block', marginRight: '30px', fontSize: '16px' }}><Help onTouchTap={this.handleJoyride.bind(this)} style={{ color: '#4598bf', cursor: 'pointer', height: '18px', width: '18px', verticalAlign: 'middle', marginRight: '5px', marginBottom: '5px' }} />Page Tour</div>
        const styles = {
            wholeDiv: {
                height: window.innerWidth > 575 ?
                    window.innerHeight - 231
                    :
                    window.innerHeight - 223,
                backgroundRepeat: 'repeat repeat',
                marginRight: this.state.open && window.innerWidth >= 1200 ? '250px' : '0px',
                marginTop: window.innerWidth > 575 ? '10px' : '2px',
            },
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                paddingLeft: '10px',
                height: '35px',
            },
            toolbarSearch: {
                backgroundColor: '#253447',
            },
            toolbarSort: {
                backgroundColor: '#253447',
                height: '35px',
                display: 'inline-block',
                width: '100%',
            },
            containerStyle: {
                backgroundColor: '#fff',
                top: '221px',
                height: window.innerHeight - 221,
                overflowY: 'hidden',
                overflowX: 'hidden',
            },
            backgroundStyle: {
                backgroundImage: `url(${require('../../../images/ek_topo_pattern.png')})`,
            },
            range: window.innerWidth < 768 ?
                { color: '#a59c9c', lineHeight: '36px', fontSize: '12px' }
                :
                {
                    display: 'inline-block',
                    position: 'absolute',
                    color: '#a59c9c',
                    lineHeight: '36px',
                    right: '10px',
                    fontSize: '12px',
                },
        };

        return (
            <div style={styles.backgroundStyle}>
                <Joyride
                    callback={this.callback}
                    ref="joyride"
                    debug={false}
                    steps={steps}
                    autoStart={true}
                    type="continuous"
                    disableOverlay
                    showSkipButton={true}
                    showStepsProgress={true}
                    locale={{
                        back: (<span>Back</span>),
                        close: (<span>Close</span>),
                        last: (<span>Done</span>),
                        next: (<span>Next</span>),
                        skip: (<span>Skip</span>),
                    }}
                    run={isRunning}
                />
                <AppBar
                    className="qa-DataPackPage-AppBar"
                    style={styles.appBar}
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconElementLeft={<p />}
                    iconElementRight={iconElementRight}
                >
                    <DataPackLinkButton />
                </AppBar>

                <Toolbar className="qa-DataPackPage-Toolbar-search" style={styles.toolbarSearch}>
                    <ToolbarGroup className="qa-DataPackPage-ToolbarGroup-search" style={{ width: '100%' }}>
                        <DataPackSearchbar
                            onSearchChange={this.checkForEmptySearch}
                            onSearchSubmit={this.onSearch}
                        />
                    </ToolbarGroup>
                </Toolbar>

                <Toolbar className="qa-DataPackPage-Toolbar-sort" style={styles.toolbarSort}>
                    <DataPackOwnerSort
                        handleChange={this.handleOwnerFilter}
                        value={this.state.ownerFilter}
                        owner={this.props.user.data.user.username}
                    />
                    <DataPackFilterButton
                        handleToggle={this.handleToggle}
                        active={this.state.open}
                    />
                    {this.state.view === 'list' && window.innerWidth >= 768 ?
                        null
                        :
                        <DataPackSortDropDown
                            handleChange={(e, i, v) => { this.handleSortChange(v); }}
                            value={this.state.order}
                        />
                    }
                    <DataPackViewButtons
                        handleViewChange={this.changeView}
                        view={this.state.view}
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
                        <div style={{ width: '100%', height: '100%', display: 'inline-flex' }}>
                            <CircularProgress
                                style={{ margin: 'auto', display: 'block' }}
                                color="#4598bf"
                                size={50}
                            />
                        </div>
                        :
                        <div style={{ position: 'relative' }} className="qa-DataPackPage-view">
                            {this.state.loading || this.props.runsDeletion.deleting || this.props.importGeom.processing ?
                                <div style={{ zIndex: 10, position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                    <div style={{ width: '100%', height: '100%', display: 'inline-flex' }}>
                                        <CircularProgress
                                            style={{ margin: 'auto', display: 'block' }}
                                            color="#4598bf"
                                            size={50}
                                        />
                                    </div>
                                </div>
                                : null
                            }
                            {this.getView(this.state.view)}
                        </div>
                    }
                </div>
            </div>
        );
    }
}

DataPackPage.propTypes = {
    runsList: PropTypes.shape({
        cancelSource: PropTypes.object,
        error: PropTypes.string,
        fetched: PropTypes.bool,
        fetching: PropTypes.bool,
        nextPage: PropTypes.bool,
        order: PropTypes.string,
        range: PropTypes.string,
        runs: PropTypes.arrayOf(PropTypes.object),
        view: PropTypes.string,
    }).isRequired,
    user: PropTypes.object.isRequired,
    getRuns: PropTypes.func.isRequired,
    deleteRuns: PropTypes.func.isRequired,
    getProviders: PropTypes.func.isRequired,
    runsDeletion: PropTypes.object.isRequired,
    drawer: PropTypes.string.isRequired,
    importGeom: PropTypes.object.isRequired,
    geocode: PropTypes.object.isRequired,
    getGeocode: PropTypes.func.isRequired,
    processGeoJSONFile: PropTypes.func.isRequired,
    resetGeoJSONFile: PropTypes.func.isRequired,
    setOrder: PropTypes.func.isRequired,
    setView: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function mapStateToProps(state) {
    return {
        runsList: state.runsList,
        user: state.user,
        runsDeletion: state.runsDeletion,
        drawer: state.drawer,
        providers: state.providers,
        importGeom: state.importGeom,
        geocode: state.geocode,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: (params, geojson) => (
            dispatch(getRuns(params, geojson))
        ),
        deleteRuns: (uid) => {
            dispatch(deleteRuns(uid));
        },
        getProviders: () => {
            dispatch(getProviders());
        },
        getGeocode: (query) => {
            dispatch(getGeocode(query));
        },
        processGeoJSONFile: (file) => {
            dispatch(processGeoJSONFile(file));
        },
        resetGeoJSONFile: () => {
            dispatch(resetGeoJSONFile());
        },
        setOrder: (order) => {
            dispatch(setPageOrder(order));
        },
        setView: (view) => {
            dispatch(setPageView(view));
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DataPackPage);
