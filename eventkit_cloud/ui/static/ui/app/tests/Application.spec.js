import React from 'react';
import axios from 'axios';
import sinon from 'sinon';
import {mount} from 'enzyme';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import Subheader from 'material-ui/Subheader';
import MenuItem from 'material-ui/MenuItem';
import { Link, IndexLink } from 'react-router';
import Banner from '../components/Banner';
import {Application} from '../components/Application';
import AVLibraryBooks from 'material-ui/svg-icons/av/library-books';
import ContentAddBox from 'material-ui/svg-icons/content/add-box';
import ActionInfoOutline from 'material-ui/svg-icons/action/info-outline';
import SocialPerson from 'material-ui/svg-icons/social/person';
import ActionExitToApp from 'material-ui/svg-icons/action/exit-to-app';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MockAdapter from 'axios-mock-adapter';

describe('Application component', () => {
    injectTapEventPlugin();

    const getProps = () => {
        return {
            openDrawer: () => {},
            closeDrawer: () => {},
            userData: {},
            drawerOpen: true,
        }
    }

    const getWrapper = (props) => {
        return mount(<Application {...props}/>);
    }

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(MuiThemeProvider)).toHaveLength(1);
        expect(wrapper.find(Banner)).toHaveLength(1);
        expect(wrapper.find('header')).toHaveLength(1);
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(Drawer)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(5);
        expect(wrapper.find(MenuItem).at(0).text()).toEqual('DataPack Library');
        expect(wrapper.find(MenuItem).at(0).find(AVLibraryBooks)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(0).find(IndexLink)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(1).text()).toEqual('Create DataPack');
        expect(wrapper.find(MenuItem).at(1).find(ContentAddBox)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(1).find(Link)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(2).text()).toEqual('About EventKit');
        expect(wrapper.find(MenuItem).at(2).find(ActionInfoOutline)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(2).find(Link)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(3).text()).toEqual('Account Settings');
        expect(wrapper.find(MenuItem).at(3).find(SocialPerson)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(3).find(Link)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(4).text()).toEqual('Log Out');
        expect(wrapper.find(MenuItem).at(4).find(ActionExitToApp)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(4).find(Link)).toHaveLength(1);
    });

    it('should call openDrawer when user data is added and window width is >= 1200', () => {
        let props = getProps();
        props.userData = null;
        props.openDrawer = new sinon.spy();
        const wrapper = getWrapper(props);
        let nextProps = getProps();
        nextProps.userData = {data: {}};
        window.resizeTo(1200, 1000);
        expect(window.innerWidth).toEqual(1200);
        const spy = new sinon.spy(Application.prototype, 'componentWillReceiveProps');
        wrapper.setProps(nextProps);
        expect(spy.calledOnce).toBe(true);
        expect(props.openDrawer.calledOnce).toBe(true);
        spy.restore();
    });

    it('should call getConfig on mount', () => {
        const mountSpy = new sinon.spy(Application.prototype, 'componentDidMount');
        const getSpy = new sinon.spy(Application.prototype, 'getConfig');
        const props = getProps();
        const wrapper = getWrapper();
        expect(mountSpy.calledOnce).toBe(true);
        expect(getSpy.calledOnce).toBe(true);
        mountSpy.restore();
        getSpy.restore();
    });

    it('handleToggle should open and close the drawer', () => {
        let props = getProps();
        props.openDrawer = new sinon.spy();
        props.closeDrawer = new sinon.spy();
        props.drawerOpen = true;
        const wrapper = getWrapper(props);
        wrapper.instance().handleToggle();
        expect(props.closeDrawer.calledOnce).toBe(true);
        wrapper.setProps({...props, drawerOpen: false});
        wrapper.instance().handleToggle();
        expect(props.openDrawer.calledOnce).toBe(true);
    });

    it('handleClose should call closeDrawer', () => {
        let props = getProps();
        props.closeDrawer = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleClose();
        expect(props.closeDrawer.calledOnce).toBe(true);
    });

    it('onMenuItemClick should call handleToggle if screen size is smaller than 1200', () => {
       const props = getProps();
       const toggleSpy = new sinon.spy(Application.prototype, 'handleToggle');
       const wrapper = getWrapper(props); 
       window.resizeTo(1300, 900);
       expect(window.innerWidth).toEqual(1300);
       wrapper.instance().onMenuItemClick();
       expect(toggleSpy.notCalled).toBe(true);
       window.resizeTo(800, 900);
       expect(window.innerWidth).toEqual(800);
       wrapper.instance().onMenuItemClick();
       expect(toggleSpy.calledOnce).toBe(true);
       toggleSpy.restore();
    });

    it('getChildContext should return config', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({config: {key: 'value'}});
        const context = wrapper.instance().getChildContext();
        expect(context).toEqual({config: {key: 'value'}});
    });

    it('getConfig should update the state when config is received', async () => {
        const props = getProps();
        const mock = new MockAdapter(axios, {delayResponse: 100});
        mock.onGet('/configuration').reply(200, {
            LOGIN_DISCLAIMER: 'Test string'
        });
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(Application.prototype, 'setState');
        await wrapper.instance().getConfig();
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({config: {LOGIN_DISCLAIMER: 'Test string'}})).toBe(true);
        stateSpy.restore();
    });
});
