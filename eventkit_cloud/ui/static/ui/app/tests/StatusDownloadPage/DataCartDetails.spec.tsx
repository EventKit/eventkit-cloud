import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import * as moment from 'moment';
import DataPackDetails from '../../components/StatusDownloadPage/DataPackDetails';
import DataPackStatusTable from '../../components/StatusDownloadPage/DataPackStatusTable';
import DataPackOptions from '../../components/StatusDownloadPage/DataPackOptions';
import DataPackGeneralTable from '../../components/StatusDownloadPage/DataPackGeneralTable';
import DataCartInfoTable from '../../components/StatusDownloadPage/DataCartInfoTable';
import { DataCartDetails } from '../../components/StatusDownloadPage/DataCartDetails';

describe('DataCartDetails component', () => {
    let shallow;

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

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => (
        {
            cartDetails: { ...run },
            providers,
            maxResetExpirationDays: '30',
            zipFileProp: null,
            onUpdateExpiration: sinon.spy(),
            onUpdateDataCartPermissions: sinon.spy(),
            onRunDelete: sinon.spy(),
            onRunRerun: sinon.spy(),
            onClone: sinon.spy(),
            onProviderCancel: sinon.spy(),
            user: { data: { user: { username: 'admin' } } },
            members: [],
            groups: [],
            ...(global as any).eventkit_test_props,
        }
    );

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataCartDetails {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render elements', () => {
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
        props.cartDetails.status = 'COMPLETED';
        wrapper.setProps({ cartDetails: { ...props.cartDetails, status: 'COMPLETED' }});
        expect(wrapper.find(DataPackStatusTable).props().statusColor).toEqual('#55ba6333');
        expect(wrapper.find(DataPackStatusTable).props().statusFontColor).toEqual('#55ba63');

        const nextProps = getProps();
        nextProps.cartDetails.status = 'SUBMITTED';
        wrapper.setProps(nextProps);
        expect(wrapper.find(DataPackStatusTable).props().statusColor).toEqual('#f4d22533');
        expect(wrapper.find(DataPackStatusTable).props().statusFontColor).toEqual('#f4d225');

        const lastProps = getProps();
        lastProps.cartDetails.status = 'INCOMPLETE';
        wrapper.setProps(lastProps);
        expect(wrapper.find(DataPackStatusTable).props().statusColor).toEqual('#ce442733');
        expect(wrapper.find(DataPackStatusTable).props().statusFontColor).toEqual('#ce4427');
    });

    it('should call setMaxDate set on mount', () => {
        const dateStub = sinon.stub(DataCartDetails.prototype, 'setDates');
        setup();
        expect(dateStub.calledOnce).toBe(true);
        dateStub.restore();
    });

    it('setMaxDate should set the min and max dates', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const minDate = new Date();
        const clock = sinon.useFakeTimers(minDate.getTime());
        const today = new Date();
        const m = moment(today);
        m.add(props.maxResetExpirationDays, 'days');
        const maxDate = m.toDate();
        expect(stateStub.called).toBe(false);
        instance.setDates();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ minDate, maxDate })).toBe(true);
        clock.restore();
    });

    it('handlePermissionsChange should call onUpdateDataCartPermissions', () => {
        const permissions = {
            value: 'PUBLIC',
            groups: {},
            members: {},
        };
        instance.handlePermissionsChange(permissions);
        expect(props.onUpdateDataCartPermissions.calledOnce).toBe(true);
        expect(props.onUpdateDataCartPermissions.calledWith(props.cartDetails.job.uid, permissions)).toBe(true);
    });

    it('handleExpirationChange should call onUpdateExpiration', () => {
        instance.handleExpirationChange('today');
        expect(props.onUpdateExpiration.calledOnce).toBe(true);
        expect(props.onUpdateExpiration.calledWith(props.cartDetails.uid, 'today')).toBe(true);
    });
});
