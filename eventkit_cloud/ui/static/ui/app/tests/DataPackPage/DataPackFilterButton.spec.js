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
            open: false,
            handleToggle: () => {}
        }
    };
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();

    it('should render a flat button with proper lable', () => {
        const props = getProps();
        const getFontSizeSpy = new sinon.spy(DataPackFilterButton.prototype, 'getLabelFontSize');
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(FlatButton)).toHaveLength(1);
        expect(wrapper.text()).toEqual('Filter');
        expect(getFontSizeSpy.calledOnce).toBe(true);
        getFontSizeSpy.restore();
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

    it('getLableFontSize should return font sizes from 12 to 16 depending on screenSize', () => {
        let props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        window.resizeTo(400, 500);
        expect(window.innerWidth).toEqual(400);
        let size = wrapper.instance().getLabelFontSize();
        expect(size).toEqual('12px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        size = wrapper.instance().getLabelFontSize();
        expect(size).toEqual('13px');

        window.resizeTo(900, 1000);
        expect(window.innerWidth).toEqual(900);
        size = wrapper.instance().getLabelFontSize();
        expect(size).toEqual('14px');

        window.resizeTo(1100, 1200);
        expect(window.innerWidth).toEqual(1100);
        size = wrapper.instance().getLabelFontSize();
        expect(size).toEqual('15px');

        window.resizeTo(1300, 1400);
        expect(window.innerWidth).toEqual(1300);
        size = wrapper.instance().getLabelFontSize();
        expect(size).toEqual('16px');
    });
});
