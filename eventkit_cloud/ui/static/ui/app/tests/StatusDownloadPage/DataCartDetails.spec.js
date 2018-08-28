import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import moment from 'moment';
import DataPackDetails from '../../components/StatusDownloadPage/DataPackDetails';
import DataPackStatusTable from '../../components/StatusDownloadPage/DataPackStatusTable';
import DataPackOptions from '../../components/StatusDownloadPage/DataPackOptions';
import DataPackGeneralTable from '../../components/StatusDownloadPage/DataPackGeneralTable';
import DataCartInfoTable from '../../components/StatusDownloadPage/DataCartInfoTable';
import DataCartDetails from '../../components/StatusDownloadPage/DataCartDetails';
import DataPackAoiInfo from '../../components/StatusDownloadPage/DataPackAoiInfo';

describe('DataCartDetails component', () => {
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
            url: 'http://cloud.eventkit.test/api/jobs/67890',
            formats: [
                'Geopackage',
            ],
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
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
        members: [],
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

    const didMount = DataCartDetails.prototype.componentDidMount;

    beforeAll(() => {
        DataCartDetails.prototype.componentDidMount = sinon.spy();
        DataPackAoiInfo.prototype.render = sinon.spy(() => null);
        DataPackAoiInfo.prototype.initializeOpenLayers = sinon.spy();
    });

    afterAll(() => {
        DataCartDetails.prototype.componentDidMount = didMount;
        DataPackAoiInfo.prototype.render.restore();
        DataPackAoiInfo.prototype.initializeOpenLayers.restore();
    });

    const getProps = () => (
        {
            cartDetails: { ...run },
            providers,
            maxResetExpirationDays: '30',
            zipFileProp: null,
            onUpdateExpiration: () => {},
            onUpdateDataCartPermissions: () => {},
            onRunDelete: () => {},
            onRunRerun: () => {},
            onClone: () => {},
            onProviderCancel: () => {},
            user: { data: { user: { username: 'admin' } } },
            members: [],
            groups: [],
        }
    );

    const getWrapper = props => (
        mount(<DataCartDetails {...props} />)
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

    it('should call setMaxDate set on mount', () => {
        const props = getProps();
        const dateStub = sinon.stub(DataCartDetails.prototype, 'setDates');
        DataCartDetails.prototype.componentDidMount = didMount;
        getWrapper(props);
        expect(dateStub.calledOnce).toBe(true);
        dateStub.restore();
        DataCartDetails.prototype.componentDidMount = sinon.spy();
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

    it('handlePermissionsChange should call onUpdateDataCartPermissions', () => {
        const props = getProps();
        props.onUpdateDataCartPermissions = sinon.spy();
        const wrapper = getWrapper(props);
        const permissions = {
            value: 'PUBLIC',
            groups: {},
            members: {},
        };
        wrapper.instance().handlePermissionsChange(permissions);
        expect(props.onUpdateDataCartPermissions.calledOnce).toBe(true);
        expect(props.onUpdateDataCartPermissions.calledWith(props.cartDetails.job.uid, permissions)).toBe(true);
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
