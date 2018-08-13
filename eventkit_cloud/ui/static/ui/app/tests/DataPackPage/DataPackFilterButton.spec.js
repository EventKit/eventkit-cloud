import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import FlatButton from 'material-ui/FlatButton';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackFilterButton from '../../components/DataPackPage/DataPackFilterButton';

describe('DataPackFilterButton component', () => {
    const getProps = () => ({
        active: false,
        handleToggle: () => {},
    });
    const muiTheme = getMuiTheme();

    it('should render a flat button with proper label', () => {
        const props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(FlatButton)).toHaveLength(1);
        expect(wrapper.text()).toEqual('SHOW FILTERS');

        const nextProps = getProps();
        nextProps.active = true;
        wrapper.setProps(nextProps);
        expect(wrapper.text()).toEqual('HIDE FILTERS');
    });

    it('should call handleToggle', () => {
        const props = getProps();
        props.handleToggle = sinon.spy();
        const wrapper = mount(<DataPackFilterButton {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        wrapper.find('button').simulate('click');
        expect(props.handleToggle.calledOnce).toBe(true);
    });

    it('should display differently on small vs large screens', () => {
        global.window.resizeTo(1000, 900);
        expect(global.window.innerWidth).toBe(1000);
        const props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(FlatButton).props().style.width).toEqual('90px');
        expect(wrapper.find(FlatButton).props().labelStyle.fontSize).toEqual('12px');

        global.window.resizeTo(400, 500);
        expect(global.window.innerWidth).toBe(400);
        wrapper.instance().forceUpdate();
        wrapper.update();
        expect(wrapper.find(FlatButton).props().style.width).toEqual('40px');
        expect(wrapper.find(FlatButton).props().labelStyle.fontSize).toEqual('10px');
    });
});
