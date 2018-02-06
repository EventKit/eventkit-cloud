import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Info from 'material-ui/svg-icons/action/info';
import DataPackTableRow from '../../components/StatusDownloadPage/DataPackTableRow';
import BaseDialog from '../../components/BaseDialog';
import DataPackGeneralTable from '../../components/StatusDownloadPage/DataPackGeneralTable';

describe('DataPackGeneralTable component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

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
        }
    );

    const getWrapper = props => (
        mount(<DataPackGeneralTable {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(DataPackTableRow)).toHaveLength(5);
        expect(wrapper.find(BaseDialog)).toHaveLength(3);
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

    it('handleFormatsOpen should set format dialog to open', () => {
        const props = getProps();
        const statestub = sinon.stub(DataPackGeneralTable.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(statestub.called).toBe(false);
        wrapper.instance().handleFormatsOpen();
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({ formatsDialogOpen: true })).toBe(true);
        statestub.restore();
    });

    it('handleFormatClose should set the format dialog to closed', () => {
        const props = getProps();
        const statestub = sinon.stub(DataPackGeneralTable.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(statestub.called).toBe(false);
        wrapper.instance().handleFormatsClose();
        expect(statestub.calledOnce).toBe(true);
        expect(statestub.calledWith({ formatsDialogOpen: false })).toBe(true);
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
