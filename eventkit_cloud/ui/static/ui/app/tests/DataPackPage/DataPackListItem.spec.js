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
            user: {data: {username: 'admin'}},
            onRunDelete: () => {},
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
        expect(wrapper.find(Link).props().to).toEqual('/exports/' + props.run.uid);
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

    it('should change font sizes depending on the screensize', () => {
        let props = getProps();
        const wrapper = mount(<DataPackListItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        // default window width is 1024
        expect(wrapper.state().deviceSize).toEqual('s');
        const stateSpy = new sinon.spy(DataPackListItem.prototype, 'setState');
        window.resizeTo(500,800);
        expect(window.innerWidth).toEqual(500);
        const updateSpy = new sinon.spy(DataPackListItem.prototype, 'componentWillUpdate');
        wrapper.update();
        expect(updateSpy.called).toBe(true);
        expect(updateSpy.calledThrice).toBe(true);
        expect(stateSpy.calledWith({deviceSize: 'xs'})).toBe(true);
        expect(wrapper.state().deviceSize).toEqual('xs');
        window.resizeTo(1200, 800);
        expect(window.innerWidth).toEqual(1200);
        wrapper.update();
        expect(updateSpy.callCount).toEqual(6);
        expect(stateSpy.calledWith({deviceSize: 's'})).toBe(true);
        expect(wrapper.state().deviceSize).toEqual('s');
        stateSpy.restore();
        updateSpy.restore();
    });
    
});

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
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:35.637258Z"
    }
