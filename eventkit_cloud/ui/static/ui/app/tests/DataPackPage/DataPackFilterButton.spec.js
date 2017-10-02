import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import FlatButton from 'material-ui/FlatButton';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackFilterButton from '../../components/DataPackPage/DataPackFilterButton';

describe('DataPackFilterButton component', () => {
    const getProps = () => {
        return {
            active: false,
            handleToggle: () => {}
        }
    };
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();

    it('should render a flat button with proper label', () => {
        const props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(FlatButton)).toHaveLength(1);
        expect(wrapper.text()).toEqual('SHOW FILTERS');

        let nextProps = getProps();
        nextProps.active = true;
        wrapper.setProps(nextProps);
        expect(wrapper.text()).toEqual('HIDE FILTERS');
    });

    it('should call handleToggle', () => {
        let props = getProps();
        props.handleToggle = new sinon.spy();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find('button').simulate('click');
        expect(props.handleToggle.calledOnce).toBe(true);
    });

    it('should display differently on small vs large screens', () => {
        window.resizeTo(1000, 900);
        expect(window.innerWidth).toBe(1000);
        const props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(FlatButton).props().style.width).toEqual('90px');
        expect(wrapper.find(FlatButton).props().labelStyle.fontSize).toEqual('12px');

        window.resizeTo(400, 500);
        expect(window.innerWidth).toBe(400);
        wrapper.update();
        expect(wrapper.find(FlatButton).props().style.width).toEqual('40px');
        expect(wrapper.find(FlatButton).props().labelStyle.fontSize).toEqual('10px');
    });
});
