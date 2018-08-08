import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import TextField from '@material-ui/core/TextField';
import Slider from 'material-ui/Slider';
import Clear from '@material-ui/icons/Clear';
import AlertCallout from '../../components/CreateDataPack/AlertCallout';
import BufferDialog from '../../components/CreateDataPack/BufferDialog';

describe('AlertCallout component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            show: true,
            value: 0,
            valid: true,
            handleBufferClick: () => {},
            handleBufferChange: () => {},
            closeBufferDialog: () => {},
            aoi: {},
        }
    );

    const getWrapper = props => (
        mount(<BufferDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
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
        expect(wrapper.find('.qa-BufferDialog-Button-close').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-Button-buffer').hostNodes()).toHaveLength(1);
        expect(wrapper.find(TextField).props().style.color).toEqual('grey');
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
        props.maxVectorAoiSqKm = -200;
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-BufferDialog-warning')).toHaveLength(1);
    });

    it('should render the alert popup', () => {
        const props = getProps();
        props.maxVectorAoiSqKm = -200;
        const wrapper = getWrapper(props);
        expect(wrapper.find(AlertCallout)).toHaveLength(0);
        wrapper.setState({ showAlert: true });
        expect(wrapper.find(AlertCallout)).toHaveLength(1);
    });

    it('Close buttons should call closeBufferDialog', () => {
        const props = getProps();
        props.closeBufferDialog = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find('.qa-BufferDialog-Button-close').hostNodes().simulate('click');
        expect(props.closeBufferDialog.calledOnce).toBe(true);
    });

    it('Update button should call handleBufferClick', () => {
        const props = getProps();
        props.handleBufferClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find('.qa-BufferDialog-Button-buffer').hostNodes().simulate('click');
        expect(props.handleBufferClick.calledOnce).toBe(true);
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
