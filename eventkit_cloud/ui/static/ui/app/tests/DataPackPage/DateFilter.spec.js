import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import moment from 'moment';
import DayPicker from 'react-day-picker';
import Modal from '@material-ui/core/Modal';
import Input from '@material-ui/core/Input';
import { DateFilter } from '../../components/DataPackPage/DateFilter';

describe('DateFilter component', () => {
    const getProps = () => ({
        onMinChange: () => {},
        onMaxChange: () => {},
        minDate: null,
        maxDate: null,
        ...global.eventkit_test_props,
    });

    const getWrapper = props => ((
        shallow(<DateFilter {...props} />)
    ));

    it('should render a title and two date pickers Modals', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('p').text()).toEqual('Date Added');
        expect(wrapper.find(Modal)).toHaveLength(2);
        expect(wrapper.find(Input)).toHaveLength(2);
        expect(wrapper.find(Input).first().props().placeholder).toEqual('From');
        expect(wrapper.find(Input).last().props().placeholder).toEqual('To');
        expect(wrapper.find(Modal).first().dive().find(DayPicker)).toHaveLength(1);
        expect(wrapper.find(Modal).last().dive().find(DayPicker)).toHaveLength(1);
    });

    it('handleMinOpen should set open to min', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleMinOpen();
        expect(stub.calledWithExactly({ open: 'min' })).toBe(true);
    });

    it('handleMaxOpen should set open to max', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleMaxOpen();
        expect(stub.calledWithExactly({ open: 'max' })).toBe(true);
    });

    it('handleClose should set open to empty string', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleClose();
        expect(stub.calledWithExactly({ open: '' })).toBe(true);
    });

    it('handleMinUpdate should call close and onMinChange', () => {
        const props = getProps();
        props.onMinChange = sinon.spy();
        const wrapper = getWrapper(props);
        const closeStub = sinon.stub(wrapper.instance(), 'handleClose');
        const date = new Date();
        const expected = moment(date).toISOString();
        wrapper.instance().handleMinUpdate(date);
        expect(closeStub.calledOnce).toBe(true);
        expect(props.onMinChange.calledWithExactly(expected)).toBe(true);
    });

    it('handleMaxUpdate should call close and onMaxChange', () => {
        const props = getProps();
        props.onMaxChange = sinon.spy();
        const wrapper = getWrapper(props);
        const closeStub = sinon.stub(wrapper.instance(), 'handleClose');
        const date = new Date();
        const expected = moment(date).toISOString();
        wrapper.instance().handleMaxUpdate(date);
        expect(closeStub.calledOnce).toBe(true);
        expect(props.onMaxChange.calledWithExactly(expected)).toBe(true);
    });
});
