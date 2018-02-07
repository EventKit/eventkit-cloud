import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import moment from 'moment';
import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import Attribution from 'ol/control/attribution';
import ScaleLine from 'ol/control/scaleline';
import Zoom from 'ol/control/zoom';
import DataPackDetails from '../../components/StatusDownloadPage/DataPackDetails';
import DataPackTableRow from '../../components/StatusDownloadPage/DataPackTableRow';
import DataPackStatusTable from '../../components/StatusDownloadPage/DataPackStatusTable';
import DataPackOptions from '../../components/StatusDownloadPage/DataPackOptions';
import DataPackGeneralTable from '../../components/StatusDownloadPage/DataPackGeneralTable';
import DataCartInfoTable from '../../components/StatusDownloadPage/DataCartInfoTable';
import BaseDialog from '../../components/BaseDialog';
import DataCartDetails from '../../components/StatusDownloadPage/DataCartDetails';

describe('DataCartDetails component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    beforeAll(() => {
        DataCartDetails.prototype.componentDidMount = sinon.spy();
    });

    afterAll(() => {
        DataCartDetails.prototype.componentDidMount.restore();
    });

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
            user: { data: { user: { username: 'admin' } } },
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
        expect(wrapper.find('.qa-DataCartDetails-name')).toHaveLength(1);
    });

//     it('should have the correct menu item labels', () => {
//         const props = getProps();
//         const wrapper = shallow(<DataCartDetails {...props} />, {
//             context: { muiTheme },
//             childContextTypes: { muiTheme: React.PropTypes.object },
//         });
//         expect(wrapper.find(DropDownMenu)).toHaveLength(1);
//         const menu = shallow(wrapper.find(DropDownMenu).node, { context: { muiTheme } });
//         expect(menu.childAt(1).childAt(0).childAt(0).node.props.primaryText).toEqual('Public');
//         expect(menu.childAt(1).childAt(0).childAt(1).node.props.primaryText).toEqual('Private');
//     });

//     it('should only render "Finished" table data if run has finished', () => {
//         const props = getProps();
//         props.cartDetails.finished_at = '';
//         const wrapper = getWrapper(props);
//         let table = wrapper.find('table').at(7);
//         expect(table.find('tr')).toHaveLength(3);
//         const nextProps = getProps();
//         wrapper.setProps(nextProps);
//         table = wrapper.find('table').at(7);
//         expect(table.find('tr')).toHaveLength(4);
//         expect(table.find('tr').at(3).find('td').first().text()).toEqual('Finished');
//         expect(table.find('tr').at(3).find('td').last().text()).toEqual('6:35:22 pm, May 22nd 2017');
//     });


//     it('should handle setting state of datacartDetails when component updates', () => {
//         const props = getProps();
//         props.cartDetails.status = 'SUBMITTED';
//         const wrapper = shallow(<DataCartDetails {...props} />);
//         let nextProps = getProps();
//         nextProps.cartDetails.status = 'COMPLETED';
//         const propsSpy = sinon.spy(DataCartDetails.prototype, 'componentWillReceiveProps');
//         const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
//         wrapper.setProps(nextProps);
//         expect(propsSpy.calledOnce).toBe(true);
//         expect(stateSpy.calledOnce).toBe(true);
//         expect(stateSpy.calledWith({ status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)', statusFontColor: '#55ba63' })).toBe(true);

//         nextProps = getProps();
//         nextProps.cartDetails.status = 'INCOMPLETE';
//         wrapper.setProps(nextProps);
//         expect(propsSpy.calledTwice).toBe(true);
//         expect(stateSpy.calledTwice).toBe(true);
//         expect(stateSpy.calledWith({ status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)', statusFontColor: '#ce4427' })).toBe(true);

//         nextProps = getProps();
//         nextProps.cartDetails.status = 'SUBMITTED';
//         wrapper.setProps(nextProps);
//         expect(propsSpy.calledThrice).toBe(true);
//         expect(stateSpy.calledThrice).toBe(true);
//         expect(stateSpy.calledWith({ status: 'SUBMITTED', statusBackgroundColor: 'rgba(250,233,173, 0.4)', statusFontColor: '#f4d225' })).toBe(true);
        
