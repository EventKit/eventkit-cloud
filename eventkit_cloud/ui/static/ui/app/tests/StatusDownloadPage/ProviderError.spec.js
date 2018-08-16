import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Divider from 'material-ui/Divider';
import Warning from '@material-ui/icons/Warning';
import ProviderError from '../../components/StatusDownloadPage/ProviderError';
import BaseDialog from '../../components/Dialog/BaseDialog';

describe('ProviderError component', () => {
    const tasks = [
        {
            name: 'OSM Data (.gpkg)',
            status: 'INCOMPLETE',
            errors: [
                {
                    exception: 'OSM should show',
                },
            ],
            display: true,
        },
        {
            name: 'QGIS Project file (.qgs)',
            status: 'INCOMPLETE',
            errors: [
                {
                    exception: 'QGIS should show',
                },
            ],
            display: true,
        },
        {
            name: 'Area of Interest (.geojson)',
            status: 'INCOMPLETE',
            errors: [],
            display: true,
        },
        {
            name: 'Area of Interest (.gpkg)',
            status: 'INCOMPLETE',
            errors: [
                {
                    exception: 'AOI should not show',
                },
            ],
            display: false,
        },
    ];

    const getProps = () => (
        {
            provider: {
                name: 'OpenStreetMap Data (Themes)',
                status: 'COMPLETED',
                tasks,
                uid: 'e261d619-2a02-4ba5-a58c-be0908f97d04',
                url: 'http://cloud.eventkit.test/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04',
                display: true,
            },
        }
    );
    const muiTheme = getMuiTheme();

    const getWrapper = props => (
        mount(<ProviderError {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render UI elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find('.qa-ProviderError-error-text').text()).toEqual('ERROR');
        expect(wrapper.find(Warning)).toHaveLength(1);
    });

    it('handleProviderErrorOpen should set provider error dialog to open', () => {
        const props = getProps();
        const stateSpy = sinon.spy(ProviderError.prototype, 'setState');
        const wrapper = shallow(<ProviderError {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderErrorOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerErrorDialogOpen: true })).toBe(true);
        expect(wrapper.find(Warning)).toHaveLength(3);
        expect(wrapper.find(Divider)).toHaveLength(2);
        expect(wrapper.find('.qa-ProviderError-errorData')).toHaveLength(2);
        expect(wrapper.find('.qa-ProviderError-errorData').first().childAt(1).text()).toEqual('OSM should show');
        stateSpy.restore();
    });

    it('handleProviderErrorClose should set provider error dialog to close', () => {
        const props = getProps();
        const stateSpy = sinon.spy(ProviderError.prototype, 'setState');
        const wrapper = shallow(<ProviderError {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderErrorClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerErrorDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('should call handleProviderErrorOpen when the error link is clicked. ', () => {
        const props = getProps();
        const stateSpy = sinon.spy(ProviderError.prototype, 'setState');
        const errorSpy = sinon.spy(ProviderError.prototype, 'handleProviderErrorOpen');
        const wrapper = getWrapper(props);
        expect(errorSpy.notCalled).toBe(true);
        wrapper.find('.qa-ProviderError-error-text').simulate('click');
        expect(errorSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerErrorDialogOpen: true })).toBe(true);
        stateSpy.restore();
        errorSpy.restore();
    });

    it('should call handleProviderErrorOpen when the error warning icon is clicked. ', () => {
        const props = getProps();
        const stateSpy = sinon.spy(ProviderError.prototype, 'setState');
        const errorSpy = sinon.spy(ProviderError.prototype, 'handleProviderErrorOpen');
        const wrapper = getWrapper(props);
        expect(errorSpy.notCalled).toBe(true);
        wrapper.find(Warning).simulate('click');
        expect(errorSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerErrorDialogOpen: true })).toBe(true);
        errorSpy.restore();
        stateSpy.restore();
    });
});
