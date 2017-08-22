import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Link} from 'react-router';
import {Card, CardTitle} from 'material-ui/Card'
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPerson from 'material-ui/svg-icons/social/person';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import AlertError from 'material-ui/svg-icons/alert/error';
import DataPackListItem from '../../components/DataPackPage/DataPackListItem';

describe('DataPackListItem component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    const getProps = () => {
        return {
            run: run,
            user: {data: {user: {username: 'admin'}}},
            onRunDelete: () => {},
            providers: providers,
        }
    }

    it('should render a list item with complete and private icons and owner text', () => {
        const props = getProps();
        const wrapper = mount(<DataPackListItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(Link)).toHaveLength(1);
        expect(wrapper.find(Link).props().to).toEqual('/status/' + props.run.job.uid);
        expect(wrapper.find(CardTitle)).toHaveLength(1);
        const cardText = wrapper.find(CardTitle).text();
        expect(cardText).toContain('Test1');
        expect(cardText).toContain('Event: Test1 event');
        expect(cardText).toContain('Added: 2017-03-10');
        expect(cardText).toContain('My DataPack');
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(NavigationMoreVert)).toHaveLength(1);
        expect(wrapper.find(NavigationCheck)).toHaveLength(1);
        expect(wrapper.find(SocialPerson)).toHaveLength(1);
    });

    it('should update when the run properties change', () => {
        let props = getProps();
        const wrapper = mount(<DataPackListItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        props.run.started_at = "2017-04-11T15:52:35.637331Z";
        wrapper.setProps(props);
        expect(wrapper.find(CardTitle).text()).toContain('Added: 2017-04-11');
        props.run.job.name = 'jobby job';
        wrapper.setProps(props);
        expect(wrapper.find(CardTitle).text()).toContain('jobby job');
        props.run.job.event = 'new event here';
        wrapper.setProps(props);
        expect(wrapper.find(CardTitle).text()).toContain('Event: new event here');
        props.run.user = "not admin";
        wrapper.setProps(props);
        expect(wrapper.find(CardTitle).text()).not.toContain('My DataPack');
        expect(wrapper.find(CardTitle).text()).toContain('not admin');
        props.run.status = "SUBMITTED";
        wrapper.setProps(props);
        expect(wrapper.find(NotificationSync)).toHaveLength(1);
        props.run.status = "INCOMPLETE";
        wrapper.setProps(props);
        expect(wrapper.find(AlertError)).toHaveLength(1);
        props.run.job.published = true;
        wrapper.setProps(props);
        expect(wrapper.find(SocialGroup)).toHaveLength(1);
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        let props = getProps();
        const wrapper = mount(<DataPackListItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const stateSpy = new sinon.spy(DataPackListItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providerDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleProviderOpen should set provider dialog to open', () => {
        let props = getProps();
        const wrapper = mount(<DataPackListItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const stateSpy = new sinon.spy(DataPackListItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderOpen(props.run.provider_tasks);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providerDescs:{"OpenStreetMap Data (Themes)":"OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...)."}, providerDialogOpen: true})).toBe(true);
        stateSpy.restore();
    });
});

const providers = [
    {
        "id": 2,
        "model_url": "http://cloud.eventkit.dev/api/providers/osm",
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
            "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
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
    "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04"
}];

const run = {
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
        "provider_tasks": providerTasks,
        "zipfile_url": "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:35.637258Z"
    }