//         nextProps = getProps();
//         nextProps.cartDetails.status = 'INVALID';
//         wrapper.setProps(nextProps);
//         expect(propsSpy.callCount).toEqual(4);
//         expect(stateSpy.callCount).toEqual(4);
//         expect(stateSpy.calledWith({ status: '', statusBackgroundColor: '#f8f8f8', statusFontColor: '#8b9396' })).toBe(true);

//         stateSpy.restore();
//         propsSpy.restore();
//     });

//     it('should handle setting state of zipFileUrl when component updates', () => {
//         const props = getProps();
//         props.cartDetails.zipfile_url = null;
//         const wrapper = shallow(<DataCartDetails {...props} />);
//         const nextProps = getProps();
//         nextProps.cartDetails.zipfile_url = 'fakeFileUrl.zip';
//         const propsSpy = sinon.spy(DataCartDetails.prototype, 'componentWillReceiveProps');
//         const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
//         wrapper.setProps(nextProps);
//         expect(propsSpy.calledOnce).toBe(true);
//         expect(stateSpy.calledOnce).toBe(true);
//         stateSpy.restore();
//         propsSpy.restore();
//     });

//     it('should call initializeOpenLayers, _setTableColors, _setPermission, _setExpirationDate and _setMaxDate set on mount', () => {
//         const props = getProps();
//         const mountSpy = sinon.spy(DataCartDetails.prototype, 'componentDidMount');
//         const colorsSpy = sinon.spy(DataCartDetails.prototype, '_setTableColors');
//         const permissionSpy = sinon.spy(DataCartDetails.prototype, '_setPermission');
//         const expirationSpy = sinon.spy(DataCartDetails.prototype, '_setExpirationDate');
//         const maxDateSpy = sinon.spy(DataCartDetails.prototype, '_setMaxDate');
//         const wrapper = getWrapper(props);
//         expect(mountSpy.calledOnce).toBe(true);
//         expect(colorsSpy.calledOnce).toBe(true);
//         expect(permissionSpy.calledOnce).toBe(true);
//         expect(expirationSpy.calledOnce).toBe(true);
//         expect(maxDateSpy.calledOnce).toBe(true);
//         expect(DataCartDetails.prototype._initializeOpenLayers.called).toBe(true);
//         mountSpy.restore();
//         colorsSpy.restore();
//         maxDateSpy.restore();

//     });

//     it('should call setState in _setMaxDate', () => {
//         const props = getProps();
//         const wrapper = shallow(<DataCartDetails {...props} />);
//         const d = new Date();
//         const m = moment(d);
//         m.add(props.maxResetExpirationDays, 'days');
//         const maxDate = m.toDate();
//         const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
//         expect(stateSpy.called).toBe(false);
//         wrapper.instance()._setMaxDate();
//         expect(stateSpy.calledOnce).toBe(true);
//         stateSpy.restore();
//     });


//     it('_setTableColors should set the state for table color ', () => {
//         const props = getProps();
//         const wrapper = shallow(<DataCartDetails {...props} />);
//         const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
//         expect(stateSpy.called).toBe(false);
//         wrapper.instance()._setTableColors();
//         expect(stateSpy.calledOnce).toBe(true);
//         expect(stateSpy.calledWith({ status: 'COMPLETED', statusBackgroundColor: 'rgba(188,223,187, 0.4)', statusFontColor: '#55ba63' })).toBe(true);

//         let nextProps = getProps();
//         nextProps.cartDetails.status = 'SUBMITTED';
//         wrapper.setProps(nextProps);
//         wrapper.instance()._setTableColors();
//         expect(stateSpy.calledWith({ status: 'SUBMITTED', statusBackgroundColor: 'rgba(250,233,173, 0.4)', statusFontColor: '#f4d225' })).toBe(true);

//         nextProps = getProps();
//         nextProps.cartDetails.status = 'INCOMPLETE';
//         wrapper.setProps(nextProps);
//         wrapper.instance()._setTableColors();
//         expect(stateSpy.calledWith({ status: 'INCOMPLETE', statusBackgroundColor: 'rgba(232,172,144, 0.4)', statusFontColor: '#ce4427' }));

//         nextProps = getProps();
//         nextProps.cartDetails.status = 'INVALID';
//         wrapper.setProps(nextProps);
//         wrapper.instance()._setTableColors();
//         expect(stateSpy.calledWith({ status: '', statusBackgroundColor: '#f8f8f8', statusFontColor: '#8b9396' })).toBe(true);

