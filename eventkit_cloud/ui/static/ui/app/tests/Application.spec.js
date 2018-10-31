import React from 'react';
import axios from 'axios';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import AppBar from '@material-ui/core/AppBar';
import Drawer from '@material-ui/core/Drawer';
import MenuItem from '@material-ui/core/MenuItem';
import { Link, IndexLink } from 'react-router';
import Dashboard from '@material-ui/icons/Dashboard';
import AVLibraryBooks from '@material-ui/icons/LibraryBooks';
import ContentAddBox from '@material-ui/icons/AddBox';
import ActionInfoOutline from '@material-ui/icons/InfoOutlined';
import SocialPerson from '@material-ui/icons/Person';
import SocialGroup from '@material-ui/icons/Group';
import ActionExitToApp from '@material-ui/icons/ExitToApp';
import MockAdapter from 'axios-mock-adapter';
import createTestStore from '../store/configureTestStore';
import BaseDialog from '../components/Dialog/BaseDialog';
import Banner from '../components/Banner';
import { Application } from '../components/Application';
import ConfirmDialog from '../components/Dialog/ConfirmDialog';
import NotificationsDropdown from '../components/Notification/NotificationsDropdown';

const store = createTestStore({});

describe('Application component', () => {
    let shallow;
    let mock;

    beforeAll(() => {
        shallow = createShallow();
        mock = new MockAdapter(axios, { delayResponse: 100 });
    });

    const getProps = () => ({
        userData: {},
        drawer: 'open',
        router: {
            push: () => {},
            location: {
                pathname: '/exports',
            },
        },
        notificationsStatus: {
            fetching: false,
            fetched: false,
        },
        notificationsData: {
            notifications: {},
            notificationsSorted: [],
        },
        notificationsCount: 0,
        store,
        openDrawer: () => {},
        closeDrawer: () => {},
        userActive: () => {},
        getNotifications: sinon.spy(),
        getNotificationsUnreadCount: () => {},
        classes: {},
        ...global.eventkit_test_props,
    });

    const config = {
        DATAPACK_PAGE_SIZE: '12',
        NOTIFICATIONS_PAGE_SIZE: '12',
    };

    const getWrapper = props => shallow(<Application {...props} />, {
        context: { config },
    });

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Banner)).toHaveLength(1);
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find('.qa-Application-AppBar-MenuButton')).toHaveLength(1);
        expect(wrapper.find('.qa-Application-AppBar-NotificationsButton')).toHaveLength(1);
        expect(wrapper.find('.qa-Application-AppBar-NotificationsIndicator')).toHaveLength(1);
        expect(wrapper.find(NotificationsDropdown)).toHaveLength(0);
        expect(wrapper.find(Drawer)).toHaveLength(1);
        expect(wrapper.find(BaseDialog)).toHaveLength(2);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
        const drawer = wrapper.find(Drawer).dive();
        expect(drawer.find(MenuItem)).toHaveLength(7);
        expect(drawer.find(MenuItem).at(0).html()).toContain('Dashboard');
        expect(drawer.find(MenuItem).at(0).find(Dashboard)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(0).find(IndexLink)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(1).html()).toContain('DataPack Library');
        expect(drawer.find(MenuItem).at(1).find(AVLibraryBooks)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(1).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(2).html()).toContain('Create DataPack');
        expect(drawer.find(MenuItem).at(2).find(ContentAddBox)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(2).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(3).html()).toContain('Members and Groups');
        expect(drawer.find(MenuItem).at(3).find(SocialGroup)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(3).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(4).html()).toContain('About EventKit');
        expect(drawer.find(MenuItem).at(4).find(ActionInfoOutline)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(4).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(5).html()).toContain('Account Settings');
        expect(drawer.find(MenuItem).at(5).find(SocialPerson)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(5).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(6).html()).toContain('Log Out');
        expect(drawer.find(MenuItem).at(6).find(ActionExitToApp)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(6).find(Link)).toHaveLength(1);
    });

    it('should call getConfig on mount', () => {
        const getStub = sinon.stub(Application.prototype, 'getConfig');
        const props = getProps();
        getWrapper(props);
        expect(getStub.calledOnce).toBe(true);
        getStub.restore();
    });

    it('handleToggle should open and close the drawer', () => {
        const props = getProps();
        props.openDrawer = sinon.spy();
        props.closeDrawer = sinon.spy();
        props.drawer = 'open';
        const wrapper = getWrapper(props);
        wrapper.instance().handleToggle();
        expect(props.closeDrawer.callCount).toBe(1);
        wrapper.setProps({ ...props, drawer: 'closed' });
        wrapper.instance().handleToggle();
        expect(props.openDrawer.callCount).toBe(2);
    });

    it('onMenuItemClick should call handleToggle if screen size is smaller than 1200', () => {
        const props = getProps();
        props.width = 'xl';
        const toggleSpy = sinon.spy(Application.prototype, 'handleToggle');
        const wrapper = getWrapper(props);
        wrapper.instance().onMenuItemClick();
        expect(toggleSpy.notCalled).toBe(true);
        wrapper.setProps({ width: 'md' });
        wrapper.instance().onMenuItemClick();
        expect(toggleSpy.calledOnce).toBe(true);
        toggleSpy.restore();
    });

    it('getChildContext should return config', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ childContext: { config: { key: 'value' } } });
        wrapper.instance().forceUpdate();
        const context = wrapper.instance().getChildContext();
        expect(context).toEqual({ config: { key: 'value' } });
    });

    it('getConfig should update the state when config is received', async () => {
        const props = getProps();
        mock.onGet('/configuration').reply(200, {
            LOGIN_DISCLAIMER: 'Test string',
        });
        const stateSpy = sinon.spy(Application.prototype, 'setState');
        const wrapper = getWrapper(props);
        await wrapper.instance().getConfig();
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({ childContext: { config: { LOGIN_DISCLAIMER: 'Test string' } } })).toBe(true);
        stateSpy.restore();
    });

    it('Auto logout warning should show remaining minutes when above one minute', () => {
        jest.useFakeTimers();
        const props = getProps();
        // Set auto logout time to 5 minutes from now.
        props.autoLogoutAt = new Date(Date.now() + (5 * 60 * 1000));
        props.autoLogoutWarningAt = new Date(Date.now() - 1000);
        const wrapper = getWrapper(props);
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
        const wrapper = getWrapper(props);
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
        const wrapper = getWrapper(props);
        wrapper.instance().startCheckingForAutoLogout();
        jest.runOnlyPendingTimers();
        expect(wrapper.state().showAutoLoggedOutDialog).toBe(true);
    });

    it('handleLogoutClick should set showLogoutDialog to true', () => {
        const wrapper = getWrapper(getProps());
        expect(wrapper.state().showLogoutDialog).toBe(false);
        wrapper.instance().handleLogoutClick();
        expect(wrapper.state().showLogoutDialog).toBe(true);
    });

    it('handleLogoutDialogCancel should set showLogoutDialog to false', () => {
        const wrapper = getWrapper(getProps());
        wrapper.setState({
            showLogoutDialog: true,
        });
        wrapper.instance().handleLogoutDialogCancel();
        expect(wrapper.state().showLogoutDialog).toBe(false);
    });

    it('handleLogoutDialogConfirm() should set showLogoutDialog to false and call logout()', () => {
        const logoutSpy = sinon.spy(Application.prototype, 'logout');
        const wrapper = getWrapper(getProps());
        wrapper.setState({
            showLogoutDialog: true,
        });
        wrapper.instance().handleLogoutDialogConfirm();
        expect(wrapper.state().showLogoutDialog).toBe(false);
        expect(logoutSpy.calledOnce).toBe(true);
        logoutSpy.restore();
    });

    it('should start listening for notifications on user login & context received', () => {
        const startListeningForNotificationsSpy = sinon.spy(Application.prototype, 'startListeningForNotifications');
        const props = {
            ...getProps(),
            userData: null,
        };
        const wrapper = getWrapper(props);
        const instance = wrapper.instance();
        expect(startListeningForNotificationsSpy.callCount).toBe(0);
        expect(instance.notificationsRefreshIntervalId).toBe(null);
        expect(instance.notificationsUnreadCountIntervalId).toBe(null);
        wrapper.setProps({
            userData: {},
        });
        wrapper.setState({ childContext: { config } });
        expect(startListeningForNotificationsSpy.callCount).toBe(1);
        expect(instance.notificationsRefreshIntervalId).not.toBe(null);
        expect(instance.notificationsUnreadCountIntervalId).not.toBe(null);
        startListeningForNotificationsSpy.restore();
    });

    it('should stop listening for notifications on user logout', () => {
        const stopListeningForNotificationsSpy = sinon.spy(Application.prototype, 'stopListeningForNotifications');
        const wrapper = getWrapper(getProps());
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
        const wrapper = getWrapper(getProps());
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
        expect(button.props().style.backgroundColor).toBe('#4598bf');
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
        const wrapper = getWrapper(getProps());
        let indicator = wrapper.find('.qa-Application-AppBar-NotificationsIndicator');
        expect(indicator.props().style.transform).toBe('scale(0)');
        wrapper.setProps({
            notificationsData: {
                notifications: {},
                notificationsSorted: [],
            },
            notificationsCount: 1,
        });
        indicator = wrapper.find('.qa-Application-AppBar-NotificationsIndicator');
        expect(indicator.props().style.transform).toBe('scale(1)');
        wrapper.setProps({
            notificationsData: {
                notifications: {},
                notificationsSorted: [],
            },
            notificationsCount: 0,
        });
        indicator = wrapper.find('.qa-Application-AppBar-NotificationsIndicator');
        expect(indicator.props().style.transform).toBe('scale(0)');
    });

    it('should open/close notifications dropdown when notifications button is clicked', () => {
        const wrapper = getWrapper(getProps());
        const e = { preventDefault: sinon.spy(), stopPropagation: sinon.spy() };
        let dropdown = wrapper.find(NotificationsDropdown);
        expect(dropdown).toHaveLength(0);
        wrapper.find('.qa-Application-AppBar-NotificationsButton').simulate('click', e);
        dropdown = wrapper.find(NotificationsDropdown);
        expect(dropdown).toHaveLength(1);
        wrapper.find('.qa-Application-AppBar-NotificationsButton').simulate('click', e);
        dropdown = wrapper.find(NotificationsDropdown);
        expect(dropdown).toHaveLength(0);
    });
});
