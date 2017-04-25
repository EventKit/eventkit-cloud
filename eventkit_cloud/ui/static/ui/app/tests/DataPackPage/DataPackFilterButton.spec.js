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

    it('it should change fontSize when screensize updates', () => {
        let props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(window.innerWidth).toEqual(1024);
        const updateSpy = new sinon.spy(DataPackFilterButton.prototype, 'componentWillUpdate');
        const stateSpy = new sinon.spy(DataPackFilterButton.prototype, 'setState');
        window.resizeTo(922, 800);
        expect(window.innerWidth).toEqual(922);
        wrapper.update();
        expect(updateSpy.calledThrice).toBe(true);
        expect(stateSpy.calledWith({labelFontSize: '14px'}));
        expect(wrapper.state().labelFontSize).toEqual('14px');
        window.resizeTo(430, 600);
        expect(window.innerWidth).toEqual(430);
        wrapper.update();
        expect(updateSpy.callCount).toEqual(6);
        expect(stateSpy.calledWith({labelFontSize: '12px'}));
        expect(wrapper.state().labelFontSize).toEqual('12px');
        updateSpy.restore();
        stateSpy.restore();
    });

    it('getLableFontSize should return font sizes from 12 to 16 depending on screenSize', () => {
        let props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let size = wrapper.instance().getLabelFontSize(400);
        expect(size).toEqual('12px');
        size = wrapper.instance().getLabelFontSize(700);
        expect(size).toEqual('13px');
        size = wrapper.instance().getLabelFontSize(900);
        expect(size).toEqual('14px');
        size = wrapper.instance().getLabelFontSize(1100);
        expect(size).toEqual('15px');
        size = wrapper.instance().getLabelFontSize(1300);
        expect(size).toEqual('16px');
    });
});
