import * as React from 'react';
import * as sinon from 'sinon';

import {shallow} from 'enzyme';
import Joyride from 'react-joyride';
import Help from '@material-ui/icons/Help';
import Toolbar from '@material-ui/core/Toolbar';
import PageHeader from '../../components/common/PageHeader';
import PageLoading from '../../components/common/PageLoading';
import {DataPackPage} from '../../components/DataPackPage/DataPackPage';
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
import {joyride} from '../../joyride.config';
import history from '../../utils/history';
import queryString from 'query-string';

describe('DataPackPage component', () => {
    const getProps = () => ({
        runIds: [],
        runsFetched: null,
        runsFetching: null,
        runsMeta: {
            range: '12/24',
            nextPage: false,
            order: '',
            view: '',
        },
        user: {data: {user: {username: 'admin'}}},
        getRuns: sinon.spy(),
        deleteRun: sinon.spy(),
        getFormats: sinon.spy(),
        getProviders: sinon.spy(),
        getProjections: sinon.spy(),
        runDeletion: {
            deleting: false,
            deleted: false,
            error: null,
        },
        drawer: 'open',
        providers: [],
        importGeom: {},
        geocode: {},
        getGeocode: sinon.spy(),
        processGeoJSONFile: sinon.spy(),
        resetGeoJSONFile: sinon.spy(),
        setOrder: sinon.spy(),
        setView: sinon.spy(),
        groups: [
            {
                id: 1,
                name: 'group_one',
                members: ['user_one'],
                administrators: ['user_three'],
            },
            {
                id: 2,
                name: 'group_two',
                members: ['user_two'],
                administrators: ['user_three'],
            },
            {
                id: 3,
                name: 'group_three',
                members: ['user_one', 'user_two'],
                administrators: ['user_one'],
            },
        ],
        users: [
            {
                user: {
                    first_name: 'user',
                    last_name: 'one',
                    username: 'user_one',
                    email: 'user.one@email.com',
                },
                groups: [1, 3],
            },
            {
                user: {
                    first_name: 'user',
                    last_name: 'two',
                    username: 'user_two',
                    email: 'user.two@email.com',
                },
                groups: [2, 3],
            },
        ],
        updateDataCartPermissions: sinon.spy(),
        updatePermissions: {
            updating: false,
            updated: false,
            error: null,
        },
        location: {
            search: queryString.stringify({
                collection: '',
                order: '-job__featured',
                view: 'map',
                page_size: '12',
                search: null
            }),
        },
        ...(global as any).eventkit_test_props,
    });

    const config = {DATAPACK_PAGE_SIZE: '12'};

    let props;
    let wrapper;
    let instance;

    const setup = (overrides = {}) => {
        props = {...getProps(), ...overrides};
        wrapper = shallow(<DataPackPage {...props} />, {
            context: {config},
        });
        instance = wrapper.instance();
    };

    let browserHistory;
    beforeAll(() => {
        browserHistory = sinon.stub(history, 'push');
    });

    afterAll(() => {
        browserHistory.restore();
    });

    beforeEach(setup);

    it('should render all the basic components', () => {
        expect(wrapper.find(PageHeader)).toHaveLength(1);
        expect(wrapper.find(DataPackLinkButton)).toHaveLength(1);
        expect(wrapper.find(Toolbar)).toHaveLength(2);
        expect(wrapper.find(DataPackSearchbar)).toHaveLength(1);
        expect(wrapper.find(DataPackOwnerSort)).toHaveLength(1);
        expect(wrapper.find(DataPackFilterButton)).toHaveLength(1);
        expect(wrapper.find(DataPackSortDropDown)).toHaveLength(1);
        expect(wrapper.find(DataPackViewButtons)).toHaveLength(1);
        expect(wrapper.find(FilterDrawer)).toHaveLength(1);
        expect(wrapper.find(Joyride)).toHaveLength(1);
        expect(wrapper.find(Help)).toHaveLength(1);
        // Should show loading before datapacks have been fetched
        expect(wrapper.find(PageLoading)).toHaveLength(1);
        expect(wrapper.find(DataPackGrid)).toHaveLength(0);
        expect(wrapper.find(DataPackList)).toHaveLength(0);
    });

    it('componentWillMount should call updateLocationQuery with default query', () => {
        const location = {...props.location, search: {}};
        const expectedDefault = {
            collection: 'all',
            order: '-job__featured',
            view: 'map',
            page_size: Number(config.DATAPACK_PAGE_SIZE),
            search: null
        };
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        wrapper.setProps({location});
        instance.componentWillMount();
        expect(updateStub.called).toBe(true);
        expect(updateStub.calledWith(expectedDefault)).toBe(true);
    });

    it('should use order and view from props or just default to map and featured', () => {
        browserHistory.reset();
        const order = 'job__featured';
        const view = 'grid';
        const expectedParams = {
            collection: 'all',
            order,
            view,
            page_size: '12',
            search: null,
        }
        setup({runsMeta: {...props.runsMeta, order, view}, location: {search: {}}});
        expect(browserHistory.called).toBe(true);
        expect(browserHistory.calledWith({
            ...props.location,
            search: queryString.stringify(expectedParams),
        })).toBe(true);
        browserHistory.reset();
        setup({location: {search: {}}});
        expectedParams.order = '-job__featured'
        expectedParams.view = 'map'
        expect(browserHistory.called).toBe(true);
        expect(browserHistory.calledWith({
            ...props.location,
            search: queryString.stringify(expectedParams),
        })).toBe(true);
    });

    it('componentDidUpdate should set PageLoading false when runs are fetched', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const nextProps = getProps();
        nextProps.runsFetched = true;
        wrapper.setProps(nextProps);
        instance.forceUpdate();
        expect(stateStub.calledWith({pageLoading: false})).toBe(true);
        stateStub.restore();
    });

    it('componentDidUpdate should set loading false when runs are fetched', () => {
        setup({runsFetching: true});
        wrapper.setState({loading: true, pageLoading: false});
        const stateStub = sinon.stub(instance, 'setState');
        const nextProps = getProps();
        nextProps.runsFetching = false;
        wrapper.setProps(nextProps);
        instance.forceUpdate();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({loading: false})).toBe(true);
    });

    it('should show a progress circle when deleting a datapack', () => {
        wrapper.setState({pageLoading: false, loading: false});
        instance.forceUpdate();
        expect(wrapper.find(PageLoading)).toHaveLength(0);
        const nextProps = getProps();
        nextProps.runDeletion.deleting = true;
        wrapper.setProps(nextProps);
        instance.forceUpdate();
        expect(wrapper.find(PageLoading)).toHaveLength(1);
    });

    it('componentDidMount should make data requests and setInterval', () => {
        const requestStub = sinon.stub(DataPackPage.prototype, 'makeRunRequest');
        setup();
        expect(props.getProviders.calledOnce).toBe(true);
        expect(props.getFormats.calledOnce).toBe(true);
        expect(requestStub.calledOnce).toBe(true);
        expect(props.resetGeoJSONFile.calledOnce).toBe(true);
        requestStub.restore();
    });

    it('componentDidUpdate should make run request when query has changed', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const requestStub = sinon.stub(instance, 'makeRunRequest');
        expect(requestStub.called).toBe(false);
        expect(stateStub.called).toBe(false);
        let nextProps = getProps();
        wrapper.setProps(nextProps);
        expect(requestStub.called).toBe(false);
        expect(stateStub.called).toBe(false);
        nextProps = getProps();
        nextProps.location.search = queryString.parse(nextProps.location.search);
        nextProps.location.search.newKey = 'new query thing';
        wrapper.setProps({location: {search: queryString.stringify(nextProps.location.search)}});
        expect(requestStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        nextProps = getProps();
        nextProps.location.search = queryString.parse(nextProps.location.search);
        nextProps.location.search.newKey = 'a changed value';
        wrapper.setProps({location: {search: queryString.stringify(nextProps.location.search)}});
        expect(requestStub.calledTwice).toBe(true);
        expect(stateStub.calledTwice).toBe(true);
    });

    it('componentDidUpdate should update joyride steps', () => {
        const getStub = sinon.stub(instance, 'getJoyRideSteps');
        const addStub = sinon.stub(instance, 'joyrideAddSteps');
        let location = {search: queryString.parse(getProps().location)};
        location.search.view = 'grid';
        wrapper.setProps({location: {search: queryString.stringify(location.search)}});
        expect(getStub.calledOnce).toBe(true);
        expect(addStub.calledOnce).toBe(true);
    });

    it('componentDidUpdate should call updateLocationQuery with default query on page refresh', () => {
        const location = {search: ''};
        const expectedDefault = {
            collection: 'all',
            order: '-job__featured',
            view: 'map',
            page_size: Number(config.DATAPACK_PAGE_SIZE),
            search: null
        };

        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        wrapper.setProps({location});
        expect(updateStub.called).toBe(true);
        expect(updateStub.calledWith(expectedDefault)).toBe(true);
    });

    it('should setOrder and setView if props are different from state', () => {
        setup({
            location: {...props.location, search: queryString.stringify({order: '-job__featured', view: 'list'})},
        });
        wrapper.unmount();
        expect(props.setOrder.calledOnce).toBe(true);
        expect(props.setOrder.calledWith('-job__featured')).toBe(true);
        expect(props.setView.calledOnce).toBe(true);
        expect(props.setView.calledWith('list')).toBe(true);
    });

    it('should handle fetched runs', () => {
        const nextProps = getProps();
        nextProps.runsFetched = true;
        nextProps.runIds = ['2', '1', '3'];
        const stateSpy = sinon.spy(instance, 'setState');
        wrapper.setProps(nextProps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showLoading: false}));
    });

    it('onSearch should call updateLocationQuery with search text', () => {
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.onSearch('test_search', 0);
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({search: 'test_search'})).toBe(true);
    });

    it('getViewRef should set the view instance', () => {
        const inst = {data: 'my instance '};
        instance.getViewRef(inst);
        expect(instance.view).toEqual(inst);
    });

    it('updateLocationQuery should call push with updated query', () => {
        wrapper.setProps({location: {...props.location, search: {}}});
        browserHistory.reset();
        const query = {somekey: 'Some_New_Key'};
        const expected = {"search": queryString.stringify(query)};
        instance.updateLocationQuery(query);
        expect(browserHistory.calledOnce).toBe(true);
        expect(browserHistory.calledWith(expected)).toBe(true);
    });

    it('checkForEmptySearch should call updateLocationQuery with search undefined', () => {
        const location = {search: queryString.stringify({search: 'test_search'})}
        wrapper.setProps({location});
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.checkForEmptySearch('');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({search: undefined})).toBe(true);
    });

    it('if a run has been deleted it should call makeRunRequest again', () => {
        const stateStub = sinon.stub(instance, 'setState').callsFake((state, cb) => {
            cb();
        });
        const makeRequestStub = sinon.stub(instance, 'makeRunRequest');
        const nextProps = getProps();
        nextProps.runDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(stateStub.calledWith({loading: true}, instance.makeRunRequest)).toBe(true);
        expect(makeRequestStub.calledOnce).toBe(true);
    });

    it('handleSortChange should call updateLocationQuery with new order', () => {
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.handleSortChange('job__name');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({order: 'job__name'})).toBe(true);
    });

    it('autoRunRequest should call makeRunRequest with true', () => {
        const stub = sinon.stub(instance, 'makeRunRequest');
        instance.autoRunRequest();
        expect(stub.calledOnce).toBe(true);
        expect(stub.calledWith(true)).toBe(true);
        stub.restore();
    });

    it('makeRunRequest should build a params object and pass it to props.getRuns', () => {
        let location = {search: queryString.parse(getProps().location)};
        location.search.page_size = '12';
        location.search.search = 'search_text';
        location.search.order = '-job__featured';
        location.search.collection = 'test_user';
        wrapper.setProps({location: {search: queryString.stringify(location.search)}});
        const status = {completed: true, incomplete: true};
        const minDate = new Date(2017, 6, 30, 8, 0, 0);
        const maxDate = new Date(2017, 7, 1, 3, 0, 0);
        const collection = 'test_user';
        const search = 'search_text';
        const providers = ['test_provider'];
        const formats = ['test_format'];
        const projections = [4326];
        const geojson = {data: {}};
        const page = 1;
        const permissions = {value: 'SHARED', groups: {}, members: {}};
        const expectedParams = [{
            page_size: 12,
            ordering: '-job__featured',
            ownerFilter: collection,
            status,
            minDate,
            maxDate,
            search,
            providers,
            formats,
            projections,
            geojson,
            page,
            permissions,
            isAuto: false,
        }];
        wrapper.setState({
            status,
            minDate,
            maxDate,
            permissions,
            providers,
            formats,
            projections,
            geojson_geometry: geojson,
            page,
        });
        props.getRuns.resetHistory();
        instance.makeRunRequest();
        expect(props.getRuns.calledOnce).toBe(true);
        expect(props.getRuns.getCall(0).args).toEqual(expectedParams);
    });

    it('makePartialRunRequest should build a params object and pass it to props.getRuns', () => {
        const status = {completed: false, incomplete: false, submitted: false};
        const search = null;
        const formats = {};
        const page = 1;
        const permissions = {value: '', groups: {}, members: {}};
        const expectedParams = [{
            page_size: 12,
            ordering: '-job__featured',
            ownerFilter: "",
            status,
            minDate: null,
            maxDate: null,
            search,
            providers: {},
            formats,
            projections: {},
            geojson: null,
            permissions,
            page,
            isAuto: false,
        }];
        props.getRuns();
        instance.makePartialRunRequest();
        expect(props.getRuns.called).toBe(true);
        expect(props.getRuns.getCall(0).args).toEqual(expectedParams);
    });

    it('handleOwnerFilter call updateLocationQuery', () => {
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.handleOwnerFilter('test_value');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({collection: 'test_value'})).toBe(true);
    });

    it('handleFilterApply should take filter state in and update new state then make runRequest', () => {
        wrapper.setProps({width: 'md'});
        const currentState = {...wrapper.state()};
        const stateSpy = sinon.spy(instance, 'setState');
        const newState = {
            minDate: new Date(),
            maxDate: new Date(),
            status: {
                completed: true,
                submitted: false,
                incomplete: false,
            },
        };
        instance.handleFilterApply(newState);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith(
            {
                ...currentState,
                ...newState,
                loading: true,
            },
            instance.makeRunRequest,
        )).toBe(true);
        expect(stateSpy.calledWith({open: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleFilterClear should setState then re-apply search and sort', () => {
        wrapper.setProps({width: 'lg'});
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleFilterClear();
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({
            permissions: {
                value: '',
                groups: {},
                members: {},
            },
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            minDate: null,
            maxDate: null,
            providers: {},
            formats: {},
            loading: true,
        }, instance.makeRunRequest)).toBe(true);
        expect(stateSpy.calledWith({open: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleSpatialFilter should setstate then call make run request', () => {
        const stateSpy = sinon.spy(instance, 'setState');
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
        instance.handleSpatialFilter(geojson);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith(
            {geojson_geometry: expected, loading: true},
            instance.makeRunRequest,
        )).toBe(true);
        stateSpy.restore();
    });

    it('changeView updateLocationQuery with new order if its not a shared order, otherwise just update with view', () => {
        wrapper.setProps({
            location: {...props.location, query: {...props.location.search, order: 'started_at'}}
        });
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.changeView('list');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({view: 'list'})).toBe(true);

        let location = {search: queryString.parse(getProps().location)};
        location.search.order = 'not_shared_order';
        wrapper.setProps({location: {search: queryString.stringify(location.search)}});
        instance.changeView('map');
        expect(updateStub.calledTwice).toBe(true);
        expect(updateStub.calledWith({view: 'map', order: '-started_at'})).toBe(true);
    });

    it('handleToggle should set state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleToggle();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({open: false}));
        stateSpy.restore();
    });

    it('if nextPage is true, loadMore should trigger makePartialRunRequest to get queried results of next page', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        wrapper.setProps({runsMeta: {...props.runsMeta, nextPage: true}});
        const requestStub = sinon.stub(instance, 'makePartialRunRequest');
        instance.loadNext();
        expect(requestStub.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({page: 2}));
        stateSpy.restore();
    });

    it('if pageSize is greater than 12, loadless should trigger  makePartialRunRequest', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const requestStub = sinon.stub(instance, 'makePartialRunRequest');
        instance.loadPrevious();
        expect(requestStub.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({page: 2}));
    });

    it('getView should return null, list, grid, or map component', () => {
        const commonProps = {
            runIds: props.runIds,
            user: props.user,
            onRunDelete: props.deleteRun,
            onRunShare: props.updateDataCartPermissions,
            range: props.runsMeta.range,
            handleLoadPrevious: instance.loadPrevious,
            handleLoadNext: instance.loadNext,
            loadPreviousDisabled: props.runIds.length <= 12,
            loadNextDisabled: !props.runsMeta.nextPage,
            providers: [],
            openShare: instance.handleShareOpen,
        };
        expect(instance.getView('list')).toEqual((
                <DataPackList
                    {...commonProps}
                    onSort={instance.handleSortChange}
                    order={queryString.parse(props.location.search).order}
                    customRef={instance.getViewRef}
                />
            ),
        );

        expect(instance.getView('grid')).toEqual((
            <DataPackGrid
                {...commonProps}
                name="DataPackLibrary"
                customRef={instance.getViewRef}
            />
        ));

        expect(instance.getView('map')).toEqual((
            <MapView
                {...commonProps}
                importGeom={props.importGeom}
                processGeoJSONFile={props.processGeoJSONFile}
                resetGeoJSONFile={props.resetGeoJSONFile}
                onMapFilter={instance.handleSpatialFilter}
                customRef={instance.getViewRef}
            />
        ));
        expect(instance.getView('bad case')).toEqual(null);
    });

    it('getJoyRideSteps should return correct steps based on view', () => {
        let location = {search: queryString.parse(getProps().location)};
        location.search.view = 'map'
        wrapper.setProps({location: {search: queryString.stringify(location.search)}});
        expect(instance.getJoyRideSteps()).toEqual(joyride.DataPackPage.map);

        location.search.view = 'grid';
        wrapper.setProps({location: {search: queryString.stringify(location.search)}});
        expect(instance.getJoyRideSteps()).toEqual(joyride.DataPackPage.grid);

        location.search.view = 'list';
        wrapper.setProps({location: {search: queryString.stringify(location.search)}});
        expect(instance.getJoyRideSteps()).toEqual(joyride.DataPackPage.list);
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [
            {
                title: 'Create DataPack',
                text: 'Click here to Navigate to Create a DataPack.',
                selector: '.qa-DataPackLinkButton-Button',
                position: 'bottom',
                style: {},
            },
        ];
        const stateSpy = sinon.spy(instance, 'setState');
        instance.joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({steps}));
        stateSpy.restore();
    });

    it('callback function should open drawer if it is closed', () => {
        const callbackData = {
            action: 'next',
            index: 2,
            step: {
                position: 'bottom',
                selector: '.qa-DataPackLinkButton-Button',
                style: {},
                text: 'Click here to Navigate to Create a DataPack.',
                title: 'Filters',
            },
            type: 'step:before',
        };
        const stateSpy = sinon.spy(instance, 'setState');
        wrapper.setState({open: false});
        instance.callback(callbackData);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({open: true}));
        stateSpy.restore();
    });

    it('callback should stop tour if close is clicked', () => {
        const callbackData = {
            action: 'close',
            index: 2,
            step: {
                position: 'bottom',
                selector: '.qa-DataPackLinkButton-Button',
                style: {},
                text: 'Click here to Navigate to Create a DataPack.',
                title: 'Create DataPack',
            },
            type: 'step:before',
        };
        const stateStub = sinon.stub(instance, 'setState');
        instance.joyride = {reset: sinon.spy()};
        instance.callback(callbackData);
        expect(stateStub.calledWith({isRunning: false}));
    });
});
