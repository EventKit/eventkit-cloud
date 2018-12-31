import * as React from 'react';
import { shallow } from 'enzyme';
import * as sinon from 'sinon';
import * as moment from 'moment';
import DayPicker from 'react-day-picker';
import Modal from '@material-ui/core/Modal';
import Input from '@material-ui/core/Input';
import { DateFilter } from '../../components/DataPackPage/DateFilter';

describe('DateFilter component', () => {
    const getProps = () => ({
        onMinChange: sinon.spy(),
        onMaxChange: sinon.spy(),
        minDate: null,
        maxDate: null,
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DateFilter {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render a title and two date pickers Modals', () => {
        expect(wrapper.find('p').text()).toEqual('Date Added');
        expect(wrapper.find(Modal)).toHaveLength(2);
        expect(wrapper.find(Input)).toHaveLength(2);
        expect(wrapper.find(Input).first().props().placeholder).toEqual('From');
        expect(wrapper.find(Input).last().props().placeholder).toEqual('To');
        expect(wrapper.find(Modal).first().dive().find(DayPicker)).toHaveLength(1);
        expect(wrapper.find(Modal).last().dive().find(DayPicker)).toHaveLength(1);
    });

    it('handleMinOpen should set open to min', () => {
        const stub = sinon.stub(instance, 'setState');
        instance.handleMinOpen();
        expect(stub.calledWithExactly({ open: 'min' })).toBe(true);
    });

    it('handleMaxOpen should set open to max', () => {
        const stub = sinon.stub(instance, 'setState');
        instance.handleMaxOpen();
        expect(stub.calledWithExactly({ open: 'max' })).toBe(true);
    });

    it('handleClose should set open to empty string', () => {
        const stub = sinon.stub(instance, 'setState');
        instance.handleClose();
        expect(stub.calledWithExactly({ open: '' })).toBe(true);
    });

    it('handleMinUpdate should call close and onMinChange', () => {
        const closeStub = sinon.stub(instance, 'handleClose');
        const date = new Date();
        const expected = moment(date).toISOString();
        instance.handleMinUpdate(date);
        expect(closeStub.calledOnce).toBe(true);
        expect(props.onMinChange.calledWithExactly(expected)).toBe(true);
    });

    it('handleMaxUpdate should call close and onMaxChange', () => {
        const closeStub = sinon.stub(instance, 'handleClose');
        const date = new Date();
        const expected = moment(date).toISOString();
        instance.handleMaxUpdate(date);
        expect(closeStub.calledOnce).toBe(true);
        expect(props.onMaxChange.calledWithExactly(expected)).toBe(true);
    });
});
