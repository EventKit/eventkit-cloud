import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {DataPackPage} from '../../components/DataPackPage/DataPackPage';
import AppBar from 'material-ui/AppBar';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import DataPackList from '../../components/DataPackPage/DataPackList';
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
            }
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
        expect(wrapper.find(DataPackList)).to.have.length(1);
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
        const applyFiltersSpy = new sinon.spy(DataPackPage.prototype, 'applyFilters');
        wrapper.instance().checkForEmptySearch('', [], {});
        expect(stateSpy.calledWith({search: {searched: false, searchQuery: ''}})).to.be.true;
        expect(applyFiltersSpy.calledWith(wrapper.state().runs));
        DataPackPage.prototype.setState.restore();
        DataPackPage.prototype.applyFilters.restore();
    });

    it('applyFilters should modify displayedRuns correctly', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackPage {...props}/>);
        let runs = [
            {job: {name: 'one', description: '', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'key', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'three', description: '', event: 'test'}, user: 'notadmin', started_at: '2017-03-20'},
            {job: {name: 'four-key', description: '', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
            {job: {name: 'five', description: '', event: 'test-key'}, user: 'admin', started_at: '2017-03-17'},
            {job: {name: 'six', description: 'key', event: 'test'}, user: 'admin', started_at: '2017-03-15'}
        ]
        const sortSpy = new sinon.spy(utils, 'orderNewest');

        wrapper.setState({
            search: {searched: true, searchQuery: 'key'}, 
            dropDownValue: 2,
            sortDropDown: sortSpy
        });
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const searchSpy = new sinon.spy(utils, 'search');
        const dataPackSpy = new sinon.spy(utils, 'myDataPacksOnly');
        wrapper.instance().applyFilters(runs);
        expect(searchSpy.calledOnce).to.be.true;
        expect(dataPackSpy.calledOnce).to.be.true;
        expect(sortSpy.calledOnce).to.be.true;
        expect(stateSpy.calledOnce).to.be.true;
        expect(stateSpy.calledWith(
            [
            {job: {name: 'four-key', description: '', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
            {job: {name: 'five', description: '', event: 'test-key'}, user: 'admin', started_at: '2017-03-17'},
            {job: {name: 'six', description: 'key', event: 'test'}, user: 'admin', started_at: '2017-03-15'}
            ]));
        stateSpy.restore();
        searchSpy.restore();
        dataPackSpy.restore();
        sortSpy.restore();
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
        const filterSpy = new sinon.spy(utils, 'orderOldest');
        wrapper.instance().handleSortChange(event, 1, utils.orderOldest);
        expect(stateSpy.calledWith({dropDownValue: utils.orderOldest}));
        expect(stateSpy.calledWith({displayedRuns: [
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-20'},
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
        ]}));
        stateSpy.restore();
        filterSpy.restore();
    });

    it('handleDropDownChange should call applyFilters', () => {
        let props = getProps();
        const event = {persist: () => {}};
        const wrapper = shallow(<DataPackPage {...props}/>);
        const runs = [
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'two', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-20'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ];
        wrapper.setState({dropDownValue: 2, runs: runs});
        const stateSpy = new sinon.spy(DataPackPage.prototype, 'setState');
        const filterSpy = new sinon.spy();
        DataPackPage.prototype.applyFilters = filterSpy;
        wrapper.instance().handleDropDownChange(event, 0, 1,);
        expect(stateSpy.calledWith({dropDownValue: 1}));
        expect(filterSpy.calledWith(runs));
        stateSpy.restore();
    });

    it('handleDropDownChange should call myDataPacksOnly', () => {
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
        wrapper.instance().handleDropDownChange(event, 1, 2);
        expect(stateSpy.calledWith({dropDownValue: 2}));
        expect(filterSpy.calledWith(runs, 'admin'));
        expect(stateSpy.calledWith({displayedRuns: [
            {job: {name: 'one', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-21'},
            {job: {name: 'three', description: 'test', event: 'test'}, user: 'admin', started_at: '2017-03-19'},
        ]}));
    })
});
