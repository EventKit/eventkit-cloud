import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import CustomTableRow from '../../components/CustomTableRow';
import { DataPackGeneralTable } from '../../components/StatusDownloadPage/DataPackGeneralTable';

describe('DataPackGeneralTable component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        dataPack: {
            job: {
                description: 'job description',
                event: 'job event',
                formats: ['gpkg'],
            },
            provider_tasks: [
                {
                    display: true,
                    slug: 'one',
                    name: 'one',
                    description: 'number one',
                },
                {
                    display: false,
                    slug: 'two',
                    name: 'two',
                    description: 'number two',
                },
            ],
        },
        providers: [
            {
                display: true,
                slug: 'one',
                name: 'one',
                service_description: 'number one service',
            },
            {
                display: false,
                slug: 'two',
                name: 'two',
                service_description: 'number two service',
            },
        ],
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataPackGeneralTable {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find(CustomTableRow)).toHaveLength(4);
    });

    it('Source Info icon should call handleProviderOpen on click', () => {
        const openStub = sinon.stub(instance, 'handleProviderOpen');
        shallow(wrapper.find(CustomTableRow).at(2).props().data)
            .find('.qa-DataPackGeneralTable-Info-source').simulate('click');
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
    });

    it('handleProviderOpen should set provider dialog to open', () => {
        const statestub = sinon.stub(instance, 'setState');
        expect(statestub.called).toBe(false);
        instance.handleProviderOpen(props.dataPack.provider_tasks[0]);
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({
            providerDescription: 'number one service',
            providerName: 'one',
            providerDialogOpen: true,
        })).toBe(true);
        statestub.restore();
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const statestub = sinon.stub(instance, 'setState');
        expect(statestub.called).toBe(false);
        instance.handleProviderClose();
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({ providerDialogOpen: false })).toBe(true);
        statestub.restore();
    });

    it('handleProjectionOpen should set projection dialog to open', () => {
        const statestub = sinon.stub(instance, 'setState');
        expect(statestub.called).toBe(false);
        instance.handleProjectionsOpen();
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({ projectionsDialogOpen: true })).toBe(true);
        statestub.restore();
    });

    it('handleProjectionsClose should set the projections dialog to closed', () => {
        const statestub = sinon.stub(instance, 'setState');
        expect(statestub.called).toBe(false);
        instance.handleProjectionsClose();
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({ projectionsDialogOpen: false })).toBe(true);
        statestub.restore();
    });
});
