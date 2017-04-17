import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
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
        expect(wrapper.find(AppBar)).to.have.length(1);
        expect(wrapper.find(AppBar).hasClass('sectionTitle')).to.be.true;
        expect(wrapper.find(AppBar).find('h1').text()).to.equal('DataPack Library');
        expect(wrapper.find(DataPackLinkButton)).to.have.length(1);
        expect(wrapper.find(Toolbar)).to.have.length(2);
        expect(wrapper.find(ToolbarGroup)).to.have.length(1);
        expect(wrapper.find(DataPackSearchbar)).to.have.length(1);
        expect(wrapper.find(DataPackOwnerSort)).to.have.length(1);
        expect(wrapper.find(DataPackFilterButton)).to.have.length(1);
        expect(wrapper.find(DataPackSortDropDown)).to.have.length(1);
        expect(wrapper.find(DataPackViewButtons)).to.have.length(1);
        expect(wrapper.find(Drawer)).to.have.length(1);
        expect(wrapper.find(FilterHeader)).to.have.length(1);
        expect(wrapper.find(PermissionFilter)).to.have.length(1);
        expect(wrapper.find(StatusFilter)).to.have.length(1);
        expect(wrapper.find(DateFilter)).to.have.length(1);
        expect(wrapper.find(DataPackGrid)).to.have.length(1);
    });

    it('should call getRuns when mounting', () => {
        let props = getProps();
        props.getRuns = new sinon.spy();
        const mountSpy = new sinon.spy(DataPackPage.prototype, 'componentWillMount');
        const wrapper = shallow(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        expect(props.getRuns.calledOnce).to.be.true;
        expect(mountSpy.calledOnce).to.be.true;
    });

    it('should handle fetched runs', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
        let nextProps = getProps();
        nextProps.runsList.fetched = true;
        nextProps.runsList.runs = [{user: 'admin2', uid: '2'}, {user: 'admin', uid: '1'}, {user: 'admin3', uid: '3'}];
        const propsSpy = new sinon.spy(DataPackPage.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).to.be.true;
        expect(stateSpy.calledTwice).to.be.true;
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
        expect(stateSpy.calledTwice).to.be.true;
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
            ])).to.be.true;
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
        expect(stateSpy.calledWith({search: {searched: false, searchQuery: ''}})).to.be.true;
        expect(applySortsSpy.calledWith(wrapper.state().runs));
        expect(applyFiltersSpy.calledWith(wrapper.state().runs));
        expect(stateSpy.calledWith({displayedRuns: wrapper.state().displayedRuns})).to.be.true;
        DataPackPage.prototype.setState.restore();
        DataPackPage.prototype.applySorts.restore();
        DataPackPage.prototype.applyFilters.restore();
    });

    it('if a run has been deleted it should call getRuns again', () => {
        let props = getProps();
        props.getRuns = sinon.spy();
        const wrapper = shallow(<DataPackPage {...props}/>);
        expect(props.getRuns.calledOnce).to.be.true;
        let nextProps = getProps();
        nextProps.runsDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(props.getRuns.calledTwice).to.be.true;
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
        expect(stateSpy.calledWith({dropDownValue: 1})).to.be.true;
        expect(applySpy.calledOnce).to.be.true;
        expect(stateSpy.calledWith({displayedRuns: runs})).to.be.true;
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
        expect(searchSpy.calledWith(runs)).to.be.true;
        expect(filterSpy.calledWith(runs)).to.be.true;
        expect(sortSpy.calledWith(runs)).to.be.true;
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
        expect(sortSpy.calledWith(runs)).to.be.true;
        expect(ownerSpy.called).to.be.false;
        expect(isEqual(returned_runs, runs)).to.be.true;
        sortSpy.restore();
        ownerSpy.restore();
    });

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
        expect(ownerSpy.calledWith(runs, 'admin')).to.be.true;
        expect(sortSpy.calledWith([runs[0], runs[2]])).to.be.true;
        expect(isEqual(returned_runs, [runs[0], runs[2]])).to.be.true;
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
        expect(searchSpy.called).to.be.false;
        expect(isEqual(returned_runs, runs)).to.be.true;
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
        expect(searchSpy.calledWith('one', runs)).to.be.true;
        expect(returned_runs.length).to.equal(1);
        expect(returned_runs[0].job.name).to.equal('one');
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
         expect(permissionsSpy.calledOnce).to.be.true;
         expect(statusSpy.called).to.be.false;
         expect(dateSpy.called).to.be.false;
         expect(returned_runs.length).to.equal(1);
         expect(returned_runs[0].job.name).to.equal('three');
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
         expect(permissionsSpy.called).to.be.false;
         expect(statusSpy.calledOnce).to.be.true;
         expect(dateSpy.called).to.be.false;
         expect(returned_runs.length).to.equal(1);
         expect(returned_runs[0].job.name).to.equal('one');
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
         expect(permissionsSpy.called).to.be.false;
         expect(statusSpy.called).to.be.false;
         expect(dateSpy.calledOnce).to.be.true;
         expect(returned_runs.length).to.equal(1);
         expect(returned_runs[0].job.name).to.equal('one');
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
        expect(stateSpy.calledTwice).to.be.true;
        expect(stateSpy.calledWith({filtersApplied: true})).to.be.true;
        expect(applySpy.calledWith(runs)).to.be.true;
        expect(stateSpy.calledWith({displayedRuns: runs})).to.be.true;
        stateSpy.restore();
        applySpy.restore();
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
        expect(stateSpy.calledTwice).to.be.true;
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
        })).to.be.true;
        expect(searchSpy.calledWith(runs)).to.be.true;
        expect(sortSpy.calledWith(runs)).to.be.true;
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
        expect(stateSpy.calledOnce).to.be.true;
        expect(stateSpy.calledWith({permissions: 'value'}));
        stateSpy.restore();
    });

    it('handleStatusChange should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleStatusChange({completed: true});
        expect(stateSpy.calledOnce).to.be.true;
        expect(stateSpy.calledWith({status: {completed: true, incomplete: false, running: false}})).to.be.true;
        stateSpy.restore();
    });

    it('handleMinDate should set state', () => {
        const props = getProps();
        const date = new Date(2017,2,30);
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleMinDate(null, date);
        expect(stateSpy.calledOnce).to.be.true;
        expect(stateSpy.calledWith({minDate: date}));
        stateSpy.restore();
    });

    it('handleMaxDate should set state', () => {
        const props = getProps();
        const date = new Date(2017,2,30);
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleMaxDate(null, date);
        expect(stateSpy.calledOnce).to.be.true;
        expect(stateSpy.calledWith({maxDate: date}));
        stateSpy.restore();
    });

    it('handleToggle should set state', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        wrapper.instance().handleToggle();
        expect(stateSpy.calledOnce).to.be.true;
        expect(stateSpy.calledWith({open: false}));
        stateSpy.restore();
    });

    it('screenSizeUpdate should force the component to update', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        const updateSpy = new sinon.spy(DataPackPage.prototype, 'forceUpdate');
        wrapper.instance().screenSizeUpdate();
        expect(updateSpy.calledOnce).to.be.true;
        updateSpy.restore();
    });
});

