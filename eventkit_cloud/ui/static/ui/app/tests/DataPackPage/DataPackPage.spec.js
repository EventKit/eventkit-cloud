import React from 'react';
import sinon from 'sinon';
import raf from 'raf';
import { mount, shallow } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import AppBar from 'material-ui/AppBar';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import CircularProgress from 'material-ui/CircularProgress';
import { DataPackPage } from '../../components/DataPackPage/DataPackPage';
import FilterDrawer from '../../components/DataPackPage/FilterDrawer';
import DataPackGrid from '../../components/DataPackPage/DataPackGrid';
import DataPackList from '../../components/DataPackPage/DataPackList';
import MapView from '../../components/DataPackPage/MapView';
import DataPackSearchbar from '../../components/DataPackPage/DataPackSearchbar';
import DataPackViewButtons from '../../components/DataPackPage/DataPackViewButtons';
import DataPackSortDropDown from '../../components/DataPackPage/DataPackSortDropDown';
import DataPackFilterButton from '../../components/DataPackPage/DataPackFilterButton';
import DataPackOwnerSort from '../../components/DataPackPage/DataPackOwnerSort';
import DataPackLinkButton from '../../components/DataPackPage/DataPackLinkButton';
import * as utils from '../../utils/mapUtils';
import Joyride from 'react-joyride';
import Help from 'material-ui/svg-icons/action/help';

// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();
jest.mock('../../components/DataPackPage/MapView');

