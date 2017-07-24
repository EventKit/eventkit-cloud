import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DataCartDetails} from '../../components/StatusDownloadPage/DataCartDetails';
import DataPackDetails from '../../components/StatusDownloadPage/DataPackDetails';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import '../../components/tap_events'

describe('DataCartDetails component', () => {

    beforeAll(() => {
        DataCartDetails.prototype._initializeOpenLayers = new sinon.spy();
    });

    afterAll(() => {
        DataCartDetails.prototype._initializeOpenLayers.restore();
    });
    const muiTheme = getMuiTheme();

    const getProps = () => {
        return  {
            cartDetails: {...run},
            onRunDelete: () => {},
            onRunRerun: () => {},
            onClone: () => {},
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
        const wrapper = getWrapper(props);
        expect(wrapper.find(RaisedButton)).toHaveLength(4);
        expect(wrapper.find(Dialog)).toHaveLength(3);
        let table = wrapper.find('table').at(0);
        expect(table.find('tr').first().find('td').first().text()).toEqual('Name');
        expect(table.find('tr').first().find('td').last().text()).toEqual('test');
        expect(table.find('tr').last().find('td').first().text()).toEqual('Status');
        expect(table.find('tr').last().find('td').last().text()).toEqual('COMPLETED');
        expect(wrapper.find(DataPackDetails)).toHaveLength(1);
        expect(wrapper.find(RaisedButton).at(1).text()).toEqual('RUN EXPORT AGAIN');
        expect(wrapper.find(RaisedButton).at(2).text()).toEqual('CLONE');
        expect(wrapper.find(RaisedButton).at(3).text()).toEqual('DELETE');
        table = wrapper.find('table').at(5);
        expect(table.find('tr').at(0).find('td').first().text()).toEqual('Description');
        expect(table.find('tr').at(0).find('td').last().text()).toEqual('test');
        expect(table.find('tr').at(1).find('td').first().text()).toEqual('Project/Category');
        expect(table.find('tr').at(1).find('td').last().text()).toEqual('test');
        expect(table.find('tr').at(2).find('td').first().text()).toEqual('Published');
        expect(table.find('tr').at(2).find('td').last().text()).toEqual('true');
        expect(table.find('tr').at(3).find('td').first().text()).toEqual('Data Sources');
        expect(table.find('tr').at(3).find('td').last().text()).toEqual('OpenStreetMap Data (Themes)');
        expect(table.find('tr').at(4).find('td').first().text()).toEqual('File Formats');
        expect(table.find('tr').at(4).find('td').last().text()).toEqual('.gpkg');
        expect(table.find('tr').at(5).find('td').first().text()).toEqual('Projection');
        expect(table.find('tr').at(5).find('td').last().text()).toEqual('EPSG:4326 - World Geodetic System 1984 (WGS84)');
        expect(wrapper.find('#summaryMap')).toHaveLength(1);
        table = wrapper.find('table').at(6);
        expect(table.find('tr').at(0).find('td').first().text()).toEqual('Run By');
        expect(table.find('tr').at(0).find('td').last().text()).toEqual('admin');
        expect(table.find('tr').at(1).find('td').first().text()).toEqual('Run Id');
        expect(table.find('tr').at(1).find('td').last().text()).toEqual('29f5cbab-09d8-4d6c-9505-438967062964');
        expect(table.find('tr').at(2).find('td').first().text()).toEqual('Started');
        expect(table.find('tr').at(2).find('td').last().text()).toEqual('6:35:01 pm, May 22nd 2017');
        expect(table.find('tr').at(3).find('td').first().text()).toEqual('Finished');
        expect(table.find('tr').at(3).find('td').last().text()).toEqual('6:35:22 pm, May 22nd 2017');
    });

    it('should only render "Finished" table data if run has finished', () => {
        let props = getProps();
        props.cartDetails.finished_at = "";
        const wrapper = getWrapper(props);
        let table = wrapper.find('table').at(6);
        expect(table.find('tr')).toHaveLength(3);
        const nextProps = getProps();
        wrapper.setProps(nextProps);
        table = wrapper.find('table').at(6);
        expect(table.find('tr')).toHaveLength(4);
        expect(table.find('tr').at(3).find('td').first().text()).toEqual('Finished');
        expect(table.find('tr').at(3).find('td').last().text()).toEqual('6:35:22 pm, May 22nd 2017');
    });

    it('should handle setting state of datacartDetails when component updates', () => {
        let props = getProps();
        props.cartDetails.status = 'SUBMITTED';
        const wrapper = shallow(<DataCartDetails {...props}/>);
        let nextProps = getProps();
        nextProps.cartDetails.status = "COMPLETED";
        const propsSpy = new sinon.spy(DataCartDetails.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)', statusFontColor: '#55ba63'})).toBe(true);

        nextProps = getProps();
        nextProps.cartDetails.status = 'INCOMPLETE';
        wrapper.setProps(nextProps);
        expect(propsSpy.calledTwice).toBe(true);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)', statusFontColor: '#ce4427'})).toBe(true);

        nextProps = getProps();
        nextProps.cartDetails.status = 'SUBMITTED';
        wrapper.setProps(nextProps);
        expect(propsSpy.calledThrice).toBe(true);
        expect(stateSpy.calledThrice).toBe(true);
        expect(stateSpy.calledWith({status: 'SUBMITTED', statusBackgroundColor: 'rgba(250,233,173, 0.4)', statusFontColor: '#f4d225'})).toBe(true);
        
        nextProps = getProps();
        nextProps.cartDetails.status = 'INVALID';
        wrapper.setProps(nextProps);
        expect(propsSpy.callCount).toEqual(4);
        expect(stateSpy.callCount).toEqual(4);
        expect(stateSpy.calledWith({status: '', statusBackgroundColor: '#f8f8f8', statusFontColor: '#8b9396'})).toBe(true);

        stateSpy.restore();
        propsSpy.restore();
    });

    it('should call initializeOpenLayers and _setTableColors on mount', () => {
        const props = getProps();
        const mountSpy = new sinon.spy(DataCartDetails.prototype, 'componentDidMount');
        const colorsSpy = new sinon.spy(DataCartDetails.prototype, '_setTableColors');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(colorsSpy.calledOnce).toBe(true);
        expect(DataCartDetails.prototype._initializeOpenLayers.called).toBe(true);
        mountSpy.restore();
        colorsSpy.restore();
    });

    it('_setTableColors should set the state for table color ', () => {
        const props = getProps();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance()._setTableColors();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)',statusFontColor: '#55ba63'})).toBe(true);

        let nextProps = getProps();
        nextProps.cartDetails.status = 'SUBMITTED';
        wrapper.setProps(nextProps);
        wrapper.instance()._setTableColors();
        expect(stateSpy.calledWith({status: 'SUBMITTED', statusBackgroundColor: 'rgba(250,233,173, 0.4)', statusFontColor: '#f4d225'})).toBe(true);

        nextProps = getProps();
        nextProps.cartDetails.status = 'INCOMPLETE';
        wrapper.setProps(nextProps);
        wrapper.instance()._setTableColors();
        expect(stateSpy.calledWith({status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)', statusFontColor: '#ce4427'}));

        nextProps = getProps();
        nextProps.cartDetails.status = 'INVALID';
        wrapper.setProps(nextProps);
        wrapper.instance()._setTableColors();
        expect(stateSpy.calledWith({status: '', statusBackgroundColor: '#f8f8f8', statusFontColor: '#8b9396'})).toBe(true);

        stateSpy.restore();
    });

    it('handleRerunOpen should set rerun dialog to open', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleRerunOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({rerunDialogOpen: true})).toBe(true);
        stateSpy.restore();
    });

    it('handleCloneOpen should set clone dialog to open', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleCloneOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({cloneDialogOpen: true})).toBe(true);
        stateSpy.restore();
    });

    it('handleDeleteOpen should set the delete dialog to open', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleDeleteOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({deleteDialogOpen: true})).toBe(true);
        stateSpy.restore();
    });

    it('handleRerunClose should set the rerun dialog to closed', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleRerunClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({rerunDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleCloneClose should set the clone dialog to closed', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleCloneClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({cloneDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleDeleteClose should set the delete dialog to closed', () => {
        const props = getProps();
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
        props.onClone = new sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.instance().handleClone();
        expect(props.onClone.calledOnce).toBe(true);
        expect(props.onClone.calledWith(props.cartDetails, providerArray)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({cloneDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleReRun should reRun a run with the correct data', () => {
        let props = getProps();
        props.onRunRerun = new sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.instance().handleRerun();
        expect(props.onRunRerun.calledOnce).toBe(true);
        expect(props.onRunRerun.calledWith("7838d3b3-160a-4e7d-89cb-91fdcd6eab43")).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({rerunDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });

    it('handleDelete should delete a job', () => {
        let props = getProps();
        props.onRunDelete = new sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props}/>);
        const stateSpy = new sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.instance().handleDelete();
        expect(props.onRunDelete.calledOnce).toBe(true);
        expect(props.onRunDelete.calledWith("29f5cbab-09d8-4d6c-9505-438967062964")).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({deleteDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });
});

const providerArray = [
    {
        "display": true,
        "uid": "ac7fc0d4-45e3-4575-8b1e-a74256dc003e",
        "url": "http://cloud.eventkit.dev/api/provider_tasks/ac7fc0d4-45e3-4575-8b1e-a74256dc003e",
        "name": "OpenStreetMap Data (Themes)",
        "tasks": [
            {
                "uid": "ad70aa01-a3da-451d-bd6f-0038409d5fd8",
                "url": "http://cloud.eventkit.dev/api/tasks/ad70aa01-a3da-451d-bd6f-0038409d5fd8",
                "name": "Geopackage Format (OSM)",
                "status": "SUCCESS",
                "progress": 100,
                "estimated_finish": null,
                "started_at": "2017-05-22T18:35:14.358028Z",
                "finished_at": "2017-05-22T18:35:17.998336Z",
                "duration": "0:00:03.640308",
                "result": {
                    "filename": "test.gpkg",
                    "size": "0.218 MB",
                    "url": "https://cloud.eventkit.dev/29f5cbab-09d8-4d6c-9505-438967062964/test-osm-20170522.gpkg"
                },
                "display": true,
                "errors": []
            },
            {
                "uid": "00cef7ac-e999-4ea1-a28c-2ddeb669808e",
                "url": "http://cloud.eventkit.dev/api/tasks/00cef7ac-e999-4ea1-a28c-2ddeb669808e",
                "name": "Create Styles",
                "status": "SUCCESS",
                "progress": 100,
                "estimated_finish": null,
                "started_at": "2017-05-22T18:35:19.175764Z",
                "finished_at": "2017-05-22T18:35:19.297181Z",
                "duration": "0:00:00.121417",
                "result": {
                    "filename": "test-osm-20170522.qgs",
                    "size": "0.557 MB",
                    "url": "https://cloud.eventkit.dev/29f5cbab-09d8-4d6c-9505-438967062964/test-osm-20170522-osm-20170522.qgs"
                },
                "display": true,
                "errors": []
            },
            {
                "uid": "0beddde8-6f3b-4137-a673-1ea759c63f0f",
                "url": "http://cloud.eventkit.dev/api/tasks/0beddde8-6f3b-4137-a673-1ea759c63f0f",
                "name": "Create Selection GeoJSON",
                "status": "SUCCESS",
                "progress": 100,
                "estimated_finish": null,
                "started_at": "2017-05-22T18:35:13.675901Z",
                "finished_at": "2017-05-22T18:35:13.713273Z",
                "duration": "0:00:00.037372",
                "result": {
                    "filename": "osm_selection.geojson",
                    "size": "0.000 MB",
                    "url": "https://cloud.eventkit.dev/29f5cbab-09d8-4d6c-9505-438967062964/osm_selection-osm-20170522.geojson"
                },
                "display": true,
                "errors": []
            },
            {
                "uid": "8adbb9e4-f66a-4bec-8377-259097440c1b",
                "url": "http://cloud.eventkit.dev/api/tasks/8adbb9e4-f66a-4bec-8377-259097440c1b",
                "name": "Bounds Export",
                "status": "SUCCESS",
                "progress": 100,
                "estimated_finish": null,
                "started_at": "2017-05-22T18:35:21.041452Z",
                "finished_at": "2017-05-22T18:35:21.207650Z",
                "duration": "0:00:00.166198",
                "result": {
                    "filename": "osm_bounds.gpkg",
                    "size": "0.042 MB",
                    "url": "https://cloud.eventkit.dev/29f5cbab-09d8-4d6c-9505-438967062964/osm_bounds-osm-20170522.gpkg"
                },
                "display": true,
                "errors": []
            }
        ],
        "status": "COMPLETED"
    }
]

const run = {
    "uid": "29f5cbab-09d8-4d6c-9505-438967062964",
    "url": "http://cloud.eventkit.dev/api/runs/29f5cbab-09d8-4d6c-9505-438967062964",
    "started_at": "2017-05-22T18:35:01.400756Z",
    "finished_at": "2017-05-22T18:35:22.292006Z",
    "duration": "0:00:20.891250",
    "user": "admin",
    "status": "COMPLETED",
    "job": {
        "uid": "7838d3b3-160a-4e7d-89cb-91fdcd6eab43",
        "name": "test",
        "event": "test",
        "description": "test",
        "url": "http://cloud.eventkit.dev/api/jobs/7838d3b3-160a-4e7d-89cb-91fdcd6eab43",
        "extent": {
            "type": "Feature",
            "properties": {
                "uid": "7838d3b3-160a-4e7d-89cb-91fdcd6eab43",
                "name": "test"
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                    [
                        [
                            [
                                -64.18223844746079,
                                10.45503426983764
                            ],
                            [
                                -64.1676421508845,
                                10.45503426983764
                            ],
                            [
                                -64.1676421508845,
                                10.464494014225664
                            ],
                            [
                                -64.18223844746079,
                                10.464494014225664
                            ],
                            [
                                -64.18223844746079,
                                10.45503426983764
                            ]
                        ]
                    ]
                ]
            }
        },
        "published": true
    },
    "provider_tasks": [
        {
            "display": true,
            "uid": "ac7fc0d4-45e3-4575-8b1e-a74256dc003e",
            "url": "http://cloud.eventkit.dev/api/provider_tasks/ac7fc0d4-45e3-4575-8b1e-a74256dc003e",
            "name": "OpenStreetMap Data (Themes)",
            "tasks": [
                {
                    "uid": "ad70aa01-a3da-451d-bd6f-0038409d5fd8",
                    "url": "http://cloud.eventkit.dev/api/tasks/ad70aa01-a3da-451d-bd6f-0038409d5fd8",
                    "name": "Geopackage Format (OSM)",
                    "status": "SUCCESS",
                    "progress": 100,
                    "estimated_finish": null,
                    "started_at": "2017-05-22T18:35:14.358028Z",
                    "finished_at": "2017-05-22T18:35:17.998336Z",
                    "duration": "0:00:03.640308",
                    "result": {
                        "filename": "test.gpkg",
                        "size": "0.218 MB",
                        "url": "https://cloud.eventkit.dev/29f5cbab-09d8-4d6c-9505-438967062964/test-osm-20170522.gpkg"
                    },
                    "display": true,
                    "errors": []
                },
                {
                    "uid": "00cef7ac-e999-4ea1-a28c-2ddeb669808e",
                    "url": "http://cloud.eventkit.dev/api/tasks/00cef7ac-e999-4ea1-a28c-2ddeb669808e",
                    "name": "Create Styles",
                    "status": "SUCCESS",
                    "progress": 100,
                    "estimated_finish": null,
                    "started_at": "2017-05-22T18:35:19.175764Z",
                    "finished_at": "2017-05-22T18:35:19.297181Z",
                    "duration": "0:00:00.121417",
                    "result": {
                        "filename": "test-osm-20170522.qgs",
                        "size": "0.557 MB",
                        "url": "https://cloud.eventkit.dev/29f5cbab-09d8-4d6c-9505-438967062964/test-osm-20170522-osm-20170522.qgs"
                    },
                    "display": true,
                    "errors": []
                },
                {
                    "uid": "0beddde8-6f3b-4137-a673-1ea759c63f0f",
                    "url": "http://cloud.eventkit.dev/api/tasks/0beddde8-6f3b-4137-a673-1ea759c63f0f",
                    "name": "Create Selection GeoJSON",
                    "status": "SUCCESS",
                    "progress": 100,
                    "estimated_finish": null,
                    "started_at": "2017-05-22T18:35:13.675901Z",
                    "finished_at": "2017-05-22T18:35:13.713273Z",
                    "duration": "0:00:00.037372",
                    "result": {
                        "filename": "osm_selection.geojson",
                        "size": "0.000 MB",
                        "url": "https://cloud.eventkit.dev/29f5cbab-09d8-4d6c-9505-438967062964/osm_selection-osm-20170522.geojson"
                    },
                    "display": true,
                    "errors": []
                },
                {
                    "uid": "8adbb9e4-f66a-4bec-8377-259097440c1b",
                    "url": "http://cloud.eventkit.dev/api/tasks/8adbb9e4-f66a-4bec-8377-259097440c1b",
                    "name": "Bounds Export",
                    "status": "SUCCESS",
                    "progress": 100,
                    "estimated_finish": null,
                    "started_at": "2017-05-22T18:35:21.041452Z",
                    "finished_at": "2017-05-22T18:35:21.207650Z",
                    "duration": "0:00:00.166198",
                    "result": {
                        "filename": "osm_bounds.gpkg",
                        "size": "0.042 MB",
                        "url": "https://cloud.eventkit.dev/29f5cbab-09d8-4d6c-9505-438967062964/osm_bounds-osm-20170522.gpkg"
                    },
                    "display": true,
                    "errors": []
                }
            ],
            "status": "COMPLETED"
        }
    ],
    "zipfile_url": null,
    "expiration": "2017-06-05T18:35:01.400407Z"
}
