import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import AlertWarning from '@material-ui/icons/Warning';
import AlertError from '@material-ui/icons/Error';
import ActionDone from '@material-ui/icons/Done';
import CircularProgress from '@material-ui/core/CircularProgress';
import { ProviderStatusIcon } from '../../components/CreateDataPack/ProviderStatusIcon';

describe('ProviderStatusIcon component', () => {
    let wrapper;
    let instance;

    const defaultProps = () => ({
        availability: {
            status: '',
            type: '',
            message: '',
        },
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<ProviderStatusIcon {...props} />);
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

        it('should show the fatal icon', () => {
            const props = defaultProps();
            props.availability.status = 'FATAL';
            wrapper.setProps(props);
            expect(wrapper.find(AlertError)).toHaveLength(1);
        });

        it('should show the error icon', () => {
            const props = defaultProps();
            props.availability.status = 'ERR';
            wrapper.setProps(props);
            expect(wrapper.find(AlertError)).toHaveLength(1);
        });

        it('should show the warn icon', () => {
            const props = defaultProps();
            props.availability.status = 'WARN';
            wrapper.setProps(props);
            expect(wrapper.find(AlertWarning)).toHaveLength(1);
        });

        it('should show the pending icon', () => {
            const props = defaultProps();
            props.availability.status = 'PENDING';
            wrapper.setProps(props);
            expect(wrapper.find(CircularProgress)).toHaveLength(1);
        });
    });

    describe('it sets the correct state value', () => {
        let stateSpy;

        beforeEach(() => {
            stateSpy = sinon.spy(instance, 'setState');
        });

        afterEach(() => {
            stateSpy.restore();
        });

        it('handlePopoverOpen sets target in state', () => {
            const e = { currentTarget: sinon.spy() };
            instance.handlePopoverOpen(e);
            expect(stateSpy.calledWith({ anchorEl: e.currentTarget })).toBe(true);
        });

        it('handlePopoverClose should set null in state', () => {
            instance.handlePopoverClose();
            expect(stateSpy.calledWith({ anchorEl: null })).toBe(true);
        });
    });
});
