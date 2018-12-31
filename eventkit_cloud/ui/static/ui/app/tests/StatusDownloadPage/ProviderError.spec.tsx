import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Divider from '@material-ui/core/Divider';
import Warning from '@material-ui/icons/Warning';
import { ProviderError } from '../../components/StatusDownloadPage/ProviderError';
import BaseDialog from '../../components/Dialog/BaseDialog';

describe('ProviderError component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

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

    const getProps = () => ({
        provider: {
            name: 'OpenStreetMap Data (Themes)',
            status: 'COMPLETED',
            tasks,
            uid: 'e261d619-2a02-4ba5-a58c-be0908f97d04',
            url: 'http://cloud.eventkit.test/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04',
            display: true,
        },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<ProviderError {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render UI elements', () => {
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find('.qa-ProviderError-error-text').text()).toEqual('ERROR');
        expect(wrapper.find(Warning)).toHaveLength(3);
    });

    it('handleProviderErrorOpen should set provider error dialog to open', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleProviderErrorOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerErrorDialogOpen: true })).toBe(true);
        expect(wrapper.find(Warning)).toHaveLength(3);
        expect(wrapper.find(Divider)).toHaveLength(2);
        expect(wrapper.find('.qa-ProviderError-errorData')).toHaveLength(2);
        expect(wrapper.find('.qa-ProviderError-errorData').first().childAt(1).text()).toEqual('OSM should show');
        stateSpy.restore();
    });

    it('handleProviderErrorClose should set provider error dialog to close', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleProviderErrorClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerErrorDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('should call handleProviderErrorOpen when the error link is clicked. ', () => {
        const errorSpy = sinon.stub(ProviderError.prototype, 'handleProviderErrorOpen');
        setup();
        wrapper.find('.qa-ProviderError-error-text').simulate('click');
        expect(errorSpy.calledOnce).toBe(true);
        errorSpy.restore();
    });

    it('should call handleProviderErrorOpen when the error warning icon is clicked. ', () => {
        const errorSpy = sinon.stub(ProviderError.prototype, 'handleProviderErrorOpen');
        setup();
        wrapper.find(Warning).first().simulate('click');
        expect(errorSpy.calledOnce).toBe(true);
        errorSpy.restore();
    });
});
