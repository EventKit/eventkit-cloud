import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import raf from 'raf';
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
import Feature from 'ol/feature';
import Attribution from 'ol/control/attribution';
import ScaleLine from 'ol/control/scaleline';
import Zoom from 'ol/control/zoom';
import DataPackDetails from '../../components/StatusDownloadPage/DataPackDetails';
import DataPackTableRow from '../../components/StatusDownloadPage/DataPackTableRow';
import DataPackStatusTable from '../../components/StatusDownloadPage/DataPackStatusTable';
import DataPackOptions from '../../components/StatusDownloadPage/DataPackOptions';
import DataPackGeneralTable from '../../components/StatusDownloadPage/DataPackGeneralTable';
import DataCartInfoTable from '../../components/StatusDownloadPage/DataCartInfoTable';
import DataCartDetails from '../../components/StatusDownloadPage/DataCartDetails';

// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();

describe('DataCartDetails component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    const didMount = DataCartDetails.prototype.componentDidMount;

    beforeAll(() => {
        DataCartDetails.prototype.componentDidMount = sinon.spy();
    });

    afterAll(() => {
        DataCartDetails.prototype.componentDidMount = didMount;
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
            context: {
                muiTheme,
                config: {
                    BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png',
                    BASEMAP_COPYRIGHT: 'my copyright',
                },
            },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-DataCartDetails-div-name')).toHaveLength(1);
        expect(wrapper.find('.qa-DataCartDetails-div-status')).toHaveLength(1);
        expect(wrapper.find(DataPackStatusTable)).toHaveLength(1);
        expect(wrapper.find(DataPackDetails)).toHaveLength(1);
        expect(wrapper.find('.qa-DataCartDetails-div-otherOptions')).toHaveLength(1);
        expect(wrapper.find(DataPackOptions)).toHaveLength(1);
        expect(wrapper.find('.qa-DataCartDetails-div-generalInfo')).toHaveLength(1);
        expect(wrapper.find(DataPackGeneralTable)).toHaveLength(1);
        expect(wrapper.find('.qa-DataCartDetails-div-aoi')).toHaveLength(1);
        expect(wrapper.find('.qa-DataCartDetails-div-map')).toHaveLength(1);
        expect(wrapper.find('.qa-DataCartDetails-div-exportInfo')).toHaveLength(1);
        expect(wrapper.find(DataCartInfoTable)).toHaveLength(1);
    });

    it('should change the status colors based on cart status', () => {
        const props = getProps();
        props.cartDetails.status = 'COMPLETED';
        const wrapper = getWrapper(props);
        expect(wrapper.find(DataPackStatusTable).props().statusColor).toEqual('rgba(188,223,187, 0.4)');
        expect(wrapper.find(DataPackStatusTable).props().statusFontColor).toEqual('#55ba63');

        const nextProps = getProps();
        nextProps.cartDetails.status = 'SUBMITTED';
        wrapper.setProps(nextProps);
        expect(wrapper.find(DataPackStatusTable).props().statusColor).toEqual('rgba(250,233,173, 0.4)');
        expect(wrapper.find(DataPackStatusTable).props().statusFontColor).toEqual('#f4d225');

        const lastProps = getProps();
        lastProps.cartDetails.status = 'INCOMPLETE';
        wrapper.setProps(lastProps);
        expect(wrapper.find(DataPackStatusTable).props().statusColor).toEqual('rgba(232,172,144, 0.4)');
        expect(wrapper.find(DataPackStatusTable).props().statusFontColor).toEqual('#ce4427');
    });

    it('should call initializeOpenLayers, setPermission, and setMaxDate set on mount', () => {
        const props = getProps();
        const initStub = sinon.stub(DataCartDetails.prototype, 'initializeOpenLayers');
        const permissionStub = sinon.stub(DataCartDetails.prototype, 'setPermission');
        const dateStub = sinon.stub(DataCartDetails.prototype, 'setDates');
        DataCartDetails.prototype.componentDidMount = didMount;
        const wrapper = getWrapper(props);
        expect(initStub.calledOnce).toBe(true);
        expect(permissionStub.calledOnce).toBe(true);
        expect(dateStub.calledOnce).toBe(true);
        initStub.restore();
        permissionStub.restore();
        dateStub.restore();
        DataCartDetails.prototype.componentDidMount = sinon.spy();
    });

    it('setPermission should set the state for published permission', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataCartDetails.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().setPermission();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permission: props.cartDetails.job.published })).toBe(true);
        stateStub.restore();
    });

    it('setMaxDate should set the min and max dates', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataCartDetails.prototype, 'setState');
        const wrapper = getWrapper(props);
        const minDate = new Date();
        const clock = sinon.useFakeTimers(minDate.getTime());
        const today = new Date();
        const m = moment(today);
        m.add(props.maxResetExpirationDays, 'days');
        const maxDate = m.toDate();
        expect(stateStub.called).toBe(false);
        wrapper.instance().setDates();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ minDate, maxDate })).toBe(true);
        stateStub.restore();
        clock.restore();
    });

    it('initializeOpenLayers should construct a map and add it to the DOM', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const fakeFeatures = [new Feature()];
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeatures').returns(fakeFeatures);
        const fitStub = sinon.stub(View.prototype, 'fit').returns();
        wrapper.instance().initializeOpenLayers();
        readStub.restore();
        fitStub.restore();
    });

    it('handlePermissionChange should state to true and call onUpdatePermission', () => {
        const props = getProps();
        props.onUpdatePermission = sinon.spy();
        const stateStub = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handlePermissionChange({}, 0, 1);
        expect(props.onUpdatePermission.calledOnce).toBe(true);
        expect(props.onUpdatePermission.calledWith(props.cartDetails.job.uid, true)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permission: true })).toBe(true);
        stateStub.restore();
    });

    it('handlePermissionChange should state to false and call onUpdatePermission', () => {
        const props = getProps();
        props.onUpdatePermission = sinon.spy();
        const stateStub = sinon.spy(DataCartDetails.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handlePermissionChange({}, 0, 2);
        expect(props.onUpdatePermission.calledOnce).toBe(true);
        expect(props.onUpdatePermission.calledWith(props.cartDetails.job.uid, false)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permission: false })).toBe(true);
        stateStub.restore();
    });

    it('handleExpirationChange should call onUpdateExpiration', () => {
        const props = getProps();
        props.onUpdateExpiration = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleExpirationChange({}, 'today');
        expect(props.onUpdateExpiration.calledOnce).toBe(true);
        expect(props.onUpdateExpiration.calledWith(props.cartDetails.uid, 'today')).toBe(true);
    });
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
