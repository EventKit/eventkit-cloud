import React from 'react';
import sinon from 'sinon';
import PropTypes from 'prop-types';
import raf from 'raf';
import { mount, shallow } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Joyride from 'react-joyride';
import Help from 'material-ui/svg-icons/action/help';
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
import { joyride } from '../../joyride.config';
import { DataPackShareDialog } from '../../components/DataPackShareDialog/DataPackShareDialog';

// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();
jest.mock('../../components/DataPackPage/MapView');

describe('DataPackPage component', () => {
    const muiTheme = getMuiTheme();
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
            },
        },
    });

    const getWrapper = props => (
        mount(<DataPackPage {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
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

    it('should show the DataPackShareDialog  and give it the correct run', () => {
        const runs = [
            { job: { uid: '123', permissions: { value: 'PRIVATE', groups: {}, members: {} } } },
            { job: { uid: '456', permissions: { value: 'PRIVATE', groups: {}, members: {} } } },
        ];
        const props = getProps();
        props.runsList.runs = runs;
        const wrapper = getWrapper(props);
        const run = {
            job: {
                uid: '12345',
                permissions: {
                    value: 'PRIVATE',
                    groups: {},
                    members: {},
                },
            },
        };
        wrapper.setState({ shareOpen: true, targetRun: run });
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(1);
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
        nextProps.runsList.fetched = true;
        nextProps.runsList.runs = [{
            user: 'admin2',
            uid: '2',
        }, {
            user: 'admin',
            uid: '1',
        }, {
            user: 'admin3',
            uid: '3',
        }];
        const propsSpy = sinon.spy(DataPackPage.prototype, 'componentWillReceiveProps');
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showLoading: false }));
        DataPackPage.prototype.setState.restore();
        DataPackPage.prototype.componentWillReceiveProps.restore();
    });

    it('onSearch should update the state and call makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().onSearch('test_search', 0);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith(
            { search: 'test_search', loading: true },
            wrapper.instance().makeRunRequest,
        )).toBe(true);
        stateSpy.restore();
    });

    it('checkForEmptySearch should update state and call makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        wrapper.setState({ search: 'some search term' });
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().checkForEmptySearch('');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ search: '', loading: true }, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('if a run has been deleted it should call makeRunRequest again', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        const makeRequestSpy = sinon.spy(DataPackPage.prototype, 'makeRunRequest');
        const wrapper = getWrapper(props);
        expect(makeRequestSpy.calledOnce).toBe(true);
        const nextProps = getProps();
        nextProps.runsDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({ loading: true }, wrapper.instance().makeRunRequest)).toBe(true);
        expect(makeRequestSpy.calledTwice).toBe(true);
        makeRequestSpy.restore();
        stateSpy.restore();
    });

    it('handleSortChange should set state and call makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleSortChange('job__name');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ order: 'job__name', loading: true }, wrapper.instance().makeRunRequest));
        stateSpy.restore();
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
        props.getRuns = sinon.spy((ps) => { console.log(ps); });
        const wrapper = shallow(<DataPackPage {...props} />);
        const status = { completed: true, incomplete: true };
        const minDate = new Date(2017, 6, 30, 8, 0, 0);
        const maxDate = new Date(2017, 7, 1, 3, 0, 0);
        const ownerFilter = 'test_user';
        const search = 'search_text';
        const providers = ['test_provider'];
        const geojson = { data: {} };
        const permissions = { value: 'SHARED', groups: {}, members: {} };
        const expectedParams = [{
            pageSize: 12,
            ordering: '-job__featured',
            ownerFilter,
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
            ownerFilter,
            permissions,
            search,
            providers,
            geojson_geometry: geojson,
        });
        wrapper.update();
        wrapper.instance().makeRunRequest();
        expect(props.getRuns.called).toBe(true);
        expect(props.getRuns.getCall(0).args).toEqual(expectedParams);
    });

    it('handleOwnerFilter should set state and call makeRunRequest', () => {
        const props = getProps();
        const event = { persist: () => {} };
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleOwnerFilter(event, 0, 'test_value');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith(
            { ownerFilter: 'test_value', loading: true },
            wrapper.instance().makeRunRequest,
        )).toBe(true);
        stateSpy.restore();
    });

    it('handleFilterApply should take filter state in and update new state then make runRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const currentState = { ...wrapper.state() };
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        const newState = {
            minDate: new Date(),
            maxDate: new Date(),
            status: {
                completed: true,
                submitted: false,
                incomplete: false,
            },
        };
        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
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
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
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
        const props = getProps();
        const promise = { then: (func) => { func(); } };
        props.getRuns = () => (promise);
        const wrapper = shallow(<DataPackPage {...props} />);
        const joyrideSpy = sinon.spy(DataPackPage.prototype, 'getJoyRideSteps');
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().changeView('list');
        expect(wrapper.update().state().view).toBe('list');
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({ view: 'list' })).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        wrapper.setState({ order: 'some_other_order' });
        wrapper.instance().changeView('map');
        expect(stateSpy.callCount).toEqual(5);
        expect(stateSpy.calledWith({ order: 'some_other_order', loading: true }, Function));
        expect(stateSpy.calledWith({ view: 'map' })).toBe(true);
        stateSpy.restore();
        joyrideSpy.restore();
    });

    it('handleToggle should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleToggle();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: false }));
        stateSpy.restore();
    });

    it('if nextPage is true, loadMore should increase page size and makeRunRequest', () => {
        const props = getProps();
        props.runsList.nextPage = true;
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().loadMore();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ pageSize: 24, loading: true }, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('if pageSize is greater than 12  is should decrease pageSize and makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        wrapper.setState({ pageSize: 24 });
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().loadLess();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ pageSize: 12, loading: true }, wrapper.instance().makeRunRequest)).toBe(true);
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
            providers: testProviders,
            openShare: wrapper.instance().handleShareOpen,
            groups: props.groups,
            ref: wrapper.instance().getViewRef,
        };

        expect(wrapper.instance().getView('list')).toEqual(
            (<DataPackList
                {...commonProps}
                onSort={wrapper.instance().handleSortChange}
                order={wrapper.state().order}
            />),
            sinon.match({ ref: commonProps.ref }),
        );

        expect(wrapper.instance().getView('grid')).toEqual((
            <DataPackGrid
                {...commonProps}
                name="DataPackLibrary"
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

    it('handleShareOpen should set open true and the target job uid', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const run = { job: { uid: '12345' } };
        wrapper.instance().handleShareOpen(run);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ shareOpen: true, targetRun: run })).toBe(true);
        stateStub.restore();
    });

    it('handleShareClose should set open false and clear the target job uid', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleShareClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ shareOpen: false, targetRun: null })).toBe(true);
        stateStub.restore();
    });

    it('handleShareSave should call shareClose and update permissions', () => {
        const props = getProps();
        props.updateDataCartPermissions = sinon.spy();
        const wrapper = getWrapper(props);
        const target = { job: { uid: '123' } };
        const permissions = { value: 'PRIVATE', groups: {}, members: {} };
        const closeStub = sinon.stub(wrapper.instance(), 'handleShareClose');
        wrapper.setState({ targetRun: target });
        wrapper.instance().handleShareSave(permissions);
        expect(closeStub.calledOnce).toBe(true);
        expect(props.updateDataCartPermissions.calledOnce).toBe(true);
        expect(props.updateDataCartPermissions.calledWith(target.job.uid, permissions)).toBe(true);
        closeStub.restore();
    });

    it('getJoyRideSteps should return correct steps based on view', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        wrapper.setState({ view: 'map' });
        expect(wrapper.instance().getJoyRideSteps()).toEqual(joyride.DataPackPage.map);
        wrapper.setState({ view: 'grid' });
        expect(wrapper.instance().getJoyRideSteps()).toEqual(joyride.DataPackPage.grid);
        wrapper.setState({ view: 'list' });
        expect(wrapper.instance().getJoyRideSteps()).toEqual(joyride.DataPackPage.list);
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [
            {
                title: 'Create DataPack',
                text: 'Click here to Navigate to Create a DataPack.',
                selector: '.qa-DataPackLinkButton-RaisedButton',
                position: 'bottom',
                style: {},
            },
        ];
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
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
                selector: '.qa-DataPackLinkButton-RaisedButton',
                style: {},
                text: 'Click here to Navigate to Create a DataPack.',
                title: 'Filters',
            },
            type: 'step:before',
        };
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props} />);
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.setState({ open: false });
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({ open: true }));
        stateSpy.restore();
    });

    it('callback should stop tour if close is clicked', () => {
        const callbackData = {
            action: 'close',
            index: 2,
            step: {
                position: 'bottom',
                selector: '.qa-DataPackLinkButton-RaisedButton',
                style: {},
                text: 'Click here to Navigate to Create a DataPack.',
                title: 'Create DataPack',
            },
            type: 'step:before',
        };
        const props = getProps();
        const stateSpy = sinon.spy(DataPackPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('should set ownerFilter to the current user if passed "myDataPacks" as the collection in the querystring', () => {
        const props = {
            ...getProps(),
            location: {
                query: {
                    collection: 'myDataPacks',
                },
            },
        };
        const wrapper = getWrapper(props);
        expect(wrapper.state().ownerFilter).toEqual(props.user.data.user.username);
    });
});

