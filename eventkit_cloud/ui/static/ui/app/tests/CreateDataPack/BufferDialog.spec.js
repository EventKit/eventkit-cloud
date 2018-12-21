import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TextField from '@material-ui/core/TextField';
import Slider from '@material-ui/lab/Slider';
import Clear from '@material-ui/icons/Clear';
import AlertCallout from '../../components/CreateDataPack/AlertCallout';
import { BufferDialog } from '../../components/CreateDataPack/BufferDialog';

describe('AlertCallout component', () => {
    const getProps = () => ({
        show: true,
        value: 0,
        valid: true,
        handleBufferClick: () => {},
        handleBufferChange: () => {},
        closeBufferDialog: () => {},
        aoi: {},
        limits: {
            max: 10,
            sizes: [5, 10],
        },
        ...global.eventkit_test_props,
    });

    const getWrapper = props => (
        shallow(<BufferDialog {...props} />)
    );

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-BufferDialog-background')).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-main')).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-header')).toHaveLength(1);
        expect(wrapper.find(TextField)).toHaveLength(1);
        expect(wrapper.find(Clear)).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-body')).toHaveLength(1);
        expect(wrapper.find(Slider)).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-footnote')).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-footer')).toHaveLength(1);
        expect(wrapper.find(TextField).props().style.color).toEqual('#808080');
    });

    it('should not render anything if show is false', () => {
        const props = getProps();
        props.show = false;
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-BufferDialog-main').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.qa-BufferDialog-background').hostNodes()).toHaveLength(0);
    });

    it('should render a warning if the area exceeds the aoi limit', () => {
        const props = getProps();
        props.limits.max = -200;
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-BufferDialog-warning')).toHaveLength(1);
    });

    it('should render the alert popup', () => {
        const props = getProps();
        props.limits.max = -200;
        const wrapper = getWrapper(props);
        expect(wrapper.find(AlertCallout)).toHaveLength(0);
        wrapper.setState({ showAlert: true });
        expect(wrapper.find(AlertCallout)).toHaveLength(1);
    });

    it('Clear icon should call closeBufferDialog on click', () => {
        const props = getProps();
        props.closeBufferDialog = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(Clear).simulate('click');
        expect(props.closeBufferDialog.calledOnce).toBe(true);
    });

    it('showAlert should set showAlert true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().showAlert();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAlert: true })).toBe(true);
        stateStub.restore();
    });

    it('closeAlert should set showAlert false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().closeAlert();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAlert: false })).toBe(true);
        stateStub.restore();
    });
});
