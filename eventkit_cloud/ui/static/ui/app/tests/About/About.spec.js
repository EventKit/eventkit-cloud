import React from 'react';
import {mount, shallow} from 'enzyme';
import sinon from 'sinon';
import AppBar from 'material-ui/AppBar';
import About from '../../components/About/About';
import QuickTourSection from '../../components/About/QuickTourSection';
import CustomScrollbar from '../../components/CustomScrollbar';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('About component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getWrapper = () => {
        return mount(<About/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    }
    it('should render all the basic elements', () => {
        const wrapper = getWrapper();
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(AppBar).text()).toEqual('About EventKit');
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('h4')).toHaveLength(4);
        expect(wrapper.find('h4').at(0).text()).toEqual('Overview');
        expect(wrapper.find('#aboutEventkitText')).toHaveLength(1);
        expect(wrapper.find('h4').at(1).text()).toEqual('What is a DataPack?');
        expect(wrapper.find('#aboutDataPackText')).toHaveLength(1);
        expect(wrapper.find('table')).toHaveLength(1);
        expect(wrapper.find('tbody')).toHaveLength(1);
        expect(wrapper.find('tr')).toHaveLength(1);
        expect(wrapper.find('td')).toHaveLength(3);
        expect(wrapper.find('td').at(0).find('img')).toHaveLength(1);
        expect(wrapper.find('td').at(0).find('div').text()).toEqual('Create DataPacks');
        expect(wrapper.find('td').at(1).find('img')).toHaveLength(1);
        expect(wrapper.find('td').at(1).find('div').text()).toEqual('Manage DataPacks');
        expect(wrapper.find('td').at(2).find('img')).toHaveLength(1);
        expect(wrapper.find('td').at(2).find('div').text()).toEqual('Use with other open source geospatial software like QGIS');
        expect(wrapper.find('h3').text()).toEqual('Quick Tour');
        expect(wrapper.find('h4').at(2).text()).toEqual('MANAGE DATAPACKS');
        expect(wrapper.find(QuickTourSection)).toHaveLength(5);
        expect(wrapper.find('h4').at(3).text()).toEqual('CREATE DATAPACKS');
    });

    it('should add event listener on mount', () => {
        const mountSpy = new sinon.spy(About.prototype, 'componentWillMount');
        const eventSpy = new sinon.spy(window, 'addEventListener');
        const wrapper = getWrapper();
        expect(mountSpy.calledOnce).toBe(true);
        expect(eventSpy.calledOnce).toBe(true);
        expect(eventSpy.calledWith('resize', wrapper.instance().handleResize)).toBe(true);
        mountSpy.restore();
        eventSpy.restore();
    });

    it('should remove event lister on unmount', () => {
        const unmountSpy = new sinon.spy(About.prototype, 'componentWillUnmount');
        const eventSpy = new sinon.spy(window, 'removeEventListener');
        const wrapper = getWrapper();
        const resize = wrapper.instance().handleResize;
        wrapper.unmount();
        expect(unmountSpy.calledOnce).toBe(true);
        expect(eventSpy.calledOnce).toBe(true);
        expect(eventSpy.calledWith('resize', resize)).toBe(true);
        unmountSpy.restore();
        eventSpy.restore();
    });

    it('handle resize should call forceUpdate', () => {
        const updateSpy = new sinon.spy(About.prototype, 'forceUpdate');
        const wrapper = getWrapper();
        wrapper.instance().handleResize();
        expect(updateSpy.calledOnce);
        updateSpy.restore();
    });

    it('should set table fontsize to 14px', () => {
        const wrapper = getWrapper();
        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        wrapper.update();
        expect(wrapper.find('table').props().style.fontSize).toEqual('14px');
    });

    it('should set table fontSize to 16px', () => {
        const wrapper = getWrapper();
        window.resizeTo(1300, 1000);
        expect(window.innerWidth).toEqual(1300);
        wrapper.update();
        expect(wrapper.find('table').props().style.fontSize).toEqual('16px');
    });
});
