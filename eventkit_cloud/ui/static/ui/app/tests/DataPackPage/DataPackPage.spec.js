import React from 'react';
import sinon from 'sinon';
import raf from 'raf';
import { browserHistory } from 'react-router';
import { shallow } from 'enzyme';
import Joyride from 'react-joyride';
import Help from '@material-ui/icons/Help';
import Toolbar from '@material-ui/core/Toolbar';
import PageHeader from '../../components/common/PageHeader';
import PageLoading from '../../components/common/PageLoading';
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
import { joyride } from '../../joyride.config';

// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();
jest.mock('../../components/DataPackPage/MapView');

describe('DataPackPage component', () => {
    const testProviders = [
        {
            id: 2,
            model_url: 'http://cloud.eventkit.test/api/providers/osm',
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            preview_url: '',
            service_copyright: '',
            service_description: 'OpenStreetMap vector data.',
            layer: null,
            level_from: 0,
            level_to: 10,
            zip: false,
            display: true,
            export_provider_type: 2,
        },
    ];

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
        user: { data: { user: { username: 'admin' } } },
        getRuns: () => {},
        deleteRun: () => {},
        getProviders: () => {},
        runDeletion: {
            deleting: false,
            deleted: false,
            error: null,
        },
        drawer: 'open',
        providers: testProviders,
        importGeom: {},
        geocode: {},
        getGeocode: () => {},
        processGeoJSONFile: () => {},
        resetGeoJSONFile: () => {},
        setOrder: () => {},
        setView: () => {},
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
        getGroups: () => {},
        getUsers: () => {},
        updateDataCartPermissions: () => {},
        updatePermissions: {
            updating: false,
            updated: false,
            error: null,
        },
        location: {
            query: {
                collection: '',
                page_size: '12',
            },
        },
        ...global.eventkit_test_props,
    });

    const getWrapper = props => (
        shallow(<DataPackPage {...props} />)
    );

    beforeAll(() => {
        sinon.stub(browserHistory, 'push');
    });

    afterAll(() => {
        browserHistory.push.restore();
    });

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
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
        const props = getProps();
        props.location.query = {};
        const expectedDefault = {
            collection: 'all',
            order: '-job__featured',
            view: 'map',
            page_size: '12',
        };
        const updateStub = sinon.stub(DataPackPage.prototype, 'updateLocationQuery');
        getWrapper(props);
        expect(updateStub.called).toBe(true);
        expect(updateStub.calledWith(expectedDefault)).toBe(true);
        updateStub.restore();
    });

    it('DataPackSortDropDown handleChange should call handleSortChange', () => {
        const props = getProps();
        const changeStub = sinon.stub(DataPackPage.prototype, 'handleSortChange');
        const wrapper = getWrapper(props);
        wrapper.find(DataPackSortDropDown).props().handleChange('value');
        expect(changeStub.calledOnce).toBe(true);
        expect(changeStub.calledWith('value')).toBe(true);
        changeStub.restore();
    });

    it('should use order and view from props or just default to map and featured', () => {
        const props = getProps();
        props.runsMeta.order = 'job__featured';
        props.runsMeta.view = 'grid';
        browserHistory.push.reset();
        const wrapper = getWrapper(props);
        expect(browserHistory.push.called).toBe(true);
        expect(browserHistory.push.calledWith({
            ...props.location,
            query: {
                ...props.location.query,
                order: 'job__featured',
                view: 'grid',
            },
        })).toBe(true);
        wrapper.unmount();
        browserHistory.push.reset();
        const nextProps = getProps();
        const nextWrapper = getWrapper(nextProps);
        expect(browserHistory.push.called).toBe(true);
        expect(browserHistory.push.calledWith({
            ...nextProps.location,
            query: {
                ...nextProps.location.query,
                order: '-job__featured',
                view: 'map',
            },
        })).toBe(true);
        nextWrapper.unmount();
    });

    it('componentDidUpdate should set PageLoading false when runs are fetched', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const nextProps = getProps();
        nextProps.runsFetched = true;
        wrapper.setProps(nextProps);
        wrapper.instance().forceUpdate();
        expect(stateStub.calledWith({ pageLoading: false })).toBe(true);
        stateStub.restore();
    });

    it('componentDidUpdate should set loading false when runs are fetched', () => {
        const props = getProps();
        props.runsFetching = true;
        const wrapper = getWrapper(props);
        wrapper.setState({ loading: true, pageLoading: false });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const nextProps = getProps();
        nextProps.runsFetching = false;
        wrapper.setProps(nextProps);
        wrapper.instance().forceUpdate();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ loading: false })).toBe(true);
    });

    it('should show a progress circle when deleting a datapack', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ pageLoading: false, loading: false });
        wrapper.instance().forceUpdate();
        expect(wrapper.find(PageLoading)).toHaveLength(0);
        const nextProps = getProps();
        nextProps.runDeletion.deleting = true;
        wrapper.setProps(nextProps);
        wrapper.instance().forceUpdate();
        expect(wrapper.find(PageLoading)).toHaveLength(1);
    });

    it('componentDidMount should make data requests and setInterval', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        props.getUsers = sinon.spy();
        props.getProviders = sinon.spy();
        props.resetGeoJSONFile = sinon.spy();
        const mountSpy = sinon.spy(DataPackPage.prototype, 'componentDidMount');
        const requestStub = sinon.stub(DataPackPage.prototype, 'makeRunRequest');
        const intervalStub = sinon.stub(global, 'setInterval');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(props.getGroups.calledOnce).toBe(true);
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getProviders.calledOnce).toBe(true);
        expect(requestStub.calledOnce).toBe(true);
        expect(intervalStub.calledWith(wrapper.instance().autoRunRequest, 10000)).toBe(true);
        expect(props.resetGeoJSONFile.calledOnce).toBe(true);
        mountSpy.restore();
        requestStub.restore();
        intervalStub.restore();
    });

    it('componentDidUpdate should make run request when query has changed', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const requestStub = sinon.stub(wrapper.instance(), 'makeRunRequest');
        expect(requestStub.called).toBe(false);
        expect(stateStub.called).toBe(false);
        let nextProps = getProps();
        wrapper.setProps(nextProps);
        expect(requestStub.called).toBe(false);
        expect(stateStub.called).toBe(false);
        nextProps = getProps();
        nextProps.location.query.newKey = 'new query thing';
        wrapper.setProps(nextProps);
        expect(requestStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        nextProps = getProps();
        nextProps.location.query.newKey = 'a changed value';
        wrapper.setProps(nextProps);
        expect(requestStub.calledTwice).toBe(true);
        expect(stateStub.calledTwice).toBe(true);
    });

    it('componentDidUpdate should update joyride steps', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const getStub = sinon.stub(wrapper.instance(), 'getJoyRideSteps');
        const addStub = sinon.stub(wrapper.instance(), 'joyrideAddSteps');
        const nextProps = getProps();
        nextProps.location.query.view = 'grid';
        wrapper.setProps(nextProps);
        expect(getStub.calledOnce).toBe(true);
        expect(addStub.calledOnce).toBe(true);
    });

    it('componentWillUnmount should clear interval', () => {
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
        props.location.query.order = '-job__featured';
        props.location.query.view = 'list';
        props.setOrder = sinon.spy();
        props.setView = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.unmount();
        expect(props.setOrder.calledOnce).toBe(true);
        expect(props.setOrder.calledWith('-job__featured')).toBe(true);
        expect(props.setView.calledOnce).toBe(true);
        expect(props.setView.calledWith('list')).toBe(true);
    });

    it('should run getRuns at intervals', () => {
        jest.useFakeTimers();
        const props = getProps();
        props.getRuns = sinon.spy();
        getWrapper(props);
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
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        expect(clearInterval.mock.calls.length).toEqual(0);
        const { fetch } = wrapper.instance();
        wrapper.unmount();
        expect(clearInterval.mock.calls.length).toEqual(1);
        expect(clearInterval.mock.calls[0][0]).toEqual(fetch);
    });

    it('should handle fetched runs', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const nextProps = getProps();
        nextProps.runsFetched = true;
        nextProps.runIds = ['2', '1', '3'];
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.setProps(nextProps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showLoading: false }));
    });

    it('onSearch should call updateLocationQuery with search text', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const updateStub = sinon.stub(wrapper.instance(), 'updateLocationQuery');
        wrapper.instance().onSearch('test_search', 0);
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ search: 'test_search' })).toBe(true);
    });

    it('getViewRef should set the view instance', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const inst = { data: 'my instance ' };
        wrapper.instance().getViewRef(inst);
        expect(wrapper.instance().view).toEqual(inst);
    });

    it('getCurrentLocation should return the location prop', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.instance().getCurrentLocation()).toEqual(props.location);
    });

    it('updateLocationQuery should call push with updated query', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        browserHistory.push.reset();
        const query = { somekey: 'this is a new query key' };
        const expected = {
            ...props.location,
            query: {
                ...props.location.query,
                ...query,
            },
        };
        wrapper.instance().updateLocationQuery(query);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith(expected)).toBe(true);
    });

    it('checkForEmptySearch should call updateLocationQuery with search undefined', () => {
        const props = getProps();
        props.location.query.search = 'test_search';
        const wrapper = shallow(<DataPackPage {...props} />);
        const updateStub = sinon.stub(wrapper.instance(), 'updateLocationQuery');
        wrapper.instance().checkForEmptySearch('');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ ...props.location.query, search: undefined })).toBe(true);
    });

    it('if a run has been deleted it should call makeRunRequest again', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        const makeRequestSpy = sinon.spy(wrapper.instance(), 'makeRunRequest');
        const nextProps = getProps();
        nextProps.runDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({ loading: true }, wrapper.instance().makeRunRequest)).toBe(true);
        expect(makeRequestSpy.calledOnce).toBe(true);
        makeRequestSpy.restore();
        stateSpy.restore();
    });

    it('handleSortChange should call updateLocationQuery with new order', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const updateStub = sinon.stub(wrapper.instance(), 'updateLocationQuery');
        wrapper.instance().handleSortChange('job__name');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ order: 'job__name' })).toBe(true);
    });

    it('autoRunRequest should call makeRunRequest with true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stub = sinon.stub(wrapper.instance(), 'makeRunRequest');
        wrapper.instance().autoRunRequest();
        expect(stub.calledOnce).toBe(true);
        expect(stub.calledWith(true)).toBe(true);
        stub.restore();
    });

    it('makeRunRequest should build a params object and pass it to props.getRuns', () => {
        const props = getProps();
        props.getRuns = sinon.spy();
        props.location.query.search = 'search_text';
        props.location.query.order = '-job__featured';
        props.location.query.collection = 'test_user';
        const wrapper = shallow(<DataPackPage {...props} />);
        props.getRuns.reset();
        const status = { completed: true, incomplete: true };
        const minDate = new Date(2017, 6, 30, 8, 0, 0);
        const maxDate = new Date(2017, 7, 1, 3, 0, 0);
        const collection = 'test_user';
        const search = 'search_text';
        const providers = ['test_provider'];
        const geojson = { data: {} };
        const permissions = { value: 'SHARED', groups: {}, members: {} };
        const expectedParams = [{
            page_size: 12,
            ordering: '-job__featured',
            ownerFilter: collection,
            status,
            minDate,
            maxDate,
            search,
            providers,
            geojson,
            permissions,
            isAuto: false,
        }];
        wrapper.setState({
            status,
            minDate,
            maxDate,
            permissions,
            providers,
            geojson_geometry: geojson,
        });
        wrapper.instance().forceUpdate();
        wrapper.update();
        wrapper.instance().makeRunRequest();
        expect(props.getRuns.calledOnce).toBe(true);
        expect(props.getRuns.getCall(0).args).toEqual(expectedParams);
    });

    it('handleOwnerFilter call updateLocationQuery', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const updateStub = sinon.stub(wrapper.instance(), 'updateLocationQuery');
        wrapper.instance().handleOwnerFilter('test_value');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ collection: 'test_value' })).toBe(true);
    });

    it('handleFilterApply should take filter state in and update new state then make runRequest', () => {
        const props = getProps();
        props.width = 'md';
        const wrapper = shallow(<DataPackPage {...props} />);
        const currentState = { ...wrapper.state() };
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        const newState = {
            minDate: new Date(),
            maxDate: new Date(),
            status: {
                completed: true,
                submitted: false,
                incomplete: false,
            },
        };
        wrapper.instance().handleFilterApply(newState);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith(
            {
                ...currentState,
                ...newState,
                loading: true,
            },
            wrapper.instance().makeRunRequest,
        )).toBe(true);
        expect(stateSpy.calledWith({ open: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleFilterClear should setState then re-apply search and sort', () => {
        const props = getProps();
        props.width = 'lg';
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().handleFilterClear();
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
            loading: true,
        }, wrapper.instance().makeRunRequest)).toBe(true);
        expect(stateSpy.calledWith({ open: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleSpatialFilter should setstate then call make run request', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
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

    it('changeView updateLocationQuery with new order if its not a shared order, otherwise just update with view', () => {
        const props = getProps();
        props.location.query.order = 'started_at';
        const wrapper = shallow(<DataPackPage {...props} />);
        const updateStub = sinon.stub(wrapper.instance(), 'updateLocationQuery');
        wrapper.instance().changeView('list');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ view: 'list' })).toBe(true);

        const nextProps = getProps();
        nextProps.location.query.order = 'not_shared_order';
        wrapper.setProps(nextProps);
        wrapper.instance().changeView('map');
        expect(updateStub.calledTwice).toBe(true);
        expect(updateStub.calledWith({ view: 'map', order: '-started_at' })).toBe(true);
    });

    it('handleToggle should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().handleToggle();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: false }));
        stateSpy.restore();
    });

    it('if nextPage is true, loadMore should increase page size query', () => {
        const props = getProps();
        props.runsMeta.nextPage = true;
        const wrapper = shallow(<DataPackPage {...props} />);
        const updateStub = sinon.stub(wrapper.instance(), 'updateLocationQuery');
        wrapper.instance().loadMore();
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ page_size: 24 })).toBe(true);
    });

    it('if pageSize is greater than 12  is should decrease pageSize and makeRunRequest', () => {
        const props = getProps();
        props.location.query.page_size = '24';
        const wrapper = shallow(<DataPackPage {...props} />);
        const updateStub = sinon.stub(wrapper.instance(), 'updateLocationQuery');
        wrapper.instance().loadLess();
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ page_size: 12 })).toBe(true);
    });

    it('getView should return null, list, grid, or map component', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);

        const commonProps = {
            runIds: props.runIds,
            user: props.user,
            onRunDelete: props.deleteRun,
            onRunShare: props.updateDataCartPermissions,
            range: props.runsMeta.range,
            handleLoadLess: wrapper.instance().loadLess,
            handleLoadMore: wrapper.instance().loadMore,
            loadLessDisabled: props.runIds.length <= 12,
            loadMoreDisabled: !props.runsMeta.nextPage,
            providers: testProviders,
            openShare: wrapper.instance().handleShareOpen,
            users: props.users,
            groups: props.groups,
        };

        expect(wrapper.instance().getView('list')).toEqual(
            (<DataPackList
                {...commonProps}
                onSort={wrapper.instance().handleSortChange}
                order={wrapper.state().order}
                customRef={wrapper.instance().getViewRef}
            />),
            sinon.match({ ref: commonProps.ref }),
        );

        expect(wrapper.instance().getView('grid')).toEqual((
            <DataPackGrid
                {...commonProps}
                name="DataPackLibrary"
                customRef={wrapper.instance().getViewRef}
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
                customRef={wrapper.instance().getViewRef}
            />
        ));
        expect(wrapper.instance().getView('bad case')).toEqual(null);
    });

    it('getJoyRideSteps should return correct steps based on view', () => {
        const props = getProps();
        props.location.query.view = 'map';
        const wrapper = shallow(<DataPackPage {...props} />);
        expect(wrapper.instance().getJoyRideSteps()).toEqual(joyride.DataPackPage.map);
        props.location.query.view = 'grid';
        expect(wrapper.instance().getJoyRideSteps()).toEqual(joyride.DataPackPage.grid);
        props.location.query.view = 'list';
        expect(wrapper.instance().getJoyRideSteps()).toEqual(joyride.DataPackPage.list);
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
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ steps }));
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
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.setState({ open: false });
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: true }));
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
        const props = getProps();
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().joyride = { reset: sinon.spy() };
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });
});

