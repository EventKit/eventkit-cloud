import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {DataPackPage} from '../../components/DataPackPage/DataPackPage';
import AppBar from 'material-ui/AppBar';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import CircularProgress from 'material-ui/CircularProgress';
import Drawer from 'material-ui/Drawer';
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
import CustomScrollbar from '../../components/CustomScrollbar';
import isEqual from 'lodash/isEqual';
import * as utils from '../../utils/mapUtils';
import ol from 'openlayers';

// this polyfills requestAnimationFrame in the test browser, required for ol3
import raf from 'raf';
raf.polyfill();
jest.mock('../../components/DataPackPage/MapView')

describe('DataPackPage component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            runsList: {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '12/24'
            },
            user: {data: {user: {username: 'admin'}}},
            getRuns: () => {},
            deleteRuns: () => {},
            runsDeletion: {
                deleting: false,
                deleted: false,
                error: null
            },
            drawerOpen: true,
            importGeom: {},
            geocode: {},
            getGeocode: () => {},
            processGeoJSONFile: () => {},
            resetGeoJSONFile: () => {},
        }
    };

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = mount(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(AppBar).hasClass('sectionTitle')).toBe(true);
        expect(wrapper.find(AppBar).find('h1').text()).toEqual('DataPack Library');
        expect(wrapper.find(DataPackLinkButton)).toHaveLength(1);
        expect(wrapper.find(Toolbar)).toHaveLength(2);
        expect(wrapper.find(ToolbarGroup)).toHaveLength(1);
        expect(wrapper.find(DataPackSearchbar)).toHaveLength(1);
        expect(wrapper.find(DataPackOwnerSort)).toHaveLength(1);
        expect(wrapper.find(DataPackFilterButton)).toHaveLength(1);
        expect(wrapper.find(DataPackSortDropDown)).toHaveLength(1);
        expect(wrapper.find(DataPackViewButtons)).toHaveLength(1);
        expect(wrapper.find(FilterDrawer)).toHaveLength(1);
        // Should show loading before datapacks have been fetched
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        expect(wrapper.find(DataPackGrid)).toHaveLength(0);
        expect(wrapper.find(DataPackList)).toHaveLength(0);
    });

    it('should show MapView instead of progress circle when runs are received', () => {
        const props = getProps();
        const wrapper = mount(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        expect(wrapper.find(DataPackGrid)).toHaveLength(0);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        let nextProps = getProps();
        nextProps.runsList.fetched = true;
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({pageLoading: false})).toBe(true);
        expect(wrapper.find(MapView)).toHaveLength(1);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);;
        stateSpy.restore();
    });

    it('should show a progress circle when deleting a datapack', () => {
        const props = getProps();
        const wrapper = mount(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        let nextProps = getProps();
        nextProps.runsList.fetched = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        nextProps.runsDeletion.deleting = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('should call makeRunRequest, add eventlistener, and setInterval when mounting', () => {
        const props = getProps();
        const mountSpy = new sinon.spy(DataPackPage.prototype, 'componentDidMount');
        const requestSpy = new sinon.spy(DataPackPage.prototype, 'makeRunRequest');
        const eventSpy = new sinon.spy(window, 'addEventListener');
        const intervalSpy = new sinon.spy(global, 'setInterval');
        const wrapper = mount(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(mountSpy.calledOnce).toBe(true);
        expect(requestSpy.calledOnce).toBe(true);
        expect(eventSpy.calledWith('resize', wrapper.instance().screenSizeUpdate)).toBe(true);
        expect(intervalSpy.calledWith(wrapper.instance().makeRunRequest, 10000)).toBe(true);
        mountSpy.restore();
        requestSpy.restore();
        eventSpy.restore();
        intervalSpy.restore();
    });

    it('remove eventlister on unmount', () => {
        const props = getProps();
        const mountSpy = new sinon.spy(DataPackPage.prototype, 'componentWillUnmount');
        const removeSpy = new sinon.spy(window, 'removeEventListener');
        const intervalSpy = new sinon.spy(global, 'clearInterval');
        const wrapper = mount(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const update = wrapper.instance().screenSizeUpdate;
        const fetch = wrapper.instance().fetch;
        wrapper.unmount();
        expect(mountSpy.calledOnce).toBe(true);
        expect(removeSpy.calledWith('resize', update)).toBe(true);
        expect(intervalSpy.calledWith(fetch)).toBe(true);
        mountSpy.restore();
        removeSpy.restore();
        intervalSpy.restore();
    });

    it('should run getRuns at intervals', () => {
        jest.useFakeTimers();
        let props = getProps();
        props.getRuns = new sinon.spy();
        const wrapper = mount(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
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
        const propsSpy = new sinon.spy(DataPackPage.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
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
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().onSearch('test_search', 0);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({search: 'test_search', loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('checkForEmptySearch should update state and call makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().checkForEmptySearch('', [], {});
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({search: '', loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('if a run has been deleted it should call makeRunRequest again', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const makeRequestSpy = new sinon.spy(DataPackPage.prototype, 'makeRunRequest');
        const wrapper = mount(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
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
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleSortChange('job__name');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({order: 'job__name', loading: true}, wrapper.instance().makeRunRequest))
        stateSpy.restore();
    });

    it('makeRunRequest should build a params string and pass it to props.getRuns', () => {
        /// Add things here ///
        let props = getProps();
        props.getRuns = new sinon.spy();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const status = {completed: true, incomplete: true};
        const minDate = new Date(2017, 6, 30, 8,0,0);
        const maxDate = new Date(2017, 7, 1, 3, 0, 0);
        const owner = 'test_user';
        const published = 'True';
        const search = 'search_text'
        const expectedString = 'page_size=12'
            +'&ordering=-started_at'
            +'&user=test_user'
            +'&published=True'
            +'&status=COMPLETED,INCOMPLETE'
            +'&min_date=2017-07-30'
            +'&max_date=2017-08-02'
            +'&search_term=search_text';
        wrapper.setState({
            status: status, 
            minDate: minDate,
            maxDate: maxDate,
            ownerFilter: owner,
            published: published,
            search: search
        });
        wrapper.instance().makeRunRequest();
        expect(props.getRuns.calledOnce).toBe(true);
        expect(props.getRuns.calledWith(expectedString, null)).toBe(true);
    });

    it('handleOwnerFilter should set state and call makeRunRequest', () => {
        const props = getProps();
        const event = {persist: () => {}};
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleOwnerFilter(event, 0, 'test_value');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ownerFilter: 'test_value', loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });
    
    it('handleFilterApply should take filter state in and update new state then make runRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const currentState = {...wrapper.state()};
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
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
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
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
            loading: true,
        }, wrapper.instance().makeRunRequest)).toBe(true);
        expect(stateSpy.calledWith({open: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleSpatialFilter should setstate then call make run request', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const geojson = {
            "type": "LineString",
            "coordinates": [
                [69.60937499999999, 60.23981116999893],
                [46.40625, 55.178867663281984],
                [26.3671875, 55.97379820507658]
            ]
        }
        wrapper.instance().handleSpatialFilter(geojson);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith(
            {geojson_geometry: geojson, loading: true}, 
            wrapper.instance().makeRunRequest
        )).toBe(true);
        stateSpy.restore();
    })

    it('screenSizeUpdate should force the component to update', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const updateSpy = new sinon.spy(DataPackPage.prototype, 'forceUpdate');
        wrapper.instance().screenSizeUpdate();
        expect(updateSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });

    it('changeView should makeRunRequest if its not a shared order, otherwise just set view state', () => {
        let props = getProps();
        const promise = {then: (func) => {func()}};
        props.getRuns = (params) => {return promise};
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().changeView('list');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({view: 'list'})).toBe(true);
        wrapper.setState({order: 'some_other_order'});
        wrapper.instance().changeView('map');
        expect(stateSpy.callCount).toEqual(4);
        expect(stateSpy.calledWith({order: 'some_other_order', loading: true}, Function));
        expect(stateSpy.calledWith({view: 'map'})).toBe(true);
        stateSpy.restore();
    });

    it('handleToggle should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleToggle();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({open: false}));
        stateSpy.restore();
    });

    it('if nextPage is true, loadMore should increase page size and makeRunRequest', () => {
        let props = getProps();
        props.runsList.nextPage = true;
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().loadMore();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({pageSize: 24, loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('if pageSize is greater than 12  is should decrease pageSize and makeRunRequest', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        wrapper.setState({pageSize: 24});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().loadLess();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({pageSize: 12, loading: true}, wrapper.instance().makeRunRequest)).toBe(true);
        stateSpy.restore();
    });

    it('getView should return null, list, grid, or map component', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        expect(wrapper.instance().getView('list')).toEqual(
            <DataPackList
                runs={props.runsList.runs}
                user={props.user}
                onRunDelete={props.deleteRuns}
                onSort={wrapper.instance().handleSortChange}
                order={wrapper.state().order}
                range={props.runsList.range}
                handleLoadLess={wrapper.instance().loadLess}
                handleLoadMore={wrapper.instance().loadMore}
                loadLessDisabled={props.runsList.runs.length <= 12}
                loadMoreDisabled={!props.runsList.nextPage}
            />
        );
        expect(wrapper.instance().getView('grid')).toEqual(
            <DataPackGrid
                runs={props.runsList.runs}
                user={props.user}
                onRunDelete={props.deleteRuns}
                range={props.runsList.range}
                handleLoadLess={wrapper.instance().loadLess}
                handleLoadMore={wrapper.instance().loadMore}
                loadLessDisabled={props.runsList.runs.length <= 12}
                loadMoreDisabled={!props.runsList.nextPage}
            />
        );
        expect(wrapper.instance().getView('map')).toEqual(
            <MapView
                runs={props.runsList.runs}
                user={props.user}
                onRunDelete={props.deleteRuns}
                range={props.runsList.range}
                handleLoadLess={wrapper.instance().loadLess}
                handleLoadMore={wrapper.instance().loadMore}
                loadLessDisabled={props.runsList.runs.length <= 12}
                loadMoreDisabled={!props.runsList.nextPage}
                geocode={props.geocode}
                getGeocode={props.getGeocode}
                importGeom={props.importGeom}
                processGeoJSONFile={props.processGeoJSONFile}
                resetGeoJSONFile={props.resetGeoJSONFile}
                onMapFilter={wrapper.instance().handleSpatialFilter}
            />
        );
        expect(wrapper.instance().getView('bad case')).toEqual(null);
    });
});

