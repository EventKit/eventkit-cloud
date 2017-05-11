import React from 'react';
import sinon from 'sinon';
import {shallow, mount} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow} from 'material-ui/Table';
import {GridList} from 'material-ui/GridList'
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowDropUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import DataPackList from '../../components/DataPackPage/DataPackList';
import DataPackListItem from '../../components/DataPackPage/DataPackListItem';
import DataPackTableItem from '../../components/DataPackPage/DataPackTableItem';
import CustomScrollbar from '../../components/CustomScrollbar';
import * as sorts from '../../utils/sortUtils';

describe('DataPackList component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            runs: getRuns(),
            user: {data: {username: 'admin'}},
            onRunDelete: () => {},
            onSort: () => {},
        }
    }

    it('should render list items as part of the mobile view', () => {
        const props = getProps();
        const wrapper = mount(<DataPackList {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        // ensure the screen is small
        window.resizeTo(556, 600);
        expect(window.innerWidth).toEqual(556);
        wrapper.update();

        expect(wrapper.find(GridList)).toHaveLength(1);
        expect(wrapper.find(DataPackListItem)).toHaveLength(3);
        expect(wrapper.find(Table)).toHaveLength(0);
    });

    it('should render table items as part of the desktop view', () => {
        const props = getProps();
        const  wrapper = mount(<DataPackList {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        //ensure the screen is large
        window.resizeTo(1250, 800);
        expect(window.innerWidth).toEqual(1250);
        wrapper.update();

        expect(wrapper.find(GridList)).toHaveLength(0);
        expect(wrapper.find(Table)).toHaveLength(2);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(TableHeader)).toHaveLength(1);
        expect(wrapper.find(TableHeaderColumn)).toHaveLength(7);
        const headerColumns = wrapper.find(TableHeaderColumn);
        expect(headerColumns.at(0).text()).toEqual('Name');
        expect(headerColumns.at(0).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(1).text()).toEqual('Event');
        expect(headerColumns.at(1).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(2).text()).toEqual('Date Added');
        expect(headerColumns.at(2).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(3).text()).toEqual('Status');
        expect(headerColumns.at(3).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(4).text()).toEqual('Permissions');
        expect(headerColumns.at(4).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(5).text()).toEqual('Owner');
        expect(headerColumns.at(5).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(6).text()).toEqual('');
        expect(wrapper.find(TableBody)).toHaveLength(1);
        expect(wrapper.find(DataPackTableItem)).toHaveLength(3);
    });

    it('should have order newest date active by default in the table', () => {
        const props = getProps();
        const wrapper = mount(<DataPackList {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        //ensure the screen is large
        window.resizeTo(1250, 800);
        expect(window.innerWidth).toEqual(1250);
        wrapper.update();
        expect(wrapper.find(TableHeaderColumn).at(2).find('span').props().style).toEqual({color: '#000', fontWeight: 'bold'});
        expect(wrapper.state().activeSort).toEqual(sorts.orderNewest);
    });

    it('handleNameSort should use orderAZ if not active, else if should use the opposite of activeSort', () => {
        let props = getProps();
        props.onSort = new sinon.spy();
        const wrapper = shallow(<DataPackList {...props}/>);
        const stateSpy = new sinon.spy(DataPackList.prototype, 'setState');
        wrapper.instance().handleNameSort();
        expect(props.onSort.calledWith(sorts.orderAZ)).toBe(true);;
        expect(stateSpy.calledWith({activeSort: sorts.orderAZ})).toBe(true);;
        wrapper.instance().handleNameSort();
        expect(props.onSort.calledWith(sorts.orderZA)).toBe(true);;
        expect(stateSpy.calledWith({activeSort: sorts.orderZA})).toBe(true);
        stateSpy.restore();
    });

    it('handleEventSort should use orderEventAZ if not active, else it should use the opposite of activeSort', () => {
        let props = getProps();
        props.onSort = new sinon.spy();
        const wrapper = shallow(<DataPackList {...props}/>);
        const stateSpy = new sinon.spy(DataPackList.prototype, 'setState');
        wrapper.instance().handleEventSort();
        expect(props.onSort.calledWith(sorts.orderEventAZ)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderEventAZ})).toBe(true);
        wrapper.instance().handleEventSort();
        expect(props.onSort.calledWith(sorts.orderEventZA)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderEventZA})).toBe(true);
        stateSpy.restore();
    });

    it('handleDateSort should use orderNewest if not active, else it should use the opposite of activeSort', () => {
        let props = getProps();
        props.onSort = new sinon.spy();
        const wrapper = shallow(<DataPackList {...props}/>);
        const stateSpy = new sinon.spy(DataPackList.prototype, 'setState');
        //set a different activeSort since dateSort is the default
        wrapper.instance().handleEventSort();
        wrapper.instance().handleDateSort();
        expect(props.onSort.calledWith(sorts.orderNewest)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderNewest})).toBe(true);
        wrapper.instance().handleDateSort();
        expect(props.onSort.calledWith(sorts.orderOldest)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderOldest})).toBe(true);
        stateSpy.restore();
    });

    it('handleStatusSort should use orderComplete if not active, else it should use the opposite of activeSort', () => {
        let props = getProps();
        props.onSort = new sinon.spy();
        const wrapper = shallow(<DataPackList {...props}/>);
        const stateSpy = new sinon.spy(DataPackList.prototype, 'setState');
        wrapper.instance().handleStatusSort();
        expect(props.onSort.calledWith(sorts.orderComplete)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderComplete})).toBe(true);
        wrapper.instance().handleStatusSort();
        expect(props.onSort.calledWith(sorts.orderIncomplete)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderIncomplete})).toBe(true);
        stateSpy.restore();
    });

    it('handlePermissionsSort should use orderPriovate if not active, else it should use the opposite of activeSort', () => {
        let props = getProps();
        props.onSort = new sinon.spy();
        const wrapper = shallow(<DataPackList {...props}/>);
        const stateSpy = new sinon.spy(DataPackList.prototype, 'setState');
        wrapper.instance().handlePermissionsSort();
        expect(props.onSort.calledWith(sorts.orderPrivate)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderPrivate})).toBe(true);
        wrapper.instance().handlePermissionsSort();
        expect(props.onSort.calledWith(sorts.orderPrivate)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderPrivate})).toBe(true);
        stateSpy.restore();
    });

    it('handleOwnerSort should use orderOwnerAZ if not active, else it should use the opposite of activeSort', () => {
        let props = getProps();
        props.onSort = new sinon.spy();
        const wrapper = shallow(<DataPackList {...props}/>);
        const stateSpy = new sinon.spy(DataPackList.prototype, 'setState');
        wrapper.instance().handleOwnerSort();
        expect(props.onSort.calledWith(sorts.orderOwnerAZ)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderOwnerAZ})).toBe(true);
        wrapper.instance().handleOwnerSort();
        expect(props.onSort.calledWith(sorts.orderOwnerZA)).toBe(true);
        expect(stateSpy.calledWith({activeSort: sorts.orderOwnerZA})).toBe(true);
        stateSpy.restore();
    });

    it('isNameActive should return whether activeSort is a name sort function', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props}/>);
        expect(wrapper.instance().isNameActive()).toBe(false);
        wrapper.setState({activeSort: sorts.orderAZ});
        expect(wrapper.instance().isNameActive()).toBe(true);
    });

    it('isEventActive should return whether activeSort is a event sort function', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props}/>);
        expect(wrapper.instance().isEventActive()).toBe(false);
        wrapper.setState({activeSort: sorts.orderEventAZ});
        expect(wrapper.instance().isEventActive()).toBe(true);
    });

    it('isDateActive should return whether activeSort is a date sort function', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props}/>);
        expect(wrapper.instance().isDateActive()).toBe(true);
        wrapper.setState({activeSort: sorts.orderEventAZ});
        expect(wrapper.instance().isDateActive()).toBe(false);
    });

    it('isStatusActive should return whether activeSort is a status sort function', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props}/>);
        expect(wrapper.instance().isStatusActive()).toBe(false);
        wrapper.setState({activeSort: sorts.orderComplete});
        expect(wrapper.instance().isStatusActive()).toBe(true);
    });

    it('isPermissionsActive should return whether activeSort is a permissions sort function', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props}/>);
        expect(wrapper.instance().isPermissionsActive()).toBe(false);
        wrapper.setState({activeSort: sorts.orderPrivate});
        expect(wrapper.instance().isPermissionsActive()).toBe(true);
    });

    it('isOwnerActive should return whether activeSort is a owner sort function', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props}/>);
        expect(wrapper.instance().isOwnerActive()).toBe(false);
        wrapper.setState({activeSort: sorts.orderOwnerAZ});
        expect(wrapper.instance().isOwnerActive()).toBe(true);
    });

    it('getIcon should return up arrow if activeSort is equal to passed in sort, else it return down arrow', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props}/>);
        let icon = wrapper.instance().getIcon(sorts.orderAZ);
        expect(icon).toEqual(<NavigationArrowDropDown style={{verticalAlign: 'middle', marginBottom: '2px', fill: '#4498c0'}}/>);
        icon = wrapper.instance().getIcon(sorts.orderNewest);
        expect(icon).toEqual(<NavigationArrowDropUp style={{verticalAlign: 'middle', marginBottom: '2px', fill: '#4498c0'}}/>);
    });

    it('getHeaderStyle should return bold black style if true or inherit style if false', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props}/>);
        let style = wrapper.instance().getHeaderStyle(true);
        expect(style).toEqual({color: '#000', fontWeight: 'bold'});
        style = wrapper.instance().getHeaderStyle(false);
        expect(style).toEqual({color: 'inherit'});
    });
});

