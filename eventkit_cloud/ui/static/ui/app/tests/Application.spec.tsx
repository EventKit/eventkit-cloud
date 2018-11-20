import * as React from 'react';
import axios from 'axios';
import * as sinon from 'sinon';
import * as MockAdapter from 'axios-mock-adapter';
import { createShallow } from '@material-ui/core/test-utils';
import AppBar from '@material-ui/core/AppBar';
import createTestStore from '../store/configureTestStore';
import BaseDialog from '../components/Dialog/BaseDialog';
import Banner from '../components/Banner';
import Drawer from '../components/Drawer';
import { Application } from '../components/Application';
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
            push: () => sinon.stub(),
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
        openDrawer: sinon.stub(),
        closeDrawer: sinon.stub(),
        userActive: sinon.stub(),
        getNotifications: sinon.spy(),
        getNotificationsUnreadCount: sinon.stub(),
        classes: {},
        ...(global as any).eventkit_test_props,
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
    });

    it('should render children with context', () => {
        const Child = (p, c) => {
            return <div>Im a child</div>;
        };
        const props = getProps();
        const wrapper = shallow(<Application {...props}><Child /></Application>, {
            context: { config },
        });
        expect(wrapper.find(Child)).toHaveLength(1);
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
        expect(props.openDrawer.callCount).toBe(1);
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

    it('handleStayLoggedIn should start sending pings and call hide warning', async () => {
        const wrapper = getWrapper(getProps());
        const pingStub = sinon.stub(wrapper.instance(), 'startSendingUserActivePings')
            .callsFake(() => (new Promise((resolve, reject) => (setTimeout(() => resolve(), 10)))));
        const hideStub = sinon.stub(wrapper.instance(), 'hideAutoLogoutWarning');
        await wrapper.instance().handleStayLoggedIn();
        expect(pingStub.calledOnce).toBe(true);
        expect(hideStub.calledOnce).toBe(true);
    });

    it('handleCloseAutoLoggedOutDialog should set show to false', () => {
        const wrapper = getWrapper(getProps());
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleCloseAutoLoggedOutDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAutoLoggedOutDialog: false })).toBe(true);
    });

    it('stopListeningForNotifications should return with no side effects', () => {
        const wrapper = getWrapper(getProps());
        wrapper.instance().notificationsUnreadCountIntervalId = undefined;
        const clearStub = sinon.stub(window, 'clearInterval');
        wrapper.instance().stopListeningForNotifications();
        expect(clearStub.notCalled).toBe(true);
        clearStub.restore();
    });

    it('stopListeningForNotifications should clear intervals', () => {
        const wrapper = getWrapper(getProps());
        wrapper.instance().notificationsUnreadCountIntervalId = 123;
        wrapper.instance().notificationsRefreshIntervalId = 123;
        const clearStub = sinon.stub(window, 'clearInterval');
        wrapper.instance().stopListeningForNotifications();
        expect(clearStub.calledTwice).toBe(true);
        clearStub.restore();
    });

    it('startCheckingForAutoLogout should return with no side effects', () => {
        const wrapper = getWrapper(getProps());
        wrapper.instance().checkAutoLogoutIntervalId = 123;
        const setStub = sinon.stub(window, 'setInterval');
        wrapper.instance().startCheckingForAutoLogout();
        expect(setStub.notCalled).toBe(true);
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

    it('startSendingUserActivePings should return with no side effects', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().isSendingUserActivePings = true;
        wrapper.instance().startSendingUserActivePings();
        expect(props.userActive.notCalled).toBe(true);
    });

    it('startSendingUserActivePings should add listeners and call userActive', async () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const addStub = sinon.stub(window, 'addEventListener');
        await wrapper.instance().startSendingUserActivePings();
        expect(addStub.callCount).toEqual(wrapper.instance().userActiveInputTypes.length);
        expect(props.userActive.calledOnce).toBe(true);
        addStub.restore();
        const setStub = sinon.stub(window, 'setTimeout').callsFake((callback, time) => { callback(); });
        props.userActive.reset();
        wrapper.instance().handleUserActiveInput();
        expect(setStub.calledOnce).toBe(true);
        expect(props.userActive.calledOnce).toBe(true);
        setStub.restore();
    });

    it('stopSendingUserActivePings should return with no side effects', () => {
        const wrapper = getWrapper(getProps());
        wrapper.instance().isSendingUserActivePings = undefined;
        wrapper.instance().stopSendingUserActivePings();
        wrapper.update();
        expect(wrapper.instance().isSendingUserActivePings).toBe(undefined);
    });

    it('stopSendingUserActivePings should remove event listeners', () => {
        const wrapper = getWrapper(getProps());
        const removeStub = sinon.stub(window, 'removeEventListener');
        wrapper.instance().isSendingUserActivePings = true;
        wrapper.instance().stopSendingUserActivePings();
        wrapper.update();
        expect(wrapper.instance().isSendingUserActivePings).toBe(false);
        expect(removeStub.callCount).toEqual(wrapper.instance().userActiveInputTypes.length);
        removeStub.restore();

    });

    it('showAutoLogoutWarning should return with no side effects', () => {
        const wrapper = getWrapper(getProps());
        wrapper.instance().autoLogoutWarningIntervalId = 123;
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().showAutoLogoutWarning();
        expect(stateStub.called).toBe(false);
    });

    it('showAutoLogoutWarning should update state, stop pings, and setInterval', () => {
        const props = getProps();
        props.autoLogoutAt = { getTime: sinon.stub().returns(Date.now() + (10 * 60 * 1000)) };
        const wrapper = getWrapper(props);
        wrapper.instance().autoLogoutWarningIntervalId = undefined;
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const stopStub = sinon.stub(wrapper.instance(), 'stopSendingUserActivePings');
        const setStub = sinon.stub(window, 'setInterval');
        wrapper.instance().showAutoLogoutWarning();
        expect(stateStub.calledTwice).toBe(true);
        expect(stopStub.calledOnce).toBe(true);
        expect(setStub.calledOnce).toBe(true);
        setStub.restore();
    });

    it('hideAutoLogoutWarning should return with no side effects', () => {
        const wrapper = getWrapper(getProps());
        wrapper.instance().autoLogoutWarningIntervalId = undefined;
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().hideAutoLogoutWarning();
        expect(stateStub.called).toBe(false);
    });

    it('hideAutoLogoutWarning should set dialog false and clear interval', () => {
        const wrapper = getWrapper(getProps());
        wrapper.instance().autoLogoutWarningIntervalId = 123;
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const clearStub = sinon.stub(window, 'clearInterval');
        wrapper.instance().hideAutoLogoutWarning();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAutoLogoutWarningDialog: false }));
        expect(clearStub.calledOnce).toBe(true);
        expect(clearStub.calledWith(123)).toBe(true);
        clearStub.restore();
    });

    it('handleClick should set showNotificationsDropdown false', () => {
        const wrapper = getWrapper(getProps());
        wrapper.setState({ showNotificationsDropdown: true });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const e = { srcElement: { className: ''} };
        wrapper.instance().handleClick(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showNotificationsDropdown: false }));
    });

    it('handleClick should NOT set showNotificationsDropdown false', () => {
        const wrapper = getWrapper(getProps());
        wrapper.setState({ showNotificationsDropdown: true });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const e = { srcElement: { className: 'qa-NotificationMenu-MenuItem'} };
        wrapper.instance().handleClick(e);
        expect(stateStub.called).toBe(false);
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

    it('handleNotificationsDropdownNavigate should set showNotificationsDropdown false', () => {
        const wrapper = getWrapper(getProps());
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const ret = wrapper.instance().handleNotificationsDropdownNavigate();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showNotificationsDropdown: false }));
        expect(ret).toBe(true);
    });
});
