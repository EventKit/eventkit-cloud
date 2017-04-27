import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {DataPackPage} from '../../components/DataPackPage/DataPackPage';
import AppBar from 'material-ui/AppBar';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import Drawer from 'material-ui/Drawer';
import PermissionFilter from '../../components/DataPackPage/PermissionsFilter';
import StatusFilter from '../../components/DataPackPage/StatusFilter';
import DateFilter from '../../components/DataPackPage/DateFilter';
import FilterHeader from '../../components/DataPackPage/FilterHeader';
import DataPackGrid from '../../components/DataPackPage/DataPackGrid';
import DataPackSearchbar from '../../components/DataPackPage/DataPackSearchbar';
import DataPackViewButtons from '../../components/DataPackPage/DataPackViewButtons';
import DataPackSortDropDown from '../../components/DataPackPage/DataPackSortDropDown';
import DataPackFilterButton from '../../components/DataPackPage/DataPackFilterButton';
import DataPackOwnerSort from '../../components/DataPackPage/DataPackOwnerSort';
import DataPackLinkButton from '../../components/DataPackPage/DataPackLinkButton';
import * as utils from '../../utils/sortUtils';
import isEqual from 'lodash/isEqual';

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
            },
            user: {data: {username: 'admin'}},
            getRuns: () => {},
            deleteRuns: () => {},
            runsDeletion: {
                deleting: false,
                deleted: false,
                error: null
            },
            drawerOpen: true,
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
        expect(wrapper.find(Drawer)).toHaveLength(1);
        expect(wrapper.find(FilterHeader)).toHaveLength(1);
        expect(wrapper.find(PermissionFilter)).toHaveLength(1);
        expect(wrapper.find(StatusFilter)).toHaveLength(1);
        expect(wrapper.find(DateFilter)).toHaveLength(1);
        expect(wrapper.find(DataPackGrid)).toHaveLength(1);
    });

    it('should call getRuns when mounting', () => {
        let props = getProps();
        props.getRuns = new sinon.spy();
        const mountSpy = new sinon.spy(DataPackPage.prototype, 'componentWillMount');
        const wrapper = shallow(<DataPackPage {...props}/>);
        expect(props.getRuns.calledOnce).toBe(true);
        expect(mountSpy.calledOnce).toBe(true);
    });

    it('should run getRuns at intervals', () => {
        jest.useFakeTimers();
        let props = getProps();
        props.getRuns = new sinon.spy();
        const wrapper = shallow(<DataPackPage {...props}/>);
        expect(props.getRuns.calledOnce).toBe(true);
        expect(setInterval.mock.calls.length).toEqual(1);
        expect(setInterval.mock.calls[0][1]).toEqual(10000);
        jest.runOnlyPendingTimers();
        expect(props.getRuns.calledTwice).toBe(true);
        jest.runOnlyPendingTimers();
        expect(props.getRuns.calledThrice).toBe(true);
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
        expect(stateSpy.calledTwice).toBe(true);
        DataPackPage.prototype.setState.restore();
        DataPackPage.prototype.componentWillReceiveProps.restore();
    });

    it('should search "TEST" with handleSearch', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs = [
            {
                job: {
                    name: 'tEst name',
                    description: 'bad description',
                    event: 'bad event',
                }
            },{
                job: {
                    name: 'bad name',
                    description: 'teST description',
                    event: 'bad event',
                }
                
            },{
                job: {
                    name: 'bad name',
                    description: 'bad description',
                    event: 'test event',
                }
            },{
                job: {
                    name: 'bad name',
                    description: 'bad description',
                    event: 'bad event',
                }
            }
        ]
        wrapper.setState({runs: runs});
        wrapper.setState({displayedRuns: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const searchSpy = new sinon.spy(utils, 'search');
        wrapper.instance().onSearch('TEST', -1);
        expect(stateSpy.calledTwice).toBe(true);
        expect(searchSpy.calledWith('TEST', runs))
        expect(isEqual(wrapper.state().displayedRuns, [
            {
                job: {
                    name: 'tEst name',
                    description: 'bad description',
                    event: 'bad event',
                }
            },{
                job: {
                    name: 'bad name',
                    description: 'teST description',
                    event: 'bad event',
                }
                
            },{
                job: {
                    name: 'bad name',
                    description: 'bad description',
                    event: 'test event',
                }
            },
            ])).toBe(true);
        stateSpy.restore();
        searchSpy.restore();
    });

    it('should handle a searchbar clear', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        wrapper.setState({runs: [
            {name: 'one', started_at: '2017-03-19'},
            {name: 'two', started_at: '2017-03-21'},
            {name: 'three', started_at: '2017-03-20'},
            {name: 'four', started_at: '2017-03-20'},
            {name: 'five', started_at: '2017-03-17'}
        ]});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const applySortsSpy = new sinon.spy(DataPackPage.prototype, 'applySorts');
        const applyFiltersSpy = new sinon.spy(DataPackPage.prototype, 'applyFilters');
        wrapper.instance().checkForEmptySearch('', [], {});
        expect(stateSpy.calledWith({search: {searched: false, searchQuery: ''}})).toBe(true);
        expect(applySortsSpy.calledWith(wrapper.state().runs));
        expect(applyFiltersSpy.calledWith(wrapper.state().runs));
        expect(stateSpy.calledWith({displayedRuns: wrapper.state().displayedRuns})).toBe(true);
        DataPackPage.prototype.setState.restore();
        DataPackPage.prototype.applySorts.restore();
        DataPackPage.prototype.applyFilters.restore();
    });

    it('if a run has been deleted it should call getRuns again', () => {
        let props = getProps();
        props.getRuns = sinon.spy();
        const wrapper = shallow(<DataPackPage {...props}/>);
        expect(props.getRuns.calledOnce).toBe(true);
        let nextProps = getProps();
        nextProps.runsDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(props.getRuns.calledTwice).toBe(true);
    });

    it('should re-sort on handleSortChange', () => {
        let props = getProps();
        const event = {persist: () => {},};
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs = [
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ]
        wrapper.setState({runs: runs});
        wrapper.setState({displayedRuns: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const sortSpy = new sinon.spy(utils, 'orderOldest');
        wrapper.instance().handleSortChange(event, 1, utils.orderOldest);
        expect(stateSpy.calledWith({dropDownValue: utils.orderOldest}));
        expect(stateSpy.calledWith({displayedRuns: [
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-20'},
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
        ]}));
        stateSpy.restore();
        sortSpy.restore();
    });

    it('handleOwnerFilter should call applyAll', () => {
        let props = getProps();
        const event = {persist: () => {}};
        const applySpy = new sinon.spy(DataPackPage.prototype, 'applyAll');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs = [
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        wrapper.setState({dropDownValue: 2, runs: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleOwnerFilter(event, 0, 1,);
        expect(stateSpy.calledWith({dropDownValue: 1})).toBe(true);
        expect(applySpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({displayedRuns: runs})).toBe(true);
        stateSpy.restore();
        applySpy.restore();
    });

    it('handleOwnerFilter should call myDataPacksOnly', () => {
        let props = getProps();
        const event = {persist: () => {}};
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs = [
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        wrapper.setState({runs: runs});
        wrapper.setState({displayedRuns: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const filterSpy = new sinon.spy(utils, 'myDataPacksOnly');
        wrapper.instance().handleOwnerFilter(event, 1, 2);
        expect(stateSpy.calledWith({dropDownValue: 2}));
        expect(filterSpy.calledWith(runs, 'admin'));
        expect(stateSpy.calledWith({displayedRuns: [
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ]}));
        stateSpy.restore();
        filterSpy.restore();
    });

    it('applyAll should call search, filter, and sorts', () => {
        let props = getProps();
        const searchSpy = new sinon.spy(DataPackPage.prototype, 'applySearch');
        const filterSpy = new sinon.spy(DataPackPage.prototype, 'applyFilters');
        const sortSpy = new sinon.spy(DataPackPage.prototype, 'applySorts');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        wrapper.instance().applyAll(runs);
        expect(searchSpy.calledWith(runs)).toBe(true);
        expect(filterSpy.calledWith(runs)).toBe(true);
        expect(sortSpy.calledWith(runs)).toBe(true);
        searchSpy.restore();
        filterSpy.restore();
        sortSpy.restore();
    });

    it('applySorts should call sortDropDown', () => {
        let props = getProps();
        const sortSpy = new sinon.spy(utils, 'orderNewest');
        const ownerSpy = new sinon.spy(utils, 'myDataPacksOnly');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        const returned_runs = wrapper.instance().applySorts(runs);
        expect(sortSpy.calledWith(runs)).toBe(true);
        expect(ownerSpy.called).toBe(false);
        expect(isEqual(returned_runs, runs)).toBe(true);
        sortSpy.restore();
        ownerSpy.restore();
    });
    
    it('applySorts should call tableSort', () => {
        let props = getProps();
        const sortSpy = new sinon.spy(utils , 'orderOldest');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        wrapper.setState({tableSort: sortSpy, grid: false});
        const returned_runs = wrapper.instance().applySorts(runs);
        expect(sortSpy.calledOnce).toBe(true);
        expect(sortSpy.calledWith(runs)).toBe(true);
        expect(returned_runs[0].started_at).toEqual('2017-03-19');
        expect(returned_runs[2].started_at).toEqual('2017-03-21');
        sortSpy.restore();
    })

    it('applySorts should call sortDropDown and myDataPacksOnly', () => {
        let props = getProps();
        const sortSpy = new sinon.spy(utils, 'orderNewest');
        const ownerSpy = new sinon.spy(utils, 'myDataPacksOnly');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        wrapper.setState({dropDownValue: 2});
        const returned_runs = wrapper.instance().applySorts(runs);
        expect(ownerSpy.calledWith(runs, 'admin')).toBe(true);
        expect(sortSpy.calledWith([runs[0], runs[2]])).toBe(true);
        expect(isEqual(returned_runs, [runs[0], runs[2]])).toBe(true);
        sortSpy.restore();
        ownerSpy.restore();
    });

    it('applySearch should return without doing anything when searched is not true', () => {
        let props = getProps();
        const searchSpy = new sinon.spy(utils, 'search');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        const returned_runs = wrapper.instance().applySearch(runs);
        expect(searchSpy.called).toBe(false);
        expect(isEqual(returned_runs, runs)).toBe(true);
        searchSpy.restore();
    });

    it('applySearch should call the search util', () => {
        let props = getProps();
        const searchSpy = new sinon.spy(utils, 'search');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        wrapper.setState({search: {searched: true, searchQuery: 'one'}});
        const returned_runs = wrapper.instance().applySearch(runs);
        expect(searchSpy.calledWith('one', runs)).toBe(true);
        expect(returned_runs.length).toEqual(1);
        expect(returned_runs[0].job.name).toEqual('one');
        searchSpy.restore();
    });

    it('applyFilter should call filterPermissions', () => {
         let props = getProps();
         const permissionsSpy = new sinon.spy(utils, 'filterPermissions');
         const statusSpy = new sinon.spy(utils, 'filterStatus');
         const dateSpy = new sinon.spy(utils, 'filterDate');
         const wrapper = shallow(<DataPackPage {...props}/>);
         const runs =[
            {job: {name: 'one', description: 'test', event: 'test', published: true}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test', published: true}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test', published: false}, user: 'admin', started_at: '2017-03-19'},
         ];
         wrapper.setState({permissions: 'PRIVATE'});
         const returned_runs = wrapper.instance().applyFilters(runs);
         expect(permissionsSpy.calledOnce).toBe(true);
         expect(statusSpy.called).toBe(false);
         expect(dateSpy.called).toBe(false);
         expect(returned_runs.length).toEqual(1);
         expect(returned_runs[0].job.name).toEqual('three');
         permissionsSpy.restore();
         statusSpy.restore();
         dateSpy.restore();
    });

    it('applyFilter should call filterStatus', () => {
         let props = getProps();
         const permissionsSpy = new sinon.spy(utils, 'filterPermissions');
         const statusSpy = new sinon.spy(utils, 'filterStatus');
         const dateSpy = new sinon.spy(utils, 'filterDate');
         const wrapper = shallow(<DataPackPage {...props}/>);
         const runs =[
            {job: {name: 'one', description: 'test', event: 'test', published: true}, user: 'admin', started_at: '2017-03-21', status: 'COMPLETED'},
            {job: {name: 'two', description: 'test', event: 'test', published: true}, user: 'notadmin', started_at: '2017-03-20', status:'SUBMITTED'},
            {job: {name: 'three', description: 'test', event: 'test', published: false}, user: 'admin', started_at: '2017-03-19', status: 'SUBMITTED'},
         ];
         wrapper.setState({status: {completed: true, incomplete: false, running: false}});
         const returned_runs = wrapper.instance().applyFilters(runs);
         expect(permissionsSpy.called).toBe(false);
         expect(statusSpy.calledOnce).toBe(true);
         expect(dateSpy.called).toBe(false);
         expect(returned_runs.length).toEqual(1);
         expect(returned_runs[0].job.name).toEqual('one');
         permissionsSpy.restore();
         statusSpy.restore();
         dateSpy.restore();
    });

    it('applyFilter should call filterDate', () => {
         let props = getProps();
         const permissionsSpy = new sinon.spy(utils, 'filterPermissions');
         const statusSpy = new sinon.spy(utils, 'filterStatus');
         const dateSpy = new sinon.spy(utils, 'filterDate');
         const wrapper = shallow(<DataPackPage {...props}/>);
         const runs =[
            {job: {name: 'one', description: 'test', event: 'test', published: true}, user: 'admin', started_at: '2017-03-21', status: 'COMPLETED'},
            {job: {name: 'two', description: 'test', event: 'test', published: true}, user: 'notadmin', started_at: '2017-03-20', status:'SUBMITTED'},
            {job: {name: 'three', description: 'test', event: 'test', published: false}, user: 'admin', started_at: '2017-03-19', status: 'SUBMITTED'},
         ];
         wrapper.setState({minDate: new Date(2017,2,20,23,0)});
         const returned_runs = wrapper.instance().applyFilters(runs);
         expect(permissionsSpy.called).toBe(false);
         expect(statusSpy.called).toBe(false);
         expect(dateSpy.calledOnce).toBe(true);
         expect(returned_runs.length).toEqual(1);
         expect(returned_runs[0].job.name).toEqual('one');
         permissionsSpy.restore();
         statusSpy.restore();
         dateSpy.restore();    
    });

    it('handleFilterApply should set state and call applyAll', () => {
        const props = getProps();
        const applySpy = new sinon.spy(DataPackPage.prototype, 'applyAll');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test', published: true}, user: 'admin', started_at: '2017-03-21', status: 'COMPLETED'},
            {job: {name: 'two', description: 'test', event: 'test', published: true}, user: 'notadmin', started_at: '2017-03-20', status:'SUBMITTED'},
            {job: {name: 'three', description: 'test', event: 'test', published: false}, user: 'admin', started_at: '2017-03-19', status: 'SUBMITTED'},
        ];
        wrapper.setState({displayedRuns: runs, runs: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleFilterApply();
        expect(stateSpy.calledThrice).toBe(true);
        expect(stateSpy.calledWith({filtersApplied: true})).toBe(true);
        expect(applySpy.calledWith(runs)).toBe(true);
        expect(stateSpy.calledWith({displayedRuns: runs})).toBe(true);
        stateSpy.restore();
        applySpy.restore();
    });

    it('handleTableSort should use the passed in function on displayed runs then update the state', () => {
        const sortFunc = (runs) => {
            return runs.reverse();
        }
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test', published: true}, user: 'admin', started_at: '2017-03-21', status: 'COMPLETED'},
            {job: {name: 'two', description: 'test', event: 'test', published: true}, user: 'notadmin', started_at: '2017-03-20', status:'SUBMITTED'},
            {job: {name: 'three', description: 'test', event: 'test', published: false}, user: 'admin', started_at: '2017-03-19', status: 'SUBMITTED'},
        ];
        wrapper.setState({displayedRuns: runs, runs: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleTableSort(sortFunc);
        expect(stateSpy.calledWith({displayedRuns: runs.reverse(), tableSort: sortFunc})).toBe(true);
        stateSpy.restore();
    });

    it('handleFilterClear should setState then re-apply search and sort', () => {
        const props = getProps();
        const searchSpy = new sinon.spy(DataPackPage.prototype, 'applySearch');
        const sortSpy = new sinon.spy(DataPackPage.prototype, 'applySorts');
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs =[
            {job: {name: 'one', description: 'test', event: 'test', published: true}, user: 'admin', started_at: '2017-03-21', status: 'COMPLETED'},
            {job: {name: 'two', description: 'test', event: 'test', published: true}, user: 'notadmin', started_at: '2017-03-20', status:'SUBMITTED'},
            {job: {name: 'three', description: 'test', event: 'test', published: false}, user: 'admin', started_at: '2017-03-19', status: 'SUBMITTED'},
        ];
        wrapper.setState({displayedRuns: runs, runs: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleFilterClear();
        expect(stateSpy.calledThrice).toBe(true);
        expect(stateSpy.calledWith({
            permissions: null,
            status: {
                completed: false,
                incomplete: false,
                running: false,
            },
            minDate: null,
            maxDate: null,
            filtersApplied: false,
        })).toBe(true);
        expect(searchSpy.calledWith(runs)).toBe(true);
        expect(sortSpy.calledWith(runs)).toBe(true);
        expect(stateSpy.calledWith({displayedRuns: runs}));
        searchSpy.restore();
        sortSpy.restore();
        stateSpy.restore();
    });

    it('handlePermissionsChange should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handlePermissionsChange(null, 'value');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({permissions: 'value'}));
        stateSpy.restore();
    });

    it('handleStatusChange should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleStatusChange({completed: true});
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({status: {completed: true, incomplete: false, running: false}})).toBe(true);
        stateSpy.restore();
    });

    it('handleMinDate should set state', () => {
        const props = getProps();
        const date = new Date(2017,2,30);
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleMinDate(null, date);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({minDate: date}));
        stateSpy.restore();
    });

    it('handleMaxDate should set state', () => {
        const props = getProps();
        const date = new Date(2017,2,30);
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleMaxDate(null, date);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({maxDate: date}));
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

    it('screenSizeUpdate should force the component to update', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const updateSpy = new sinon.spy(DataPackPage.prototype, 'forceUpdate');
        wrapper.instance().screenSizeUpdate();
        expect(updateSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });
});

