import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import BaseDialog from '../../components/BaseDialog';
import { BufferButton } from '../../components/MapTools/BufferButton';

describe('BufferButton component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            onBufferClick: () => {},
        }
    );

    const getWrapper = props => (
        mount(<BufferButton {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        })
    );

    it('should display a buffer button with BaseDialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-BufferButton-button')).toHaveLength(1);
        expect(wrapper.find('.qa-BufferButton-button').text()).toEqual('BUFFER');
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).props().title).toEqual('Buffer Feature');
        expect(wrapper.find(BaseDialog).props().actions).toHaveLength(1);
    });

    it('onBufferClick should call props.onBufferClick and close the dialog', () => {
        const props = getProps();
        props.onBufferClick = sinon.spy();
        const closeSpy = sinon.spy(BufferButton.prototype, 'closeBufferDialog');
        const wrapper = getWrapper(props);
        wrapper.instance().onBufferClick();
        expect(props.onBufferClick.calledOnce).toBe(true);
        expect(props.onBufferClick.calledWith(wrapper.state().buffer)).toBe(true);
        expect(closeSpy.calledOnce).toBe(true);
        closeSpy.restore();
    });

    it('openBufferDialog should set showDialog to true', () => {
        const props = getProps();
        const stateSpy = sinon.spy(BufferButton.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().openBufferDialog();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showDialog: true })).toBe(true);
        stateSpy.restore();
    });

    it('closeBufferDialog should set showDialog to false', () => {
        const props = getProps();
        const stateSpy = sinon.spy(BufferButton.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().closeBufferDialog();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showDialog: false, buffer: 0 })).toBe(true);
        stateSpy.restore();
    });

    it('handleBufferChange should set buffer value', () => {
        const props = getProps();
        const stateSpy = sinon.spy(BufferButton.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleBufferChange({}, 66);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ buffer: 66 })).toBe(true);
    });
});
