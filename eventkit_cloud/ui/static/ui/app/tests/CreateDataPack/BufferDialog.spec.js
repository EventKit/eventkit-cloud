import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import Slider from 'material-ui/Slider';
import Clear from 'material-ui/svg-icons/content/clear';
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
        }
    );

    const getWrapper = props => (
        mount(<BufferDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
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
        expect(wrapper.find('.qa-BufferDialog-FlatButton-close')).toHaveLength(1);
        expect(wrapper.find('.qa-BufferDialog-RaisedButton-buffer')).toHaveLength(1);
        expect(wrapper.find(RaisedButton).props().labelStyle.color).toEqual('whitesmoke');
        expect(wrapper.find(RaisedButton).props().buttonStyle.backgroundColor).toEqual('#4598bf');
        expect(wrapper.find(TextField).props().inputStyle.color).toEqual('grey');
    });

    it('should not render anything if show is false', () => {
        const props = getProps();
        props.show = false;
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-BufferDialog-main')).toHaveLength(0);
        expect(wrapper.find('.qa-BufferDialog-background')).toHaveLength(0);
    });

    it('Close buttons should call closeBufferDialog', () => {
        const props = getProps();
        props.closeBufferDialog = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(FlatButton).simulate('click');
        expect(props.closeBufferDialog.calledOnce).toBe(true);
    });

    it('Update button should call handleBufferClick', () => {
        const props = getProps();
        props.handleBufferClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RaisedButton).find('button').simulate('click');
        expect(props.handleBufferClick.calledOnce).toBe(true);
    });

    it('Clear icon should call closeBufferDialog on click', () => {
        const props = getProps();
        props.closeBufferDialog = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(Clear).simulate('click');
        expect(props.closeBufferDialog.calledOnce).toBe(true);
    });
});
