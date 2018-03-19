import React from 'react';
import sinon from 'sinon';
import {shallow, mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Link} from 'react-router';
import {TableRow, TableRowColumn} from 'material-ui/Table';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import AlertError from 'material-ui/svg-icons/alert/error';
import SocialPerson from 'material-ui/svg-icons/social/person';
import SocialGroup from 'material-ui/svg-icons/social/group';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import DataPackTableItem from '../../components/DataPackPage/DataPackTableItem';

describe('DataPackTableItem component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            run: run,
            user: {data: {user: {username: 'admin'}}},
            onRunDelete: () => {},
            providers: providers,
        }
    }

    it('should render a table row with the correct table columns', () => {
        const props = getProps();
        const wrapper = mount(<DataPackTableItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn)).toHaveLength(8);
        expect(wrapper.find(Link)).toHaveLength(1);
        expect(wrapper.find(Link).props().to).toEqual('/status/' + run.job.uid);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(NavigationMoreVert)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(0).text()).toEqual(run.job.name);
        expect(wrapper.find(TableRowColumn).at(1).text()).toEqual(run.job.event);
        expect(wrapper.find(TableRowColumn).at(2).text()).toEqual('2017-03-10');
        expect(wrapper.find(TableRowColumn).at(3).find(NavigationCheck)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(4).find(SocialPerson)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(5).text()).toEqual('My DataPack');
    });

    it('should render differently when props change', () => {
        let props = getProps();
        const wrapper = mount(<DataPackTableItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        props.run.user = 'Not Admin';
        props.run.job.published = true;
        props.run.status  = 'INCOMPLETE';
        wrapper.setProps(props);
        expect(wrapper.find(TableRowColumn).at(3).find(AlertError)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(4).find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(5).text()).toEqual('Not Admin');
        props.run.status = 'SUBMITTED';
        wrapper.setProps(props);
        expect(wrapper.find(TableRowColumn).at(3).find(NotificationSync)).toHaveLength(1);
    });

    it('getOwnerText should return "My DataPack" if run user and logged in user match, else return run user',() => {
        let props = getProps();
        props.run.user = 'admin';
        const wrapper = shallow(<DataPackTableItem {...props}/>);
        let text = wrapper.instance().getOwnerText(run, 'not the admin user');
        expect(text).toEqual('admin');
        text = wrapper.instance().getOwnerText(run, 'admin');
        expect(text).toEqual('My DataPack');
    });

    it('getPermissionsIcon should return either Group or Person', () => {
        let props = getProps();
        const wrapper = shallow(<DataPackTableItem {...props}/>);
        let icon = wrapper.instance().getPermissionsIcon(true);
        expect(icon).toEqual(<SocialGroup className={'qa-DataPackTableItem-SocialGroup'} style={{color: 'bcdfbb'}}/>);
        icon = wrapper.instance().getPermissionsIcon(false);
        expect(icon).toEqual(<SocialPerson className={'qa-DataPackTableItem-SocialPerson'} style={{color: 'grey'}}/>);
    });

    it('getStatusIcon should return either a Sync, Error, or Check icon depending on job status', () => {
        let props = getProps();
        const wrapper = shallow(<DataPackTableItem {...props}/>);
        let icon = wrapper.instance().getStatusIcon('SUBMITTED');
        expect(icon).toEqual(<NotificationSync className={'qa-DataPackTableItem-NotificationSync'} style={{color: '#f4d225'}}/>);
        icon = wrapper.instance().getStatusIcon('INCOMPLETE');
        expect(icon).toEqual(<AlertError className={'qa-DataPackTableItem-AlertError'} style={{color: '#ce4427', opacity: '0.6', height: '22px'}}/>);
        icon = wrapper.instance().getStatusIcon('COMPLETED');
        expect(icon).toEqual(<NavigationCheck className={'qa-DataPackTableItem-NavigationCheck'} style={{color: '#bcdfbb', height: '22px'}}/>)
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        let props = getProps();
        const wrapper = shallow(<DataPackTableItem {...props}/>);
        const stateSpy = new sinon.spy(DataPackTableItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providerDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleProviderOpen should set provider dialog to open', () => {
        let props = getProps();
        const wrapper = shallow(<DataPackTableItem {...props}/>);
        const stateSpy = new sinon.spy(DataPackTableItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderOpen(props.run.provider_tasks);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providerDescs:{"OpenStreetMap Data (Themes)":"OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...)."}, providerDialogOpen: true})).toBe(true);
        stateSpy.restore();
    });

    it('showDeleteDialog should set deleteDialogOpen to true', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackTableItem {...props}/>);
        const stateSpy = new sinon.spy(DataPackTableItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().showDeleteDialog();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({deleteDialogOpen: true}));
        stateSpy.restore();
    });

    it('hideDeleteDialog should set deleteDialogOpen to false', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackTableItem {...props}/>);
        const stateSpy = new sinon.spy(DataPackTableItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().hideDeleteDialog();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({deleteDialogOpen: false}));
        stateSpy.restore();
    });

    it('handleDelete should call hideDelete and onRunDelete', () => {
        const props = getProps();
        props.onRunDelete = new sinon.spy();
        const hideSpy = new sinon.spy(DataPackTableItem.prototype, 'hideDeleteDialog');
        const wrapper = shallow(<DataPackTableItem {...props}/>);
        expect(props.onRunDelete.called).toBe(false);
        expect(hideSpy.called).toBe(false);
        wrapper.instance().handleDelete();
        expect(hideSpy.calledOnce).toBe(true);
        expect(props.onRunDelete.calledOnce).toBe(true);
        expect(props.onRunDelete.calledWith(props.run.uid)).toBe(true);
    });
});
const providers = [
    {
        "id": 2,
        "model_url": "http://cloud.eventkit.test/api/providers/osm",
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
]

const tasks = [
    {
        "duration": "0:00:15.317672",
        "errors": [],
        "estimated_finish": "",
        "finished_at": "2017-05-15T15:29:04.356182Z",
        "name": "OverpassQuery",
        "progress": 100,
        "started_at": "2017-05-15T15:28:49.038510Z",
        "status": "SUCCESS",
        "uid": "fcfcd526-8949-4c26-a669-a2cf6bae1e34",
        "result": {
            "size": "1.234 MB",
            "url": "http://cloud.eventkit.test/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
        },
        "display": true,
    }
];

const providerTasks = [{
    "name": "OpenStreetMap Data (Themes)",
    "status": "COMPLETED",
    "display": true,
    "slug": "osm",
    "tasks": tasks,
    "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
    "url": "http://cloud.eventkit.test/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04"
}];
const run = {
        "uid": "6870234f-d876-467c-a332-65fdf0399a0d",
        "url": "http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d",
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
            "url": "http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a",
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
        "provider_tasks": providerTasks,
        "zipfile_url": "http://cloud.eventkit.test/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:35.637258Z"
    }
