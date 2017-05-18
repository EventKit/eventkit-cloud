import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DataCartDetails} from '../../components/StatusDownloadPage/DataCartDetails';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import '../../components/tap_events'

describe('DataCartDetails component', () => {

    const muiTheme = getMuiTheme();
    const providers = [
        {
            "name": "OpenStreetMap Data (Generic)",
            "status": "COMPLETED",
            "tasks": [
                {
                    "duration": "0:00:15.317672",
                    "errors": [],
                    "estimated_finish": "",
                    "finished_at": "2017-05-15T15:29:04.356182Z",
                    "name": "OverpassQuery",
                    "progress": 100,
                    "result": {},
                    "started_at": "2017-05-15T15:28:49.038510Z",
                    "status": "SUCCESS",
                    "uid": "fcfcd526-8949-4c26-a669-a2cf6bae1e34",
                    "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
                }
            ],
            "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
            "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04"
        }];

    const exampleRun = {
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
        };

    const getProps = () => {
        return  {
            cartDetails: {
                uid: "6870234f-d876-467c-a332-65fdf0399a0d",
                url: "http://cloud.eventkit.dev/api/runs/6870234f-d876-467c-a332-65fdf0399a0d",
                started_at: "2017-03-10T15:52:35.637331Z",
                finished_at: "2017-03-10T15:52:39.837Z",
                duration: "0:00:04.199825",
                user: "admin",
                status: "COMPLETED",
                job: exampleRun,
                provider_tasks: [{'provider': providers[0]}],
                zipfile_url: "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
                expiration: "2017-03-24T15:52:35.637258Z"
            },
            onRunDelete: () => {},
            onRunRerun: () => {},
            onClone: () => {},
            }
    };
    const getNextProps = () => {
        return  {
            cartDetails: {
                data: [{
                    uid: "6870234f-d876-467c-a332-65fdf0399a0d",
                    url: "http://cloud.eventkit.dev/api/runs/6870234f-d876-467c-a332-65fdf0399a0d",
                    started_at: "2017-03-10T15:52:35.637331Z",
                    finished_at: "2017-03-10T15:52:39.837Z",
                    duration: "0:00:04.199825",
                    user: "admin",
                    status: "COMPLETED",
                    job: exampleRun,
                    provider_tasks: [{'provider': providers[0]}],
                    zipfile_url: "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
                    expiration: "2017-03-24T15:52:35.637258Z"
                }]
            },
        }
    };

    const getWrapper = (props) => {
        return mount(<DataCartDetails {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    }
    it('should render elements', () => {
        let props = getProps();
        let mapSpy = new sinon.spy(DataCartDetails.prototype, '_initializeOpenLayers');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(wrapper.find(RaisedButton)).toHaveLength(3);
        expect(wrapper.find(Dialog)).toHaveLength(3);
        expect(wrapper.find('.subHeading')).toHaveLength(4);
        mapSpy.restore();
    });

    it('should display a dialog when the ReRun button is clicked', () => {
        const props = getProps();
        let mapSpy = new sinon.spy(DataCartDetails.prototype, '_initializeOpenLayers');
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleRerunOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({rerunDialogOpen: true})).toBe(true);
        stateSpy.restore();
        mapSpy.restore();
    });

    it('should display a dialog when the Clone button is clicked', () => {
        const props = getProps();
        let mapSpy = new sinon.spy(DataCartDetails.prototype, '_initializeOpenLayers');
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleCloneOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({cloneDialogOpen: true})).toBe(true);
        stateSpy.restore();
        mapSpy.restore();
    });

    it('should display a dialog when the Delete button is clicked', () => {
        const props = getProps();
        let mapSpy = new sinon.spy(DataCartDetails.prototype, '_initializeOpenLayers');
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleDeleteOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({deleteDialogOpen: true})).toBe(true);
        stateSpy.restore();
        mapSpy.restore();
    });

    it('should hide the ReRun dialog when the cancel button is clicked', () => {
        const props = getProps();
        let mapSpy = new sinon.spy(DataCartDetails.prototype, '_initializeOpenLayers');
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleRerunClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({rerunDialogOpen: false})).toBe(true);
        stateSpy.restore();
        mapSpy.restore();
    });

    it('should hide the Clone dialog when the cancel button is clicked', () => {
        const props = getProps();
        let mapSpy = new sinon.spy(DataCartDetails.prototype, '_initializeOpenLayers');
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleCloneClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({cloneDialogOpen: false})).toBe(true);
        stateSpy.restore();
        mapSpy.restore();
    });

    it('should hide the Delete dialog when the cancel button is clicked', () => {
        const props = getProps();
        DataCartDetails.prototype._initializeOpenLayers = new sinon.spy();
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleDeleteClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({deleteDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleClone should clone a job with the correct data', () => {
        let props = getProps();
        DataCartDetails.prototype._initializeOpenLayers = new sinon.spy();
        props.onClone = new sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        wrapper.instance().handleClone();
        expect(props.onClone.calledOnce).toBe(true);
        //expect(props.onClone.calledWith(props.cartDetails, providerArray)).toBe(true);

    });

    it('handleReRun should reRun a job with the correct data', () => {
        let props = getProps();
        DataCartDetails.prototype._initializeOpenLayers = new sinon.spy();
        props.onRunRerun = new sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        wrapper.instance().handleRerun();
        expect(props.onRunRerun.calledOnce).toBe(true);
        expect(props.onRunRerun.calledWith("7643f806-1484-4446-b498-7ddaa65d011a")).toBe(true);

    });

    it('handleDelete should delete a job', () => {
        let props = getProps();
        DataCartDetails.prototype._initializeOpenLayers = new sinon.spy();
        props.onRunDelete = new sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        wrapper.instance().handleDelete();
        expect(props.onRunDelete.calledOnce).toBe(true);
        expect(props.onRunDelete.calledWith("6870234f-d876-467c-a332-65fdf0399a0d")).toBe(true);
    });

    it('_setTableColors should set the state for table color ', () =>{
        let props = getProps();
        DataCartDetails.prototype._initializeOpenLayers = new sinon.spy();
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        const setColorSpy = new sinon.spy(DataCartDetails.prototype, '_setTableColors');
        expect(stateSpy.called).toBe(false);
        wrapper.instance()._setTableColors();
        expect(setColorSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)',statusFontColor: '#55ba63',})).toBe(true);
        setColorSpy.restore();
        stateSpy.restore();
    })

    it('should handle set of colors when props change', () => {
        const props = getProps();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        let nextProps = getProps();
        nextProps.cartDetails.status = "INCOMPLETE";
        const propsSpy = new sinon.spy(DataCartDetails.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)',statusFontColor: '#ce4427',})).toBe(true);
        DataCartDetails.prototype.setState.restore();
        DataCartDetails.prototype.componentWillReceiveProps.restore();
    });
    it('should handle setting state of datacartDetails when component updates', () => {
        const props = getProps();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        let nextProps = getNextProps();
        nextProps.cartDetails.fetched = true;
        nextProps.cartDetails.data = exampleRun;
        const propsSpy = new sinon.spy(DataCartDetails.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.setProps(nextProps.cartDetails.data);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        DataCartDetails.prototype.setState.restore();
        DataCartDetails.prototype.componentWillReceiveProps.restore();
    });
});

