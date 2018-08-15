import React from 'react';
import axios from 'axios';
import sinon from 'sinon';
import PropTypes from 'prop-types';
import { mount, shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import AppBar from '@material-ui/core/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import { Link, IndexLink } from 'react-router';
import Dashboard from '@material-ui/icons/Dashboard';
import AVLibraryBooks from '@material-ui/icons/LibraryBooks';
import ContentAddBox from '@material-ui/icons/AddBox';
import ActionInfoOutline from '@material-ui/icons/InfoOutlined';
import SocialPerson from '@material-ui/icons/Person';
import SocialGroup from '@material-ui/icons/Group';
import ActionExitToApp from '@material-ui/icons/ExitToApp';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import MockAdapter from 'axios-mock-adapter';
import BaseDialog from '../components/Dialog/BaseDialog';
import Banner from '../components/Banner';
import { Application } from '../components/Application';
import ConfirmDialog from '../components/Dialog/ConfirmDialog';
import NotificationsDropdown from '../components/Notification/NotificationsDropdown';

const mockStore = configureMockStore();
const store = mockStore({});

describe('Application component', () => {
    const getProps = () => ({
        userData: {},
        drawer: 'open',
        router: {
            push: () => {},
            location: {
                pathname: '/exports',
            },
        },
        notifications: {
            fetching: false,
            fetched: false,
            notifications: {},
            notificationsSorted: [],
            unreadCount: {
                fetching: false,
                fetched: false,
                unreadCount: 0,
            },
        },
        store,
        openDrawer: () => {},
        closeDrawer: () => {},
        userActive: () => {},
        getNotifications: sinon.spy(),
        getNotificationsUnreadCount: () => {},
    });

    const getMountedWrapper = props => mount(<Application {...props} />, {
        context: { store },
        childContextTypes: { store: PropTypes.object },
    });

    const getShallowWrapper = props => shallow(<Application {...props} />);

    const mountFunc = Application.prototype.componentDidMount;

    beforeAll(() => {
        Application.prototype.componentDidMount = sinon.spy();
    });

    afterAll(() => {
        Application.prototype.componentDidMount = mountFunc;
    });

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(MuiThemeProvider)).toHaveLength(1);
        expect(wrapper.find(Banner)).toHaveLength(1);
        expect(wrapper.find('header')).toHaveLength(1);
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find('.qa-Application-AppBar-MenuButton').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.qa-Application-AppBar-NotificationsButton').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.qa-Application-AppBar-NotificationsIndicator').hostNodes()).toHaveLength(1);
        expect(wrapper.find(NotificationsDropdown)).toHaveLength(1);
        expect(wrapper.find(Drawer)).toHaveLength(1);
        expect(wrapper.find(BaseDialog)).toHaveLength(3);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(7);
        expect(wrapper.find(MenuItem).at(0).text()).toEqual('Dashboard');
        expect(wrapper.find(MenuItem).at(0).find(Dashboard)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(0).find(IndexLink)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(1).text()).toEqual('DataPack Library');
        expect(wrapper.find(MenuItem).at(1).find(AVLibraryBooks)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(1).find(Link)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(2).text()).toEqual('Create DataPack');
        expect(wrapper.find(MenuItem).at(2).find(ContentAddBox)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(2).find(Link)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(3).text()).toEqual('Members and Groups');
        expect(wrapper.find(MenuItem).at(3).find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(3).find(Link)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(4).text()).toEqual('About EventKit');
        expect(wrapper.find(MenuItem).at(4).find(ActionInfoOutline)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(4).find(Link)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(5).text()).toEqual('Account Settings');
        expect(wrapper.find(MenuItem).at(5).find(SocialPerson)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(5).find(Link)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(6).text()).toEqual('Log Out');
        expect(wrapper.find(MenuItem).at(6).find(ActionExitToApp)).toHaveLength(1);
        expect(wrapper.find(MenuItem).at(6).find(Link)).toHaveLength(1);
    });

    it('the menu items should call handleMouseOver with the route name', () => {
        const props = getProps();
        const handleSpy = sinon.spy();
        const wrapper = getShallowWrapper(props);
        wrapper.instance().handleMouseOver = handleSpy;
        expect(handleSpy.called).toBe(false);
        wrapper.find('.qa-Application-Link-dashboard').simulate('mouseEnter');
        expect(handleSpy.callCount).toBe(1);
        expect(handleSpy.calledWith('/dashboard')).toBe(true);

        wrapper.find('.qa-Application-Link-exports').simulate('mouseEnter');
        expect(handleSpy.callCount).toBe(2);
        expect(handleSpy.calledWith('/exports')).toBe(true);

        wrapper.find('.qa-Application-Link-create').simulate('mouseEnter');
        expect(handleSpy.callCount).toBe(3);
        expect(handleSpy.calledWith('/create')).toBe(true);

        wrapper.find('.qa-Application-Link-about').simulate('mouseEnter');
        expect(handleSpy.callCount).toBe(4);
        expect(handleSpy.calledWith('/about')).toBe(true);

        wrapper.find('.qa-Application-Link-account').simulate('mouseEnter');
        expect(handleSpy.callCount).toBe(5);
        expect(handleSpy.calledWith('/account')).toBe(true);

        wrapper.find('.qa-Application-Link-logout').simulate('mouseEnter');
        expect(handleSpy.callCount).toBe(6);
        expect(handleSpy.calledWith('/logout')).toBe(true);
    });

    it('should call openDrawer when user data is added and window width is >= 1200', () => {
        const props = getProps();
        props.userData = null;
        props.openDrawer = sinon.spy();
        const wrapper = getShallowWrapper(props);
        const nextProps = getProps();
        nextProps.userData = { data: {} };
        window.resizeTo(1200, 1000);
        expect(window.innerWidth).toEqual(1200);
        const spy = sinon.spy(Application.prototype, 'componentWillReceiveProps');
        wrapper.setProps(nextProps);
        expect(spy.calledOnce).toBe(true);
        expect(props.openDrawer.calledOnce).toBe(true);
        spy.restore();
    });

    it('should call getConfig, getNotifications, and addEventListener on mount', () => {
        Application.prototype.componentDidMount = mountFunc;
        const getStub = sinon.stub(Application.prototype, 'getConfig');
        const eventSpy = sinon.spy(window, 'addEventListener');
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(getStub.calledOnce).toBe(true);
        expect(props.getNotifications.callCount).toBe(1);
        expect(eventSpy.called).toBe(true);
        expect(eventSpy.calledWith('resize', wrapper.instance().handleResize)).toBe(true);
        getStub.restore();
        eventSpy.restore();
        Application.prototype.componentDidMount = sinon.spy();
    });

    it('should remove event listener on unmount', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        const resize = wrapper.instance().handleResize;
        const eventSpy = sinon.spy(window, 'removeEventListener');
        expect(eventSpy.called).toBe(false);
        wrapper.unmount();
        expect(eventSpy.called).toBe(true);
        expect(eventSpy.calledWith('resize', resize)).toBe(true);
        eventSpy.restore();
    });

    it('handleResize should call forceUpdate', () => {
        const updateSpy = sinon.spy(Application.prototype, 'forceUpdate');
        const props = getProps();
        const wrapper = getShallowWrapper(props);
        expect(updateSpy.called).toBe(false);
        wrapper.instance().handleResize();
        expect(updateSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });

    it('handleToggle should open and close the drawer', () => {
        const props = getProps();
        props.openDrawer = sinon.spy();
        props.closeDrawer = sinon.spy();
        props.drawer = 'open';
        const wrapper = getShallowWrapper(props);
        wrapper.instance().handleToggle();
        expect(props.closeDrawer.callCount).toBe(1);
        wrapper.setProps({ ...props, drawer: 'closed' });
        wrapper.instance().handleToggle();
        expect(props.openDrawer.callCount).toBe(2);
    });

    it('onMenuItemClick should call handleToggle if screen size is smaller than 1200', () => {
        const props = getProps();
        const toggleSpy = sinon.spy(Application.prototype, 'handleToggle');
        const wrapper = getShallowWrapper(props);
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
        const wrapper = getShallowWrapper(props);
        wrapper.setState({ config: { key: 'value' } });
        const context = wrapper.instance().getChildContext();
        expect(context).toEqual({ config: { key: 'value' } });
    });

    it('getConfig should update the state when config is received', async () => {
        const props = getProps();
        const mock = new MockAdapter(axios, { delayResponse: 100 });
        mock.onGet('/configuration').reply(200, {
            LOGIN_DISCLAIMER: 'Test string',
        });
        const stateSpy = sinon.spy(Application.prototype, 'setState');
        const wrapper = getShallowWrapper(props);
        await wrapper.instance().getConfig();
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({ config: { LOGIN_DISCLAIMER: 'Test string' } })).toBe(true);
        stateSpy.restore();
    });

    it('handleMouseOver should set the passed in route as the hovered state', () => {
        const props = getProps();
        const stateSpy = sinon.spy();
        const wrapper = getShallowWrapper(props);
        wrapper.instance().setState = stateSpy;
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleMouseOver('test string');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ hovered: 'test string' })).toBe(true);
    });

    it('handleMouseOut should set the hovered state to an empty string', () => {
        const props = getProps();
        const stateSpy = sinon.spy();
        const wrapper = getShallowWrapper(props);
        wrapper.instance().setState = stateSpy;
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleMouseOut();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ hovered: '' })).toBe(true);
    });

    it('Auto logout warning should show remaining minutes when above one minute', () => {
        jest.useFakeTimers();
        const props = getProps();
        // Set auto logout time to 5 minutes from now.
        props.autoLogoutAt = new Date(Date.now() + (5 * 60 * 1000));
        props.autoLogoutWarningAt = new Date(Date.now() - 1000);
        const wrapper = getShallowWrapper(props);
        wrapper.instance().startCheckingForAutoLogout();
        jest.runOnlyPendingTimers();
        expect(wrapper.state().showAutoLogoutWarningDialog).toBe(true);
        expect(wrapper.state().autoLogoutWarningText).toContain('5 minutes');
    });

    it('Auto logout warning should show remaining seconds at one minute or less', () => {
        jest.useFakeTimers();
        const props = getProps();
        // Set auto logout time to 60 seconds from now.
        props.autoLogoutAt = new Date(Date.now() + (60 * 1000));
        props.autoLogoutWarningAt = new Date(Date.now() - 1000);
        const wrapper = getShallowWrapper(props);
        wrapper.instance().startCheckingForAutoLogout();
        jest.runOnlyPendingTimers();
        expect(wrapper.state().showAutoLogoutWarningDialog).toBe(true);
        expect(wrapper.state().autoLogoutWarningText).toContain('60 seconds');
    });

    it('Auto logged out alert should show after exceeding auto logout time', () => {
        jest.useFakeTimers();
        const props = getProps();
        // Set auto logout time to 1 second in the past.
        props.autoLogoutAt = new Date(Date.now() - 1000);
        props.autoLogoutWarningAt = new Date(Date.now());
        const wrapper = getShallowWrapper(props);
        wrapper.instance().startCheckingForAutoLogout();
        jest.runOnlyPendingTimers();
        expect(wrapper.state().showAutoLoggedOutDialog).toBe(true);
    });

    it('handleLogoutClick should set showLogoutDialog to true', () => {
        const wrapper = getShallowWrapper(getProps());
        expect(wrapper.state().showLogoutDialog).toBe(false);
        wrapper.instance().handleLogoutClick();
        expect(wrapper.state().showLogoutDialog).toBe(true);
    });

    it('handleLogoutDialogCancel should set showLogoutDialog to false', () => {
        const wrapper = getShallowWrapper(getProps());
        wrapper.setState({
            showLogoutDialog: true,
        });
        wrapper.instance().handleLogoutDialogCancel();
        expect(wrapper.state().showLogoutDialog).toBe(false);
    });

    it('handleLogoutDialogConfirm() should set showLogoutDialog to false and call logout()', () => {
        const logoutSpy = sinon.spy(Application.prototype, 'logout');
        const wrapper = getShallowWrapper(getProps());
        wrapper.setState({
            showLogoutDialog: true,
        });
        wrapper.instance().handleLogoutDialogConfirm();
        expect(wrapper.state().showLogoutDialog).toBe(false);
        expect(logoutSpy.calledOnce).toBe(true);
        logoutSpy.restore();
    });

    it('should start listening for notifications on user login', () => {
        const startListeningForNotificationsSpy = sinon.spy(Application.prototype, 'startListeningForNotifications');
        const props = {
            ...getProps(),
            userData: null,
        };
        const wrapper = getMountedWrapper(props);
        const instance = wrapper.instance();
        expect(startListeningForNotificationsSpy.callCount).toBe(0);
        expect(instance.notificationsRefreshIntervalId).toBe(null);
        expect(instance.notificationsUnreadCountIntervalId).toBe(null);
        wrapper.setProps({
            userData: {},
        });
        expect(startListeningForNotificationsSpy.callCount).toBe(1);
        expect(instance.notificationsRefreshIntervalId).not.toBe(null);
        expect(instance.notificationsUnreadCountIntervalId).not.toBe(null);
        startListeningForNotificationsSpy.restore();
    });

    it('should stop listening for notifications on user logout', () => {
        const stopListeningForNotificationsSpy = sinon.spy(Application.prototype, 'stopListeningForNotifications');
        const wrapper = getMountedWrapper(getProps());
        const instance = wrapper.instance();
        instance.loggedIn = true;
        wrapper.setProps({
            userData: null,
        });
        expect(stopListeningForNotificationsSpy.callCount).toBe(1);
        expect(instance.notificationsRefreshIntervalId).toBe(null);
        expect(instance.notificationsUnreadCountIntervalId).toBe(null);
        stopListeningForNotificationsSpy.restore();
    });

    it('should change notifications button background color when viewing notifications page', () => {
        const wrapper = getMountedWrapper(getProps());
        let button = wrapper.find('.qa-Application-AppBar-NotificationsButton').at(0);
        expect(button.props().style.backgroundColor).toBe('');
        wrapper.setProps({
            router: {
                location: {
                    pathname: '/notifications',
                },
            },
        });
        button = wrapper.find('.qa-Application-AppBar-NotificationsButton').at(0);
        expect(button.props().style.backgroundColor).toBe('#4598BF');
        wrapper.setProps({
            router: {
                location: {
                    pathname: '/exports',
                },
            },
        });
        button = wrapper.find('.qa-Application-AppBar-NotificationsButton').at(0);
        expect(button.props().style.backgroundColor).toBe('');
    });

    it('should scale the notifications indicator up/down when unread count is positive/zero', () => {
        const wrapper = getMountedWrapper(getProps());
        let indicator = wrapper.find('.qa-Application-AppBar-NotificationsIndicator');
        expect(indicator.props().style.transform).toBe('scale(0)');
        wrapper.setProps({
            notifications: {
                notifications: {},
                notificationsSorted: [],
                unreadCount: {
                    unreadCount: 1,
                },
            },
        });
        indicator = wrapper.find('.qa-Application-AppBar-NotificationsIndicator');
        expect(indicator.props().style.transform).toBe('scale(1)');
        wrapper.setProps({
            notifications: {
                notifications: {},
                notificationsSorted: [],
                unreadCount: {
                    unreadCount: 0,
                },
            },
        });
        indicator = wrapper.find('.qa-Application-AppBar-NotificationsIndicator');
        expect(indicator.props().style.transform).toBe('scale(0)');
    });

    it('should open/close notifications dropdown when notifications button is clicked', () => {
        const wrapper = getMountedWrapper(getProps());
        let dropdown = wrapper.find(NotificationsDropdown);
        expect(dropdown.props().style.opacity).toBe('0');
        expect(dropdown.props().style.pointerEvents).toBe('none');
        expect(dropdown.props().style.transform).toBe('scale(0)');
        wrapper.find('.qa-Application-AppBar-NotificationsButton').hostNodes().simulate('click');
        dropdown = wrapper.find(NotificationsDropdown);
        expect(dropdown.props().style.opacity).toBe('1');
        expect(dropdown.props().style.pointerEvents).toBe('auto');
        expect(dropdown.props().style.transform).toBe('scale(1)');
        wrapper.find('.qa-Application-AppBar-NotificationsButton').hostNodes().simulate('click');
        dropdown = wrapper.find(NotificationsDropdown);
        expect(dropdown.props().style.opacity).toBe('0');
        expect(dropdown.props().style.pointerEvents).toBe('none');
        expect(dropdown.props().style.transform).toBe('scale(0)');
    });
});
