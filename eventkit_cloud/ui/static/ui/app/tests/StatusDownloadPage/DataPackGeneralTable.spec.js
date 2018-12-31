import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import CustomTableRow from '../../components/common/CustomTableRow';
import { DataPackGeneralTable } from '../../components/StatusDownloadPage/DataPackGeneralTable';

describe('DataPackGeneralTable component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => (
        {
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
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<DataPackGeneralTable {...props} />)
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CustomTableRow)).toHaveLength(4);
    });

    it('Source Info icon should call handleProviderOpen on click', () => {
        const props = getProps();
        const openStub = sinon.stub(DataPackGeneralTable.prototype, 'handleProviderOpen');
        const wrapper = getWrapper(props);
        shallow(wrapper.find(CustomTableRow).at(2).props().data)
            .find('.qa-DataPackGeneralTable-Info-source').simulate('click');
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
    });

    it('handleProviderOpen should set provider dialog to open', () => {
        const props = getProps();
        const statestub = sinon.stub(DataPackGeneralTable.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(statestub.called).toBe(false);
        wrapper.instance().handleProviderOpen(props.dataPack.provider_tasks[0]);
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({
            providerDescription: 'number one service',
            providerName: 'one',
            providerDialogOpen: true,
        })).toBe(true);
        statestub.restore();
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const props = getProps();
        const statestub = sinon.stub(DataPackGeneralTable.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(statestub.called).toBe(false);
        wrapper.instance().handleProviderClose();
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({ providerDialogOpen: false })).toBe(true);
        statestub.restore();
    });

    it('handleProjectionOpen should set projection dialog to open', () => {
        const props = getProps();
        const statestub = sinon.stub(DataPackGeneralTable.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(statestub.called).toBe(false);
        wrapper.instance().handleProjectionsOpen();
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({ projectionsDialogOpen: true })).toBe(true);
        statestub.restore();
    });

    it('handleProjectionsClose should set the projections dialog to closed', () => {
        const props = getProps();
        const statestub = sinon.stub(DataPackGeneralTable.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(statestub.called).toBe(false);
        wrapper.instance().handleProjectionsClose();
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({ projectionsDialogOpen: false })).toBe(true);
        statestub.restore();
    });
});
