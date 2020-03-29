import * as React from 'react';
import * as sinon from 'sinon';
import {shallow} from 'enzyme';
import AlertWarning from '@material-ui/icons/Warning';
import AlertError from '@material-ui/icons/Error';
import ActionDone from '@material-ui/icons/Done';
import CircularProgress from '@material-ui/core/CircularProgress';
import ProviderStatusCheck from '../../components/CreateDataPack/ProviderStatusCheck';

describe('ProviderStatusIcon component', () => {
    let wrapper;

    const defaultProps = () => ({
        availability: {
            status: '',
            type: '',
            message: '',
        },
        overSize: false,
        overArea: false,
        providerHasEstimates: true,
        areEstimatesLoading: false,
        supportsZoomLevels: true,
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<ProviderStatusCheck {...props} />);
    };

    beforeEach(setup);

    describe('it renders the correct icons', () => {
        it('should show the success icon', () => {
            const props = defaultProps();
            props.availability.status = 'SUCCESS';
            wrapper.setProps(props);
            expect(wrapper.find(ActionDone)).toHaveLength(1);
        });

        it('should show the fatal icon when over size', () => {
            setup({overSize: true});
            expect(wrapper.find(AlertError)).toHaveLength(1);
        });

        it('should show the fatal icon when over area', () => {
            setup({overArea: true, providerHasEstimates: false });
            expect(wrapper.find(AlertError)).toHaveLength(1);
        });

        it('should show the success icon when over area on backend but under size', () => {
            setup({
                overArea: true, providerHasEstimates: true,
                overSize: false, availability: {status: 'WARN', type: 'SELECTION_TOO_LARGE'}});
            expect(wrapper.find(ActionDone)).toHaveLength(1);
        });

        it('should show the fatal icon when over area but under size', () => {
            setup({ overArea: true, providerHasEstimates: false, overSize: false});
            expect(wrapper.find(AlertError)).toHaveLength(1);
        });

        it('should show the fatal icon', () => {
            const props = defaultProps();
            props.availability.status = 'FATAL';
            wrapper.setProps(props);
            expect(wrapper.find(AlertError)).toHaveLength(1);
        });

        it('should show the error icon', () => {
            setup({availability: {status: 'ERR'}});
            expect(wrapper.find(AlertError)).toHaveLength(1);
        });

        it('should show the warn icon', () => {
            setup({availability: {status: 'WARN'}});
            expect(wrapper.find(AlertWarning)).toHaveLength(1);
        });

        it('should show the pending icon', () => {
            setup({availability: {status: 'PENDING'}});
            expect(wrapper.find(CircularProgress)).toHaveLength(1);
        });
    });

    // Testing state on functional components with hooks is currently not well supported.
    // describe('it sets the correct state value', () => {
    //     let stateSpy;
    //
    //     beforeEach(() => {
    //         stateSpy = sinon.spy(instance, 'setState');
    //     });
    //
    //     afterEach(() => {
    //         stateSpy.restore();
    //     });
    //
    //     it('handlePopoverOpen sets target in state', () => {
    //         const e = { currentTarget: sinon.spy() };
    //         instance.handlePopoverOpen(e);
    //         expect(stateSpy.calledWith({ anchorEl: e.currentTarget })).toBe(true);
    //     });
    //
    //     it('handlePopoverClose should set null in state', () => {
    //         instance.handlePopoverClose();
    //         expect(stateSpy.calledWith({ anchorEl: null })).toBe(true);
    //     });
    // });
});