//         stateSpy.restore();
//     });

//     it('_setExpirationDate should set the state for expiration date ', () => {
//         const props = getProps();
//         const wrapper = shallow(<DataCartDetails {...props} />);
//         const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
//         expect(stateSpy.called).toBe(false);
//         wrapper.instance()._setExpirationDate();
//         expect(stateSpy.calledOnce).toBe(true);
//         expect(stateSpy.calledWith({ expirationDate: '2017-08-01T00:00:00Z' })).toBe(true);

//         let nextProps = getProps();
//         nextProps.cartDetails.expiration = '2017-08-08T18:35:01.400407Z';
//         wrapper.setProps(nextProps);
//         wrapper.instance()._setExpirationDate();
//         expect(stateSpy.calledWith({ expirationDate: '2017-08-08T18:35:01.400407Z' })).toBe(true);
//         stateSpy.restore();
//     });

//     it('_setPermission should set the state for published permission', () => {
//         const props = getProps();
//         const wrapper = shallow(<DataCartDetails {...props} />);
//         const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
//         expect(stateSpy.called).toBe(false);
//         wrapper.instance()._setPermission();
//         expect(stateSpy.calledOnce).toBe(true);
//         expect(stateSpy.calledWith({ permission: true })).toBe(true);

//         const nextProps = getProps();
//         nextProps.cartDetails.job.published = false;
//         wrapper.setProps(nextProps);
//         wrapper.instance()._setPermission();
//         expect(stateSpy.calledWith({ permission: false })).toBe(true);
//         stateSpy.restore();
//     });

//     it('handlePublishedChange should setState of new published value', () => {
//         const props = getProps();
//         props.onUpdatePermission = sinon.spy();
//         const wrapper = shallow(<DataCartDetails {...props} />);
//         const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
//         wrapper.instance().handlePublishedChange('7838d3b3-160a-4e7d-89cb-91fdcd6eab43', false);
//         expect(props.onUpdatePermission.calledOnce).toBe(true);
//         expect(props.onUpdatePermission.calledWith('7838d3b3-160a-4e7d-89cb-91fdcd6eab43', false)).toBe(true);
//         expect(stateSpy.calledOnce).toBe(true);
//         expect(stateSpy.calledWith({ permission: false })).toBe(true);
//         stateSpy.restore();
//     });

//     it('handleExpirationChange should setState of new expiration date', () => {
//         const props = getProps();
//         props.onUpdateExpiration = sinon.spy();
//         const wrapper = shallow(<DataCartDetails {...props} />);
//         const stateSpy = sinon.spy(DataCartDetails.prototype, 'setState');
//         wrapper.instance().handleExpirationChange();
//         expect(props.onUpdateExpiration.calledOnce).toBe(true);
//         expect(stateSpy.calledOnce).toBe(true);
//         stateSpy.restore();
//     });
});

const run = {
    uid: '12345',
    url: 'http://cloud.eventkit.test/api/runs/123455',
    started_at: '2017-05-22T18:35:01.400756Z',
    finished_at: '2017-05-22T18:35:22.292006Z',
    duration: '0:00:20.891250',
    user: 'admin',
    status: 'COMPLETED',
    job: {
        uid: '67890',
        name: 'test',
        event: 'test',
        description: 'test',
        url: 'http://cloud.eventkit.dev/api/jobs/67890',
        published: true,
        formats: [
            'Geopackage',
        ],
    },
    provider_tasks: [
        {
            display: true,
            slug: '1',
            uid: '1',
            name: '1',
            tasks: [
                {
                    uid: '1',
                    name: 'task 1',
                    status: 'SUCCESS',
                    display: true,
                    errors: [],
                },
                {
                    uid: '2',
                    name: 'task 2',
                    status: 'SUCCESS',
                    display: false,
                    errors: [],
                },
            ],
            status: 'COMPLETED',
        },
    ],
    zipfile_url: null,
    expiration: '2017-08-01T00:00:00Z',
};

const providers = [
    {
        id: 1,
        type: '1',
        uid: '1',
        name: '1',
        slug: '1',
        service_description: 'provider 1',
        display: true,
        export_provider_type: 2,
    },
];
