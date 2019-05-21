import * as React from 'react';
import * as sinon from 'sinon';
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
        user: { data: { user: { username: 'admin' } } },
        getRuns: sinon.spy(),
        deleteRun: sinon.spy(),
        getProviders: sinon.spy(),
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
            query: {
                collection: '',
                page_size: '12',
            },
        },
        ...(global as any).eventkit_test_props,
    });

    const config = { DATAPACK_PAGE_SIZE: '12' };

    let props;
    let wrapper;
    let instance;

    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataPackPage {...props} />, {
            context: { config },
        });
        instance = wrapper.instance();
    };

    let history;
    beforeAll(() => {
        history = sinon.stub(browserHistory, 'push');
    });

    afterAll(() => {
        history.restore();
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
        const location = { ...props.location, query: {} };
        const expectedDefault = {
            collection: 'all',
            order: '-job__featured',
            view: 'map',
            page_size: Number(config.DATAPACK_PAGE_SIZE),
        };
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        wrapper.setProps({ location });
        instance.componentWillMount();
        expect(updateStub.called).toBe(true);
        expect(updateStub.calledWith(expectedDefault)).toBe(true);
    });

    // it('DataPackSortDropDown handleChange should call handleSortChange', () => {
    //     const changeStub = sinon.stub(instance, 'handleSortChange');
    //     wrapper.find(DataPackSortDropDown).props().handleChange('value');
    //     expect(changeStub.calledOnce).toBe(true);
    //     expect(changeStub.calledWith('value')).toBe(true);
    // });

    it('should use order and view from props or just default to map and featured', () => {
        history.reset();
        const order = 'job__featured';
        const view = 'grid';
        setup({ runsMeta: { ...props.runsMeta, order, view }});
        expect(history.called).toBe(true);
        expect(history.calledWith({
            ...props.location,
            query: {
                ...props.location.query,
                order: 'job__featured',
                view: 'grid',
            },
        })).toBe(true);
        history.reset();
        setup();
        expect(history.called).toBe(true);
        expect(history.calledWith({
            ...props.location,
            query: {
                ...props.location.query,
                order: '-job__featured',
                view: 'map',
            },
        })).toBe(true);
    });

    it('componentDidUpdate should set PageLoading false when runs are fetched', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const nextProps = getProps();
        nextProps.runsFetched = true;
        wrapper.setProps(nextProps);
        instance.forceUpdate();
        expect(stateStub.calledWith({ pageLoading: false })).toBe(true);
        stateStub.restore();
    });

    it('componentDidUpdate should set loading false when runs are fetched', () => {
        setup({ runsFetching: true });
        wrapper.setState({ loading: true, pageLoading: false });
        const stateStub = sinon.stub(instance, 'setState');
        const nextProps = getProps();
        nextProps.runsFetching = false;
        wrapper.setProps(nextProps);
        instance.forceUpdate();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ loading: false })).toBe(true);
    });

    it('should show a progress circle when deleting a datapack', () => {
        wrapper.setState({ pageLoading: false, loading: false });
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
        const intervalStub = sinon.stub(window, 'setInterval');
        setup();
        expect(props.getProviders.calledOnce).toBe(true);
        expect(requestStub.calledOnce).toBe(true);
        expect(intervalStub.calledWith(instance.autoRunRequest, 10000)).toBe(true);
        expect(props.resetGeoJSONFile.calledOnce).toBe(true);
        requestStub.restore();
        intervalStub.restore();
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
        const getStub = sinon.stub(instance, 'getJoyRideSteps');
        const addStub = sinon.stub(instance, 'joyrideAddSteps');
        const nextProps = getProps();
        nextProps.location.query.view = 'grid';
        wrapper.setProps(nextProps);
        expect(getStub.calledOnce).toBe(true);
        expect(addStub.calledOnce).toBe(true);
    });

    it('componentWillUnmount should clear interval', () => {
        const intervalSpy = sinon.spy(global, 'clearInterval');
        const { fetch } = instance;
        wrapper.unmount();
        expect(intervalSpy.calledWith(fetch)).toBe(true);
        intervalSpy.restore();
    });

    it('should setOrder and setView if props are different from state', () => {
        setup({
            location: { ...props.location, query: { order: '-job__featured', view: 'list' } },
        });
        wrapper.unmount();
        expect(props.setOrder.calledOnce).toBe(true);
        expect(props.setOrder.calledWith('-job__featured')).toBe(true);
        expect(props.setView.calledOnce).toBe(true);
        expect(props.setView.calledWith('list')).toBe(true);
    });

    // it('should run getRuns at intervals', () => {
    //     jest.useFakeTimers();
    //     expect(props.getRuns.calledOnce).toBe(true);
    //     // expect(setInterval.mock.calls.length).toEqual(1);
    //     // expect(setInterval.mock.calls[0][1]).toEqual(10000);
    //     jest.runOnlyPendingTimers();
    //     expect(props.getRuns.calledTwice).toBe(true);
    //     jest.runOnlyPendingTimers();
    //     expect(props.getRuns.calledThrice).toBe(true);
    // });

    it('should remove the fetch interval on unmount', () => {
        // jest.useFakeTimers();
        const clearStub = sinon.stub(window, 'clearInterval');
        // expect(clearInterval.mock.calls.length).toEqual(0);
        const { fetch } = instance;
        wrapper.unmount();
        expect(clearStub.calledOnce).toBe(true);
        expect(clearStub.calledWith(fetch)).toBe(true);
        // expect(clearInterval.mock.calls.length).toEqual(1);
        // expect(clearInterval.mock.calls[0][0]).toEqual(fetch);
    });

    it('should handle fetched runs', () => {
        const nextProps = getProps();
        nextProps.runsFetched = true;
        nextProps.runIds = ['2', '1', '3'];
        const stateSpy = sinon.spy(instance, 'setState');
        wrapper.setProps(nextProps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showLoading: false }));
    });

    it('onSearch should call updateLocationQuery with search text', () => {
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.onSearch('test_search', 0);
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ search: 'test_search' })).toBe(true);
    });

    it('getViewRef should set the view instance', () => {
        const inst = { data: 'my instance ' };
        instance.getViewRef(inst);
        expect(instance.view).toEqual(inst);
    });

    it('getCurrentLocation should return the location prop', () => {
        expect(instance.getCurrentLocation()).toEqual(props.location);
    });

    it('updateLocationQuery should call push with updated query', () => {
        history.reset();
        const query = { somekey: 'this is a new query key' };
        const expected = {
            ...props.location,
            query: {
                ...props.location.query,
                ...query,
            },
        };
        instance.updateLocationQuery(query);
        expect(history.calledOnce).toBe(true);
        expect(history.calledWith(expected)).toBe(true);
    });

    it('checkForEmptySearch should call updateLocationQuery with search undefined', () => {
        const location = {
            ...props.location,
            query: { ...props.location.query, search: 'test_search' },
        };
        wrapper.setProps({ location });
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.checkForEmptySearch('');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ ...props.location.query, search: undefined })).toBe(true);
    });

    it('if a run has been deleted it should call makeRunRequest again', () => {
        const stateStub = sinon.stub(instance, 'setState').callsFake((state, cb) => { cb(); });
        const makeRequestStub = sinon.stub(instance, 'makeRunRequest');
        const nextProps = getProps();
        nextProps.runDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(stateStub.calledWith({ loading: true }, instance.makeRunRequest)).toBe(true);
        expect(makeRequestStub.calledOnce).toBe(true);
    });

    it('handleSortChange should call updateLocationQuery with new order', () => {
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.handleSortChange('job__name');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ order: 'job__name' })).toBe(true);
    });

    it('autoRunRequest should call makeRunRequest with true', () => {
        const stub = sinon.stub(instance, 'makeRunRequest');
        instance.autoRunRequest();
        expect(stub.calledOnce).toBe(true);
        expect(stub.calledWith(true)).toBe(true);
        stub.restore();
    });

    it('makeRunRequest should build a params object and pass it to props.getRuns', () => {
        const p = getProps();
        p.location.query.search = 'search_text';
        p.location.query.order = '-job__featured';
        p.location.query.collection = 'test_user';
        wrapper.setProps(p);
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
        p.getRuns.reset();
        // instance.forceUpdate();
        // wrapper.update();
        instance.makeRunRequest();
        expect(p.getRuns.calledOnce).toBe(true);
        expect(p.getRuns.getCall(0).args).toEqual(expectedParams);
    });

    it('handleOwnerFilter call updateLocationQuery', () => {
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.handleOwnerFilter('test_value');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ collection: 'test_value' })).toBe(true);
    });

    it('handleFilterApply should take filter state in and update new state then make runRequest', () => {
        wrapper.setProps({ width: 'md' });
        const currentState = { ...wrapper.state() };
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
        expect(stateSpy.calledWith({ open: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleFilterClear should setState then re-apply search and sort', () => {
        wrapper.setProps({ width: 'lg' });
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
            loading: true,
        }, instance.makeRunRequest)).toBe(true);
        expect(stateSpy.calledWith({ open: false })).toBe(true);
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
            { geojson_geometry: expected, loading: true },
            instance.makeRunRequest,
        )).toBe(true);
        stateSpy.restore();
    });

    it('changeView updateLocationQuery with new order if its not a shared order, otherwise just update with view', () => {
        wrapper.setProps({
            location: { ...props.location, query: { ...props.location.query, order: 'started_at' } }
        });
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.changeView('list');
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ view: 'list' })).toBe(true);

        const nextProps = getProps();
        nextProps.location.query.order = 'not_shared_order';
        wrapper.setProps(nextProps);
        instance.changeView('map');
        expect(updateStub.calledTwice).toBe(true);
        expect(updateStub.calledWith({ view: 'map', order: '-started_at' })).toBe(true);
    });

    it('handleToggle should set state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleToggle();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: false }));
        stateSpy.restore();
    });

    it('if nextPage is true, loadMore should increase page size query', () => {
        wrapper.setProps({ runsMeta: { ...props.runsMeta, nextPage: true }});
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.loadMore();
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ page_size: 24 })).toBe(true);
    });

    it('if pageSize is greater than 12  is should decrease pageSize and makeRunRequest', () => {
        const location = { ...props.location, query: { ...props.location.query, page_size: '24' } };
        wrapper.setProps({ location });
        const updateStub = sinon.stub(instance, 'updateLocationQuery');
        instance.loadLess();
        expect(updateStub.calledOnce).toBe(true);
        expect(updateStub.calledWith({ page_size: 12 })).toBe(true);
    });

    it('getView should return null, list, grid, or map component', () => {
        const commonProps = {
            runIds: props.runIds,
            user: props.user,
            onRunDelete: props.deleteRun,
            onRunShare: props.updateDataCartPermissions,
            range: props.runsMeta.range,
            handleLoadLess: instance.loadLess,
            handleLoadMore: instance.loadMore,
            loadLessDisabled: props.runIds.length <= 12,
            loadMoreDisabled: !props.runsMeta.nextPage,
            providers: [],
            openShare: instance.handleShareOpen,
        };

        expect(instance.getView('list')).toEqual((
            <DataPackList
                {...commonProps}
                onSort={instance.handleSortChange}
                order={wrapper.state().order}
                customRef={instance.getViewRef}
            />
        ),
            // sinon.match({ ref: commonProps.ref }),
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
                geocode={props.geocode}
                getGeocode={props.getGeocode}
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
        // const location = { ...getP.location, query: { ...props.location.query, view: 'map' } };
        let { location } = getProps();
        location.query.view = 'map';
        wrapper.setProps({ location });
        expect(instance.getJoyRideSteps()).toEqual(joyride.DataPackPage.map);

        location = getProps().location;
        location.query.view = 'grid';
        wrapper.setProps({ location });
        expect(instance.getJoyRideSteps()).toEqual(joyride.DataPackPage.grid);

        location = getProps().location;
        location.query.view = 'list';
        wrapper.setProps({ location });
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
        const stateSpy = sinon.spy(instance, 'setState');
        wrapper.setState({ open: false });
        instance.callback(callbackData);
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
        const stateStub = sinon.stub(instance, 'setState');
        instance.joyride = { reset: sinon.spy() };
        instance.callback(callbackData);
        expect(stateStub.calledWith({ isRunning: false }));
    });
});
