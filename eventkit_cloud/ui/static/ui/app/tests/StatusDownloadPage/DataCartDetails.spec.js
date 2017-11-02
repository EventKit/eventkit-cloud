import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import moment from 'moment';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import DropDownMenu from 'material-ui/DropDownMenu';
import Edit from 'material-ui/svg-icons/image/edit';
import DatePicker from 'material-ui/DatePicker';
import { DataCartDetails } from '../../components/StatusDownloadPage/DataCartDetails';
import DataPackDetails from '../../components/StatusDownloadPage/DataPackDetails';
import BaseDialog from '../../components/BaseDialog';

describe('DataCartDetails component', () => {
    injectTapEventPlugin();
    beforeAll(() => {
        DataCartDetails.prototype._initializeOpenLayers = sinon.spy();
    });

    afterAll(() => {
        DataCartDetails.prototype._initializeOpenLayers.restore();
    });
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            cartDetails: { ...run },
            providers,
            maxResetExpirationDays: '30',
            zipFileProp: null,
            onUpdateExpiration: () => {},
            onUpdatePermission: () => {},
            onRunDelete: () => {},
            onRunRerun: () => {},
            onClone: () => {},
            onProviderCancel: () => {},
        }
    );

    const getWrapper = props => (
        mount(<DataCartDetails {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        })
    );

    it('should render elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(RaisedButton)).toHaveLength(4);
        expect(wrapper.find(BaseDialog)).toHaveLength(7);
        let table = wrapper.find('table').at(0);
        expect(table.find('tr').first().find('td').first().text()).toEqual('Name');
        expect(table.find('tr').first().find('td').last().text()).toEqual('test');
        table = wrapper.find('table').at(1);
        expect(table.find('tr').at(0).find('td').first().text()).toEqual('Export');
        expect(table.find('tr').at(0).find('td').last().text()).toEqual('COMPLETED');
        expect(table.find('tr').at(1).find('td').first().text()).toEqual('Expiration');
        expect(wrapper.find(DatePicker)).toHaveLength(1);
        expect(wrapper.find(Edit)).toHaveLength(1);
        expect(table.find('tr').at(1).find('td').last().text()).toEqual('2017-08-01');
        expect(table.find('tr').at(2).find('td').first().text()).toEqual('Permission');
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        expect(table.find('tr').at(2).find('td').last().text()).toEqual('Public');
        expect(wrapper.find(DataPackDetails)).toHaveLength(1);
        expect(wrapper.find(RaisedButton).at(1).text()).toEqual('RUN EXPORT AGAIN');
        expect(wrapper.find(RaisedButton).at(2).text()).toEqual('CLONE');
        expect(wrapper.find(RaisedButton).at(3).text()).toEqual('DELETE');
        table = wrapper.find('table').at(6);
        expect(table.find('tr').at(0).find('td').first().text()).toEqual('Description');
        expect(table.find('tr').at(0).find('td').last().text()).toEqual('test');
        expect(table.find('tr').at(1).find('td').first().text().replace(/\s/g, ' ')).toEqual('Project / Category');
        expect(table.find('tr').at(1).find('td').last().text()).toEqual('test');
        expect(table.find('tr').at(2).find('td').first().text()).toEqual('Data Sources');
        expect(table.find('tr').at(2).find('td').last().text()).toEqual('OpenStreetMap Data (Themes)');
        expect(table.find('tr').at(3).find('td').first().text()).toEqual('File Formats');
        expect(table.find('tr').at(3).find('td').last().text()).toEqual('Geopackage');
        expect(table.find('tr').at(4).find('td').first().text()).toEqual('Projection');
        expect(table.find('tr').at(4).find('td').last().text()).toEqual('EPSG:4326 - World Geodetic System 1984 (WGS84)');
        expect(wrapper.find('#summaryMap')).toHaveLength(1);
        table = wrapper.find('table').at(7);
        expect(table.find('tr').at(0).find('td').first().text()).toEqual('Run By');
        expect(table.find('tr').at(0).find('td').last().text()).toEqual('admin');
        expect(table.find('tr').at(1).find('td').first().text()).toEqual('Run Id');
        expect(table.find('tr').at(1).find('td').last().text()).toEqual('29f5cbab-09d8-4d6c-9505-438967062964');
        expect(table.find('tr').at(2).find('td').first().text()).toEqual('Started');
        expect(table.find('tr').at(2).find('td').last().text()).toEqual('6:35:01 pm, May 22nd 2017');
        expect(table.find('tr').at(3).find('td').first().text()).toEqual('Finished');
        expect(table.find('tr').at(3).find('td').last().text()).toEqual('6:35:22 pm, May 22nd 2017');
    });

    it('should have the correct menu item labels', () => {
        const props = getProps();
        const wrapper = shallow(<DataCartDetails {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, { context: { muiTheme } });
        expect(menu.childAt(1).childAt(0).childAt(0).node.props.primaryText).toEqual('Public');
        expect(menu.childAt(1).childAt(0).childAt(1).node.props.primaryText).toEqual('Private');
    });

    it('should only render "Finished" table data if run has finished', () => {
        const props = getProps();
        props.cartDetails.finished_at = '';
        const wrapper = getWrapper(props);
        let table = wrapper.find('table').at(7);
        expect(table.find('tr')).toHaveLength(3);
        const nextProps = getProps();
        wrapper.setProps(nextProps);
        table = wrapper.find('table').at(7);
        expect(table.find('tr')).toHaveLength(4);
        expect(table.find('tr').at(3).find('td').first().text()).toEqual('Finished');
        expect(table.find('tr').at(3).find('td').last().text()).toEqual('6:35:22 pm, May 22nd 2017');
    });


    it('should handle setting state of datacartDetails when component updates', () => {
        const props = getProps();
        props.cartDetails.status = 'SUBMITTED';
        const wrapper = shallow(<DataCartDetails {...props} />);
        let nextProps = getProps();
        nextProps.cartDetails.status = 'COMPLETED';
        const propsSpy = sinon.spy(DataCartDetails.prototype, 'componentWillReceiveProps');
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)', statusFontColor: '#55ba63' })).toBe(true);

        nextProps = getProps();
        nextProps.cartDetails.status = 'INCOMPLETE';
        wrapper.setProps(nextProps);
        expect(propsSpy.calledTwice).toBe(true);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({ status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)', statusFontColor: '#ce4427' })).toBe(true);

        nextProps = getProps();
        nextProps.cartDetails.status = 'SUBMITTED';
        wrapper.setProps(nextProps);
        expect(propsSpy.calledThrice).toBe(true);
        expect(stateSpy.calledThrice).toBe(true);
        expect(stateSpy.calledWith({ status: 'SUBMITTED', statusBackgroundColor: 'rgba(250,233,173, 0.4)', statusFontColor: '#f4d225' })).toBe(true);
        
        nextProps = getProps();
        nextProps.cartDetails.status = 'INVALID';
        wrapper.setProps(nextProps);
        expect(propsSpy.callCount).toEqual(4);
        expect(stateSpy.callCount).toEqual(4);
        expect(stateSpy.calledWith({ status: '', statusBackgroundColor: '#f8f8f8', statusFontColor: '#8b9396' })).toBe(true);

        stateSpy.restore();
        propsSpy.restore();
    });

    it('should handle setting state of zipFileUrl when component updates', () => {
        const props = getProps();
        props.cartDetails.zipfile_url = null;
        const wrapper = shallow(<DataCartDetails {...props} />);
        const nextProps = getProps();
        nextProps.cartDetails.zipfile_url = 'fakeFileUrl.zip';
        const propsSpy = sinon.spy(DataCartDetails.prototype, 'componentWillReceiveProps');
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        stateSpy.restore();
        propsSpy.restore();
    });

    it('should call initializeOpenLayers, _setTableColors, _setPermission, _setExpirationDate and _setMaxDate set on mount', () => {
        const props = getProps();
        const mountSpy = sinon.spy(DataCartDetails.prototype, 'componentDidMount');
        const colorsSpy = sinon.spy(DataCartDetails.prototype, '_setTableColors');
        const permissionSpy = sinon.spy(DataCartDetails.prototype, '_setPermission');
        const expirationSpy = sinon.spy(DataCartDetails.prototype, '_setExpirationDate');
        const maxDateSpy = sinon.spy(DataCartDetails.prototype, '_setMaxDate');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(colorsSpy.calledOnce).toBe(true);
        expect(permissionSpy.calledOnce).toBe(true);
        expect(expirationSpy.calledOnce).toBe(true);
        expect(maxDateSpy.calledOnce).toBe(true);
        expect(DataCartDetails.prototype._initializeOpenLayers.called).toBe(true);
        mountSpy.restore();
        colorsSpy.restore();
        maxDateSpy.restore();

    });

    it('should call setState in _setMaxDate', () => {
        const props = getProps();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const d = new Date();
        const m = moment(d);
        m.add(props.maxResetExpirationDays, 'days');
        const maxDate = m.toDate();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance()._setMaxDate();
        expect(stateSpy.calledOnce).toBe(true);
        stateSpy.restore();
    });


    it('_setTableColors should set the state for table color ', () => {
        const props = getProps();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance()._setTableColors();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)', statusFontColor: '#55ba63' })).toBe(true);

        let nextProps = getProps();
        nextProps.cartDetails.status = 'SUBMITTED';
        wrapper.setProps(nextProps);
        wrapper.instance()._setTableColors();
        expect(stateSpy.calledWith({ status: 'SUBMITTED', statusBackgroundColor: 'rgba(250,233,173, 0.4)', statusFontColor: '#f4d225' })).toBe(true);

        nextProps = getProps();
        nextProps.cartDetails.status = 'INCOMPLETE';
        wrapper.setProps(nextProps);
        wrapper.instance()._setTableColors();
        expect(stateSpy.calledWith({ status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)', statusFontColor: '#ce4427' }));

        nextProps = getProps();
        nextProps.cartDetails.status = 'INVALID';
        wrapper.setProps(nextProps);
        wrapper.instance()._setTableColors();
        expect(stateSpy.calledWith({ status: '', statusBackgroundColor: '#f8f8f8', statusFontColor: '#8b9396' })).toBe(true);

        stateSpy.restore();
    });

    it('_setExpirationDate should set the state for expiration date ', () => {
        const props = getProps();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance()._setExpirationDate();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ expirationDate: '2017-08-01T00:00:00Z' })).toBe(true);

        let nextProps = getProps();
        nextProps.cartDetails.expiration = '2017-08-08T18:35:01.400407Z';
        wrapper.setProps(nextProps);
        wrapper.instance()._setExpirationDate();
        expect(stateSpy.calledWith({ expirationDate: '2017-08-08T18:35:01.400407Z' })).toBe(true);
        stateSpy.restore();
    });

    it('_setPermission should set the state for published permission', () => {
        const props = getProps();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance()._setPermission();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ permission: true })).toBe(true);

        const nextProps = getProps();
        nextProps.cartDetails.job.published = false;
        wrapper.setProps(nextProps);
        wrapper.instance()._setPermission();
        expect(stateSpy.calledWith({ permission: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleRerunOpen should set rerun dialog to open', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleRerunOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ rerunDialogOpen: true })).toBe(true);
        stateSpy.restore();
    });

    it('handleCloneOpen should set clone dialog to open', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleCloneOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ cloneDialogOpen: true })).toBe(true);
        stateSpy.restore();
    });

    it('handleDeleteOpen should set the delete dialog to open', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleDeleteOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ deleteDialogOpen: true })).toBe(true);
        stateSpy.restore();
    });

    it('handleProviderOpen should set provider dialog to open', () => {
        const props = getProps();
        props.providers = providers;
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderOpen(run.provider_tasks[0]);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({
            providerDesc: 'OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).',
            providerName: 'OpenStreetMap Data (Themes)',
            providerDialogOpen: true,
        })).toBe(true);
        expect(wrapper.find('div').at(10).text())
            .toEqual('OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).');
        stateSpy.restore();
    });

    it('handleFormatsOpen should set format dialog to open', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleFormatsOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ formatsDialogOpen: true })).toBe(true);
        stateSpy.restore();
    });

    it('handleProjectionOpen should set projection dialog to open', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProjectionsOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ projectionsDialogOpen: true })).toBe(true);
        stateSpy.restore();
    });

    it('handleRerunClose should set the rerun dialog to closed', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleRerunClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ rerunDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleCloneClose should set the clone dialog to closed', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleCloneClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ cloneDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleDeleteClose should set the delete dialog to closed', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleDeleteClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ deleteDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });
    it('handleProviderClose should set the provider dialog to closed', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleFormatClose should set the format dialog to closed', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleFormatsClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ formatsDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleProjectionsClose should set the projections dialog to closed', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = shallow(<DataCartDetails {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProjectionsClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ projectionsDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleClone should clone a job with the correct data', () => {
        const props = getProps();
        props.onClone = sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.instance().handleClone();
        expect(props.onClone.calledOnce).toBe(true);
        expect(props.onClone.calledWith(props.cartDetails, providerArray)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ cloneDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleReRun should reRun a run with the correct data', () => {
        const props = getProps();
        props.onRunRerun = sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.instance().handleRerun();
        expect(props.onRunRerun.calledOnce).toBe(true);
        expect(props.onRunRerun.calledWith('7838d3b3-160a-4e7d-89cb-91fdcd6eab43')).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ rerunDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleDelete should delete a job', () => {
        const props = getProps();
        props.onRunDelete = sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.instance().handleDelete();
        expect(props.onRunDelete.calledOnce).toBe(true);
        expect(props.onRunDelete.calledWith('29f5cbab-09d8-4d6c-9505-438967062964')).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ deleteDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handlePublishedChange should setState of new published value', () => {
        const props = getProps();
        props.onUpdatePermission = sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.instance().handlePublishedChange('7838d3b3-160a-4e7d-89cb-91fdcd6eab43', false);
        expect(props.onUpdatePermission.calledOnce).toBe(true);
        expect(props.onUpdatePermission.calledWith('7838d3b3-160a-4e7d-89cb-91fdcd6eab43', false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ permission: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleExpirationChange should setState of new expiration date', () => {
        const props = getProps();
        props.onUpdateExpiration = sinon.spy();
        const wrapper = shallow(<DataCartDetails {...props} />);
        const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
        wrapper.instance().handleExpirationChange();
        expect(props.onUpdateExpiration.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        stateSpy.restore();
    });
});

const providerArray = [
    {
        "display": true,
        "slug": "osm",
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
        "published": true,
        "formats": [
            "Geopackage"
        ]
    },
    "provider_tasks": [
        {
            "display": true,
            "slug": "osm",
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
    "expiration": "2017-08-01T00:00:00Z"
}
const providers = [
    {
        "id": 2,
        "model_url": "http://cloud.eventkit.dev/api/providers/osm",
        "type": "osm",
        "license":  {
            "slug": "osm",
            "name": "Open Database License (ODbL) v1.0",
            "text": "ODC Open Database License (ODbL)."
        } ,
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