function getRuns() {
    return [
    {
        "uid": "6870234f-d876-467c-a332-65fdf0399a0d",
        "url": "http://cloud.eventkit.dev/api/runs/6870234f-d876-467c-a332-65fdf0399a0d",
        "started_at": "2017-03-10T15:52:35.637331Z",
        "finished_at": "2017-03-10T15:52:39.837Z",
        "duration": "0:00:04.199825",
        "user": "admin",
        "status": "COMPLETED",
        "job": {
            "uid": "7643f806-1484-4446-b498-7ddaa65d011a",
            "name": "Test1",
            "event": "Test1 event",
            "description": "Test1 description",
            "url": "http://cloud.eventkit.dev/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "7643f806-1484-4446-b498-7ddaa65d011a",
                    "name": "Test1"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                -0.077419,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.778155
                            ]
                        ]
                    ]
                }
            },
            "selection": "",
            "published": false
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:35.637258Z"
    },
    {
        "uid": "c7466114-8c0c-4160-8383-351414b11e37",
        "url": "http://cloud.eventkit.dev/api/runs/c7466114-8c0c-4160-8383-351414b11e37",
        "started_at": "2017-03-10T15:52:29.311523Z",
        "finished_at": "2017-03-10T15:52:33.612Z",
        "duration": "0:00:04.301278",
        "user": "notAdmin",
        "status": "COMPLETED",
        "job": {
            "uid": "5488a864-89f2-4e9c-8370-18291ecdae4a",
            "name": "Test2",
            "event": "Test2 event",
            "description": "Test2 description",
            "url": "http://cloud.eventkit.dev/api/jobs/5488a864-89f2-4e9c-8370-18291ecdae4a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "5488a864-89f2-4e9c-8370-18291ecdae4a",
                    "name": "Test2"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                -0.077419,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.778155
                            ]
                        ]
                    ]
                }
            },
            "selection": "",
            "published": true
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/c7466114-8c0c-4160-8383-351414b11e37/TestGPKG-WMS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:29.311458Z"
    },
    {
        "uid": "282816a6-7d16-4f59-a1a9-18764c6339d6",
        "url": "http://cloud.eventkit.dev/api/runs/282816a6-7d16-4f59-a1a9-18764c6339d6",
        "started_at": "2017-03-10T15:52:18.796929Z",
        "finished_at": "2017-03-10T15:52:27.500Z",
        "duration": "0:00:08.703092",
        "user": "admin",
        "status": "COMPLETED",
        "job": {
            "uid": "78bbd59a-4066-4e30-8460-c7b0093a0d7a",
            "name": "Test3",
            "event": "Test3 event",
            "description": "Test3 description",
            "url": "http://cloud.eventkit.dev/api/jobs/78bbd59a-4066-4e30-8460-c7b0093a0d7a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "78bbd59a-4066-4e30-8460-c7b0093a0d7a",
                    "name": "Test3"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                -0.077419,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.778155
                            ]
                        ]
                    ]
                }
            },
            "selection": "",
            "published": true
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/282816a6-7d16-4f59-a1a9-18764c6339d6/TestGPKG-OSM-CLIP-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:18.796854Z"
    },]
}
