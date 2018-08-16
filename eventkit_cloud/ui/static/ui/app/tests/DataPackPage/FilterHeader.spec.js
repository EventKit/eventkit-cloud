import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import FilterHeader from '../../components/DataPackPage/FilterHeader';

describe('FilterHeader component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => ({
        onApply: () => {},
        onClear: () => {},
    });

    it('should render a RaisedButton and a FlatButton', () => {
        const props = getProps();
        const wrapper = mount(<FilterHeader {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(RaisedButton)).toHaveLength(1);
        expect(wrapper.find(RaisedButton).text()).toEqual('Apply');
        expect(wrapper.find(RaisedButton).props().onClick).toEqual(props.onApply);
        expect(wrapper.find(FlatButton)).toHaveLength(1);
        expect(wrapper.find(FlatButton).text()).toEqual('Clear All');
        expect(wrapper.find(FlatButton).props().onClick).toEqual(props.onClear);
    });

    it('should call onApply when RaisedButton is clicked', () => {
        const props = getProps();
        props.onApply = sinon.spy();
        const wrapper = mount(<FilterHeader {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        wrapper.find(RaisedButton).find('button').simulate('click');
        expect(props.onApply.calledOnce).toBe(true);
    });

    it('should call onClear when FlatButton is clicked', () => {
        const props = getProps();
        props.onClear = sinon.spy();
        const wrapper = mount(<FilterHeader {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        wrapper.find(FlatButton).find('button').simulate('click');
        expect(props.onClear.calledOnce).toBe(true);
    });
});