describe('DataPackPage component', () => {
    const muiTheme = getMuiTheme();
    const providers = [
        {
            "id": 2,
            "model_url": "http://cloud.eventkit.dev/api/providers/osm",
            "type": "osm",
            "license": null,
            "created_at": "2017-08-15T19:25:10.844911Z",
            "updated_at": "2017-08-15T19:25:10.844919Z",
            "uid": "bc9a834a-727a-4779-8679-2500880a8526",
            "name": "OpenStreetMap Data (Themes)",
            "slug": "osm",
            "preview_url": "",
            "service_copyright": "",
            "service_description": "OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).",
            "layer": null,
            "level_from": 0,
            "level_to": 10,
            "zip": false,
            "display": true,
            "export_provider_type": 2
        },
    ];

    const tooltipStyle = {
        backgroundColor: 'white',
        borderRadius: '0',
        color: 'black',
        mainColor: '#ff4456',
        textAlign: 'left',
        header: {
            textAlign: 'left',
            fontSize: '20px',
            borderColor: '#4598bf'
        },
        main: {
            paddingTop: '20px',
            paddingBottom: '20px',
        },

        button: {
            color: 'white',
            backgroundColor: '#4598bf'
        },
        skip: {
            color: '#8b9396'
        },
        back: {
            color: '#8b9396'
        },
        hole: {
            backgroundColor: 'rgba(226,226,226, 0.2)',
        }
    };
    const getProps = () => {
        return {
            runsList: {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '12/24',
                order: '',
                view: '',
            },
            user: { data: { user: { username: 'admin' } } },
            getRuns: () => {},
            deleteRuns: () => {},
            getProviders: () => {},
            runsDeletion: {
                deleting: false,
                deleted: false,
                error: null,
            },
            drawer: 'open',
            providers,
            importGeom: {},
            geocode: {},
            getGeocode: () => {},
            processGeoJSONFile: () => {},
            resetGeoJSONFile: () => {},
            setOrder: () => {},
            setView: () => {},
        };
    };

    const getWrapper = props => (
        mount(<DataPackPage {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        })
    );

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(AppBar).find('div').at(2).text()).toEqual('DataPack Library');
        expect(wrapper.find(DataPackLinkButton)).toHaveLength(1);
        expect(wrapper.find(Toolbar)).toHaveLength(2);
        expect(wrapper.find(ToolbarGroup)).toHaveLength(1);
        expect(wrapper.find(DataPackSearchbar)).toHaveLength(1);
        expect(wrapper.find(DataPackOwnerSort)).toHaveLength(1);
        expect(wrapper.find(DataPackFilterButton)).toHaveLength(1);
        expect(wrapper.find(DataPackSortDropDown)).toHaveLength(1);
        expect(wrapper.find(DataPackViewButtons)).toHaveLength(1);
        expect(wrapper.find(FilterDrawer)).toHaveLength(1);
        expect(wrapper.find(Joyride)).toHaveLength(1);
        expect(wrapper.find(Help)).toHaveLength(1);
        // Should show loading before datapacks have been fetched
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        expect(wrapper.find(DataPackGrid)).toHaveLength(0);
        expect(wrapper.find(DataPackList)).toHaveLength(0);
    });

    it('DataPackSortDropDown handleChange should call handleSortChange', () => {
        const props = getProps();
        const changeStub = sinon.stub(DataPackPage.prototype, 'handleSortChange');
        const wrapper = getWrapper(props);
        wrapper.find(DataPackSortDropDown).props().handleChange({}, 0, 'value');
        expect(changeStub.calledOnce).toBe(true);
        expect(changeStub.calledWith('value')).toBe(true);
        changeStub.restore();
    });

    it('should use order and view from props or just default to map and featured', () => {
        const props = getProps();
        props.runsList.order = 'job__featured';
        props.runsList.view = 'grid';
        const wrapper = getWrapper(props);
        expect(wrapper.state().order).toEqual('job__featured');
        expect(wrapper.state().view).toEqual('grid');
        wrapper.unmount();
        const nextProps = getProps();
        const nextWrapper = getWrapper(nextProps);
        expect(nextWrapper.state().order).toEqual('-job__featured');
        expect(nextWrapper.state().view).toEqual('map');
    });

    it('componentWillReceiveProps should set PageLoading false when runs are fetched', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(DataPackPage.prototype, 'setState');
        const nextProps = getProps();
        nextProps.runsList.fetched = true;
        wrapper.setProps(nextProps);
        expect(stateStub.calledWith({ pageLoading: false })).toBe(true);
        stateStub.restore();
    });

    it('componentWillReceiveProps should set loading false when runs are fetched', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ loading: true, pageLoading: false });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const nextProps = getProps();
        nextProps.runsList.fetched = true;
        wrapper.setProps(nextProps);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ loading: false })).toBe(true);
    });

    it('should show a progress circle when deleting a datapack', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.runsList.fetched = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        nextProps.runsDeletion.deleting = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('componentDidMount should make data requests, setJoyRideSteps and setInterval', () => {
        const props = getProps();
        props.getProviders = sinon.spy();
        props.resetGeoJSONFile = sinon.spy();
        const mountSpy = sinon.spy(DataPackPage.prototype, 'componentDidMount');
        const requestStub = sinon.stub(DataPackPage.prototype, 'makeRunRequest');
        const intervalStub = sinon.stub(global, 'setInterval');
        const joyrideSpy = new sinon.spy(DataPackPage.prototype, 'setJoyRideSteps');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(props.getProviders.calledOnce).toBe(true);
        expect(requestStub.calledOnce).toBe(true);
        expect(intervalStub.calledWith(wrapper.instance().makeRunRequest, 10000)).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        expect(props.resetGeoJSONFile.calledOnce).toBe(true);
        mountSpy.restore();
        requestStub.restore();
        intervalStub.restore();
        joyrideSpy.restore();
    });

    it('componentWillUnmout should clear interval', () => {
        const props = getProps();
        const mountSpy = sinon.spy(DataPackPage.prototype, 'componentWillUnmount');
        const intervalSpy = sinon.spy(global, 'clearInterval');
        const wrapper = getWrapper(props);
        const { fetch } = wrapper.instance();
        wrapper.unmount();
        expect(mountSpy.calledOnce).toBe(true);
        expect(intervalSpy.calledWith(fetch)).toBe(true);
        mountSpy.restore();
        intervalSpy.restore();
    });

    it('should setOrder and setView if props are different from state', () => {
        const props = getProps();
        props.setOrder = sinon.spy();
        props.setView = sinon.spy();
        const wrapper = getWrapper(props);
        expect(wrapper.props().runsList.order).toEqual('');
        expect(wrapper.props().runsList.view).toEqual('');
        expect(wrapper.state().order).toEqual('-job__featured');
        expect(wrapper.state().view).toEqual('map');
        wrapper.unmount();
        expect(props.setOrder.calledOnce).toBe(true);
        expect(props.setOrder.calledWith('-job__featured')).toBe(true);
        expect(props.setView.calledOnce).toBe(true);
        expect(props.setView.calledWith('map')).toBe(true);
    });

    it('should run getRuns at intervals', () => {
        jest.useFakeTimers();
        let props = getProps();
        props.getRuns = sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.getRuns.calledOnce).toBe(true);
        expect(setInterval.mock.calls.length).toEqual(1);
        expect(setInterval.mock.calls[0][1]).toEqual(10000);
        jest.runOnlyPendingTimers();
        expect(props.getRuns.calledTwice).toBe(true);
        jest.runOnlyPendingTimers();
        expect(props.getRuns.calledThrice).toBe(true);
    });

    it('should remove the fetch interval on unmount', () => {
        jest.useFakeTimers();
        let props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        expect(clearInterval.mock.calls.length).toEqual(0);
        const fetch = wrapper.instance().fetch;
        wrapper.unmount();
        expect(clearInterval.mock.calls.length).toEqual(1);
        expect(clearInterval.mock.calls[0][0]).toEqual(fetch);
    });

    it('should handle fetched runs', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        let nextProps = getProps();
        nextProps.runsList.fetched = true;
        nextProps.runsList.runs = [{user: 'admin2', uid: '2'}, {user: 'admin', uid: '1'}, {user: 'admin3', uid: '3'}];
        const propsSpy = sinon.spy(DataPackPage.prototype, 'componentWillReceiveProps');
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showLoading: false}));
        DataPackPage.prototype.setState.restore();
        DataPackPage.prototype.componentWillReceiveProps.restore();
    });

    it('onSearch should update the state and call makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().onSearch('test_search', 0);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({search: 'test_search', loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('checkForEmptySearch should update state and call makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        wrapper.setState({search: 'some search term'});
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().checkForEmptySearch('');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({search: '', loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('if a run has been deleted it should call makeRunRequest again', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        const makeRequestSpy = sinon.spy(DataPackPage.prototype, 'makeRunRequest');
        const wrapper = getWrapper(props);
        expect(makeRequestSpy.calledOnce).toBe(true);
        let nextProps = getProps();
        nextProps.runsDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        expect(makeRequestSpy.calledTwice).toBe(true);
        makeRequestSpy.restore();
        stateSpy.restore();
    });

    it('handleSortChange should set state and call makeRunRequest', () => {
        let props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleSortChange('job__name');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({order: 'job__name', loading: true}, wrapper.instance().makeRunRequest))
        stateSpy.restore();
    });

    it('makeRunRequest should build a params object and pass it to props.getRuns', () => {
        const props = getProps();
        props.getRuns = sinon.spy();
        const wrapper = shallow(<DataPackPage {...props} />);
        const status = { completed: true, incomplete: true };
        const minDate = new Date(2017, 6, 30, 8, 0, 0);
        const maxDate = new Date(2017, 7, 1, 3, 0, 0);
        const owner = 'test_user';
        const published = 'True';
        const search = 'search_text';
        const expectedParams = {
            page_size: 12,
            ordering: '-job__featured,-started_at',
            user: 'test_user',
            published: 'True',
            status: 'COMPLETED,INCOMPLETE',
            min_date: '2017-07-30',
            max_date: '2017-08-02',
            search_term: 'search_text',
        };
        wrapper.setState({
            status,
            minDate,
            maxDate,
            ownerFilter: owner,
            published,
            search,
        });
        wrapper.instance().makeRunRequest();
        expect(props.getRuns.calledOnce).toBe(true);
        expect(props.getRuns.calledWith(expectedParams, null)).toBe(true);
    });

    it('handleOwnerFilter should set state and call makeRunRequest', () => {
        const props = getProps();
        const event = {persist: () => {}};
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleOwnerFilter(event, 0, 'test_value');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ownerFilter: 'test_value', loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });
    
    it('handleFilterApply should take filter state in and update new state then make runRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const currentState = {...wrapper.state()};
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        const newState = {
            published: true, 
            minDate: new Date(), 
            maxDate: new Date(), 
            status: {
                completed: true,
                submitted: false,
                incomplete: false
            }
        }
        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        wrapper.instance().handleFilterApply(newState);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({...currentState, ...newState, loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        expect(stateSpy.calledWith({open: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleFilterClear should setState then re-apply search and sort', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        wrapper.instance().handleFilterClear();
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({
            published: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            minDate: null,
            maxDate: null,
            providers: {},
            loading: true,
        }, wrapper.instance().makeRunRequest)).toBe(true);
        expect(stateSpy.calledWith({ open: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleSpatialFilter should setstate then call make run request', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        const geojson = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [69.60937499999999, 60.23981116999893],
                            [46.40625, 55.178867663281984],
                            [26.3671875, 55.97379820507658],
                        ],
                    },
                },
            ],
        };
        const expected = utils.flattenFeatureCollection(geojson).features[0].geometry;
        wrapper.instance().handleSpatialFilter(geojson);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith(
            { geojson_geometry: expected, loading: true },
            wrapper.instance().makeRunRequest,
        )).toBe(true);
        stateSpy.restore();
    });

    it('changeView should makeRunRequest if its not a shared order, otherwise just set view state', () => {
        let props = getProps();
        const promise = {then: (func) => {func()}};
        props.getRuns = (params) => {return promise};
        const wrapper = shallow(<DataPackPage {...props}/>);
        const joyrideSpy = sinon.spy(DataPackPage.prototype, 'setJoyRideSteps');
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().changeView('list');
        expect(wrapper.update().state().view).toBe('list');
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({view: 'list'})).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        wrapper.setState({order: 'some_other_order'});
        wrapper.instance().changeView('map');
        expect(stateSpy.callCount).toEqual(5);
        expect(stateSpy.calledWith({order: 'some_other_order', loading: true}, Function));
        expect(stateSpy.calledWith({view: 'map'})).toBe(true);
        stateSpy.restore();
        joyrideSpy.restore();
    });

    it('handleToggle should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleToggle();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({open: false}));
        stateSpy.restore();
    });

    it('if nextPage is true, loadMore should increase page size and makeRunRequest', () => {
        let props = getProps();
        props.runsList.nextPage = true;
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().loadMore();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({pageSize: 24, loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('if pageSize is greater than 12  is should decrease pageSize and makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        wrapper.setState({pageSize: 24});
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().loadLess();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({pageSize: 12, loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('getView should return null, list, grid, or map component', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);

        const commonProps = {
            runs: props.runsList.runs,
            user: props.user,
            onRunDelete: props.deleteRuns,
            range: props.runsList.range,
            handleLoadLess: wrapper.instance().loadLess,
            handleLoadMore: wrapper.instance().loadMore,
            loadLessDisabled: props.runsList.runs.length <= 12,
            loadMoreDisabled: !props.runsList.nextPage,
            providers,
        };

        expect(wrapper.instance().getView('list')).toEqual((
            <DataPackList
                {...commonProps}
                onSort={wrapper.instance().handleSortChange}
                order={wrapper.state().order}
            />
        ));

        expect(wrapper.instance().getView('grid')).toEqual((
            <DataPackGrid
                {...commonProps}
            />
        ));

        expect(wrapper.instance().getView('map')).toEqual((
            <MapView
                {...commonProps}
                geocode={props.geocode}
                getGeocode={props.getGeocode}
                importGeom={props.importGeom}
                processGeoJSONFile={props.processGeoJSONFile}
                resetGeoJSONFile={props.resetGeoJSONFile}
                onMapFilter={wrapper.instance().handleSpatialFilter}
            />
        ));
        expect(wrapper.instance().getView('bad case')).toEqual(null);
    });

    it('setJoyRideSteps should return correct steps based on view', () => {

        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        wrapper.setState({view: 'map'});
        expect(wrapper.instance().setJoyRideSteps()).toEqual(
            [   {title: 'Create DataPack', text: 'Click here to Navigate to Create a DataPack.', selector: '.qa-DataPackLinkButton-RaisedButton', position: 'bottom', style: tooltipStyle,},
                {title: 'Search DataPacks', text: 'Search and Sort the existing DataPack Library.', selector: '.qa-DataPackSearchBar-TextField',  position: 'bottom', style: tooltipStyle,},
                {title: 'Filter DataPacks', text: 'Filter the DataPack Library by Permission, Status, Dates and Data Sources.', selector: '.qa-FilterDrawer-Drawer > div', position: 'bottom', style: tooltipStyle,},
                {title: 'DataPack Status', text: 'Check the status of previously created DataPacks', selector: '.qa-DataPackListItem-subtitle-date', position: 'bottom', style: tooltipStyle,},
                {title: 'Status and Download', text: 'Navigate to the “Status & Download” page of an existing DataPack, where you can download the data.', selector: '.qa-DataPackListItem-IconMenu', position: 'bottom', style: tooltipStyle,},
            ]
        );
        wrapper.setState({view: 'grid'});
        expect(wrapper.instance().setJoyRideSteps()).toEqual(
            [   {title: 'Create DataPack', text: 'Click here to Navigate to Create a DataPack.', selector: '.qa-DataPackLinkButton-RaisedButton', position: 'bottom', style: tooltipStyle,},
                {title: 'Search DataPacks', text: 'Search and Sort the existing DataPack Library.', selector: '.qa-DataPackSearchBar-TextField', position: 'bottom', style: tooltipStyle,},
                {title: 'Filter DataPacks', text: 'Filter the DataPack Library by Permission, Status, Dates and Data Sources.', selector: '.qa-FilterDrawer-Drawer > div', position: 'bottom', style: tooltipStyle,},
                {title: 'DataPack Status', text: 'Check the status of previously created DataPacks', selector: '.qa-DataPackGridItem-CardActions', position: 'bottom', style: tooltipStyle,},
                {title: 'Status and Download', text: 'Navigate to the “Status & Download” page of an existing DataPack, where you can download the data.', selector: '.qa-DataPackGridItem-IconMenu', position: 'bottom', style: tooltipStyle,},
            ]
        );
        wrapper.setState({view: 'list'})
        expect(wrapper.instance().setJoyRideSteps()).toEqual(
            [   {title: 'Create DataPack', text: 'Click here to Navigate to Create a DataPack.', selector: '.qa-DataPackLinkButton-RaisedButton', position: 'bottom', style: tooltipStyle,},
                {title: 'Search DataPacks', text: 'Search and Sort the existing DataPack Library.', selector: '.qa-DataPackSearchBar-TextField', position: 'bottom', style: tooltipStyle,},
                {title: 'Filter DataPacks', text: 'Filter the DataPack Library by Permission, Status, Dates and Data Sources.', selector: '.qa-FilterDrawer-Drawer > div', position: 'bottom', style: tooltipStyle,},
                {title: 'DataPack Status', text: 'Check the status of previously created DataPacks', selector: '.qa-DataPackTableItem-TableRowColumn-status', position: 'bottom', style: tooltipStyle,},
                {title: 'Status and Download', text: 'Navigate to the “Status & Download” page of an existing DataPack, where you can download the data.', selector: '.qa-DataPackTableItem-IconMenu', position: 'bottom', style: tooltipStyle,},
            ]
        );

    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [   {title: 'Create DataPack', text: 'Click here to Navigate to Create a DataPack.', selector: '.qa-DataPackLinkButton-RaisedButton', position: 'bottom', style: tooltipStyle,},
            {title: 'Search DataPacks', text: 'Search and Sort the existing DataPack Library.', selector: '.qa-DataPackSearchBar-TextField',  position: 'bottom', style: tooltipStyle,},
            {title: 'Filter DataPacks', text: 'Filter the DataPack Library by Permission, Status, Dates and Data Sources.', selector: '.qa-FilterDrawer-Drawer > div', position: 'bottom', style: tooltipStyle,},
            {title: 'DataPack Status', text: 'Check the status of previously created DataPacks', selector: '.qa-DataPackListItem-subtitle-date', position: 'bottom', style: tooltipStyle,},
            {title: 'Status and Download', text: 'Navigate to the “Status & Download” page of an existing DataPack, where you can download the data.', selector: '.qa-DataPackListItem-IconMenu', position: 'bottom', style: tooltipStyle,},
        ]
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({steps: steps}));
        stateSpy.restore();
    });

    it('handleJoyride should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleJoyride();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({isRunning: false}));
        stateSpy.restore();
    });

    it('callback function should open drawer if it is closed', () => {
        const callbackData = {
            action: "next",
            index: 2,
            step: {
                position: "bottom",
                selector: ".qa-DataPackLinkButton-RaisedButton",
                style: tooltipStyle,
                text: "Click here to Navigate to Create a DataPack.",
                title: "Create DataPack",
            },
            type: "step:before",
        }
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.setState({open: false});
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({open: true}));
        stateSpy.restore();
    });

    it('callback should stop tour if close is clicked', () => {
        const callbackData = {
            action: "close",
            index: 2,
            step: {
                position: "bottom",
                selector: ".qa-DataPackLinkButton-RaisedButton",
                style: tooltipStyle,
                text: "Click here to Navigate to Create a DataPack.",
                title: "Create DataPack",
            },
            type: "step:before",
        }
        const props = getProps();
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledWith({isRunning: false}));
        stateSpy.restore();
    });

});

