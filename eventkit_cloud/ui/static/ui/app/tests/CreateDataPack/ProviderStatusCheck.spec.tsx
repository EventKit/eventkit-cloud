import * as React from 'react';
import * as sinon from 'sinon';
import {mount} from 'enzyme';
import AlertWarning from '@material-ui/icons/Warning';
import AlertError from '@material-ui/icons/Error';
import ActionDone from '@material-ui/icons/Done';
import CircularProgress from '@material-ui/core/CircularProgress';
import ProviderStatusCheck from '../../components/CreateDataPack/ProviderStatusCheck';
import {Button, Dialog, IconButton, Popover} from "@material-ui/core";
import {act} from "react-dom/test-utils";

describe('ProviderStatusCheck component', () => {
    const defaultProps = () => ({
        availability: {
            status: '',
            type: '',
            message: '',
        },
        userData: {
            accepted_licenses: {},
            user: {
                username: '',
                last_name: '',
                first_name: '',
                email: '',
                commonname: '',
                date_joined: '',
                last_login: '',
                identification: ''
            }},
        provider: '',
        geojson: '',
        areaStr: '',
        overSize: false,
        overArea: false,
        providerInfo: {},
        estimateDataSize: {},
        providerHasEstimates: true,
        areEstimatesLoading: false,
        supportsZoomLevels: true,
        theme: {},
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (propsOverride = {}) => {
        props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = mount(<ProviderStatusCheck {...props} />);
        instance = wrapper.instance();
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

/*  TODO: Complete test placeholders below:
    Testing state on functional components with hooks is currently not well supported.

    it('handlePopoverClose should set null in state', () => {
        instance.handlePopoverClose();
        expect(stateSpy.calledWith({ anchorEl: null })).toBe(true);
    });
    it('handlePopoverOpen sets target in state', () => {
            const e = { currentTarget: sinon.spy() };
            const wrapper = mount(<ProviderStatusCheck/>);
            const instance = wrapper.instance();
            instance.handlePopoverOpen(e);
            expect(wrapper.state('anchorElement')).toBe(null);
            // expect(stateSpy.calledWith({ anchorEl: e.currentTarget })).toBe(true);
        });
        it('renders a popover when clicking on the warning icon', () => {
            const handlePopoverOpen = sinon.spy();
            const wrapper = mount((
                <ProviderStatusCheck handlePopoverOpen={handlePopoverOpen}/>
            ));
            wrapper.find('button').simulate('click');
            expect(handlePopoverOpen).to.have.property('callCount', 1)
        });
        it('renders the submission popover after requesting a larger AOI size', () => {})
    }); */
    });
});
describe('it sets correct values on props', () => {
    it('renders correct prop value for areaStr', () => {
        const wrapper = mount(<ProviderStatusCheck areaStr="34.77"/>);
        expect(wrapper.props().areaStr).toBe('34.77');

        wrapper.setProps({areaStr: '34.77'});
        expect(wrapper.props().areaStr).toBe('34.77');
        wrapper.unmount();
    });
    it('should open the popovers when clicking on the error status icon, then clicking on "Request Larger AOI Limit', () => {
        const initialProps = {
            overArea: true,
            availability: {status: 'FATAL', type: 'AOI TOO LARGE', message: '', slug: 'osm'}
        };
        const wrapper = mount(<ProviderStatusCheck {...initialProps} />);
        const handleSubmissionOpenMock = jest.fn();
        expect(wrapper.find(Popover).props().open).toBe(false);
        expect(wrapper.find(AlertError).length).toBe(1);

        act(() => {
            wrapper
                .find(AlertError)
                .first()
                .simulate('click');
        });
        wrapper.update();
        expect(wrapper.find(Popover).props().open).toBe(true);
        expect(handleSubmissionOpenMock).not.toBeCalled();


        act(() => {
            wrapper
                .find('.ProviderStatusCheck-popoverTitle')
                .first()
                .simulate('click');
        });
        wrapper.update();
        // TODO: test handleSubmissionOpen when requesting larger AOI limit
        // expect(handleSubmissionOpenMock).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
    /* it('should close the popover when clicking the cancel icon', () => {
        const initialProps = {
            overArea: true,
            availability: {status: 'FATAL', type: 'AOI TOO LARGE', message: '', slug: 'osm'}
        };
        const wrapper = mount(<ProviderStatusCheck {...initialProps} />);
        console.log(wrapper.debug())
        expect(wrapper.find(Popover).props().open).toBe(true);
        expect(wrapper.find(IconButton).length).toBe(1);

        act(() => {
            wrapper
                .find(IconButton)
                .first()
                .simulate('click');
        });
        wrapper.update();
        console.log(wrapper.debug())
        expect(wrapper.find(Popover).props().open).toBe(false);
        wrapper.unmount();
    }); */
});
