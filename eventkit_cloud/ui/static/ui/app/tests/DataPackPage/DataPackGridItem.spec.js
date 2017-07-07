import React from 'react';
import sinon from 'sinon';
import {shallow, mount} from 'enzyme';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import {DataPackGridItem} from '../../components/DataPackPage/DataPackGridItem';
import IconButton from 'material-ui/IconButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Card, CardActions, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPerson from 'material-ui/svg-icons/social/person';

beforeAll(() => {
    DataPackGridItem.prototype.initMap = new sinon.spy();
});

afterAll(() => {
    DataPackGridItem.prototype.initMap.restore();
});

describe('DataPackGridItem component', () => {
    injectTapEventPlugin();

    const muiTheme = getMuiTheme();
    const user = {data: {user: {username: 'admin'}}};

    it('should display general run information', () => {
        const props = {run: getRuns()[0], user: user, onRunDelete: () => {}};
        const wrapper = mount(<DataPackGridItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardTitle)).toHaveLength(1);
        expect(wrapper.find(CardTitle).find('span').first()
            .childAt(0).childAt(0).text()).toEqual('Test1');
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(IconButton).find(NavigationMoreVert)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        const subtitle = wrapper.find(CardTitle).childAt(1).childAt(0);
        expect(subtitle.find('span').first().text()).toEqual('Event: Test1 event');
        expect(subtitle.find('span').at(1).text()).toEqual('Added: 2017-03-10');
        expect(subtitle.find('span').at(2).text()).toEqual('Expires: 2017-03-24');
        expect(wrapper.find(CardText)).toHaveLength(1);
        expect(wrapper.find(CardText).find('span').text()).toEqual('Test1 description');
        expect(wrapper.find(CardMedia)).toHaveLength(1);
        expect(wrapper.find(CardActions)).toHaveLength(1);
    });

    it('should set the card to expanded when component has mounted', () => {
        const props = {run: getRuns()[0], user: user, onRunDelete: () => {}};
        const mountSpy = new sinon.spy(DataPackGridItem.prototype, 'componentDidMount');
        const stateSpy = new sinon.spy(DataPackGridItem.prototype, 'setState');
        const wrapper = mount(<DataPackGridItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(mountSpy.calledOnce).toBe(true);
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({expanded: true})).toBe(true);
        mountSpy.restore();
        stateSpy.restore();
    });

    it('should display information specific to a unpublished & owned run', () => {
        const props = {run: getRuns()[0], user: user, onRunDelete: () => {}};
        const wrapper = mount(<DataPackGridItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(SocialPerson)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').text()).toEqual('My DataPack');
    });

    it('should display information specific to a published & owned run', () => {
        const props = {run: getRuns()[2], user: user, onRunDelete: () => {}};
        const wrapper = mount(<DataPackGridItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').text()).toEqual('My DataPack');
    });

    it('should display information specific to a published & not owned run', () => {
        const props = {run: getRuns()[1], user: user, onRunDelete: () => {}};
        const wrapper = mount(<DataPackGridItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').text()).toEqual('notAdmin');
    });

    it('should not display a map when the card is not expanded', () => {
        const props = {run: getRuns()[0], user: user, onRunDelete: () => {}};
        const uid = props.run.uid;
        const wrapper = mount(<DataPackGridItem {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const updateSpy = new sinon.spy(DataPackGridItem.prototype, 'componentDidUpdate');
        wrapper.instance().initMap = sinon.spy();
        expect(wrapper.find('#' + uid + '_map')).toHaveLength(1);
        wrapper.setState({expanded: false});
        expect(wrapper.find(CardMedia)).toHaveLength(0);        
        expect(updateSpy.called).toBe(true);
        expect(wrapper.instance().initMap.called).toBe(false);
        expect(wrapper.find('#' + uid + '_map')).toHaveLength(0);
        updateSpy.restore();
    });

    it('getTitleFontSize should return the font string for title based on window width', () => {
        const props = {run: getRuns()[0], user: user, onRunDelete: () => {}};
        const wrapper = shallow(<DataPackGridItem {...props}/>);

        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getTitleFontSize()).toEqual('20px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getTitleFontSize()).toEqual('21px');
        
        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getTitleFontSize()).toEqual('22px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getTitleFontSize()).toEqual('23px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getTitleFontSize()).toEqual('24px');
    });

    it('getCardTextFontSize should return the font string for cardText based on window width', () => {
        const props = {run: getRuns()[0], user: user, onRunDelete: () => {}};
        const wrapper = shallow(<DataPackGridItem {...props}/>);
        
        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getCardTextFontSize()).toEqual('10px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getCardTextFontSize()).toEqual('11px');
        
        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getCardTextFontSize()).toEqual('12px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getCardTextFontSize()).toEqual('13px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getCardTextFontSize()).toEqual('14px');
    });

    it('handleExpandChange should set expanded to the passed in state', () => {
        const props = {run: getRuns()[0], user: user, onRunDelete: () => {}};
        const wrapper = shallow(<DataPackGridItem {...props}/>);
        const stateSpy = new sinon.spy(DataPackGridItem.prototype, 'setState');
        wrapper.instance().handleExpandChange(false);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({expanded: false})).toBe(true);
        stateSpy.restore();
    });

    it('toggleExpanded should set expanded state to its negatation', () => {
        const props = {run: getRuns()[0], user: user, onRunDelete: () => {}};
        const wrapper = shallow(<DataPackGridItem {...props}/>);
        expect(wrapper.state().expanded).toBe(false);
        const stateSpy = new sinon.spy(DataPackGridItem.prototype, 'setState');
        wrapper.instance().toggleExpanded();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({expanded: true})).toBe(true);
        stateSpy.restore();
    })
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
