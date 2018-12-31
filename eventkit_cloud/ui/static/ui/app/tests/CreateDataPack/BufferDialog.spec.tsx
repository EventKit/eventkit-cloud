import * as React from 'react';
import * as sinon from 'sinon';
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
        handleBufferClick: sinon.spy(),
        handleBufferChange: sinon.spy(),
        closeBufferDialog: sinon.spy(),
        aoi: {},
        limits: {
            max: 10,
            sizes: [5, 10],
        },
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<BufferDialog {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic elements', () => {
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
        wrapper.setProps({ show: false });
        expect(wrapper.find('.qa-BufferDialog-main').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.qa-BufferDialog-background').hostNodes()).toHaveLength(0);
    });

    it('should render a warning if the area exceeds the aoi limit', () => {
        wrapper.setProps({ limits: { ...props.limits, max: -200 }});
        expect(wrapper.find('.qa-BufferDialog-warning')).toHaveLength(1);
    });

    it('should render the alert popup', () => {
        wrapper.setProps({ limits: { ...props.limits, max: -200 }});
        expect(wrapper.find(AlertCallout)).toHaveLength(0);
        wrapper.setState({ showAlert: true });
        expect(wrapper.find(AlertCallout)).toHaveLength(1);
    });

    it('Clear icon should call closeBufferDialog on click', () => {
        wrapper.find(Clear).simulate('click');
        expect(props.closeBufferDialog.calledOnce).toBe(true);
    });

    it('showAlert should set showAlert true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.showAlert();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAlert: true })).toBe(true);
        stateStub.restore();
    });

    it('closeAlert should set showAlert false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.closeAlert();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAlert: false })).toBe(true);
        stateStub.restore();
    });
});
