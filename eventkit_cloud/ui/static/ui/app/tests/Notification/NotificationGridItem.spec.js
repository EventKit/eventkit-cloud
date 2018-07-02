import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import moment from 'moment';
import { Paper } from 'material-ui';
import { NotificationGridItem } from '../../components/Notification/NotificationGridItem';
import NotificationMenu from '../../components/Notification/NotificationMenu';
import { getNotificationViewPath } from '../../utils/notificationUtils';

describe('NotificationGridItem component', () => {
    let wrapper;
    let instance;

    function defaultProps() {
        return {
            notification: {
                id: '1',
                verb: 'run_completed',
                actor: {
                    details: {
                        job: {
                            name: 'Test',
                        },
                    },
                },
                timestamp: '2018-05-04T17:32:04.716806Z',
                unread: true,
            },
            router: {
                push: sinon.spy(),
            },
            markNotificationsAsRead: sinon.spy(),
            markNotificationsAsUnread: sinon.spy(),
            removeNotifications: sinon.spy(),
            onMarkAsRead: sinon.spy(),
            onMarkAsUnread: sinon.spy(),
            onRemove: sinon.spy(),
            onView: sinon.spy(),
        };
    }

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<NotificationGridItem {...props} />);
        instance = wrapper.instance();
    }

    beforeEach(setup);

    it('renders a Paper component', () => {
        expect(wrapper.find(Paper)).toHaveLength(1);
    });

    it('renders an icon', () => {
        expect(wrapper.find('.qa-NotificationIcon')).toHaveLength(1);
    });

    it('renders message text', () => {
        expect(wrapper.find('.qa-NotificationMessage-Text')).toHaveLength(1);
    });

    it('renders message link', () => {
        expect(wrapper.find('.qa-NotificationMessage-Link')).toHaveLength(1);
    });

    it('renders a date', () => {
        expect(wrapper.find('.qa-NotificationGridItem-Date')).toHaveLength(1);
    });

    it('formats date correctly', () => {
        const date = wrapper.find('.qa-NotificationGridItem-Date');
        expect(date.text()).toBe(moment(instance.props.notification.timestamp).fromNow());
    });

    it('renders a NotificationMenu component', () => {
        expect(wrapper.find(NotificationMenu)).toHaveLength(1);
    });

    it('passes correct props to NotificationMenu', () => {
        const notificationMenu = wrapper.find(NotificationMenu);
        expect(Object.keys(notificationMenu.props())).toHaveLength(6);
        expect(notificationMenu.props().notification).toBe(instance.props.notification);
        expect(notificationMenu.props().router).toBe(instance.props.router);
        expect(notificationMenu.props().onMarkAsRead).toBe(instance.props.onMarkAsRead);
        expect(notificationMenu.props().onMarkAsUnread).toBe(instance.props.onMarkAsUnread);
        expect(notificationMenu.props().onRemove).toBe(instance.props.onRemove);
        expect(notificationMenu.props().onView).toBe(instance.handleView);
    });

    describe('when notification is unread', () => {
        beforeEach(() => {
            wrapper.setProps({
                notification: {
                    ...instance.props.notification,
                    unread: true,
                },
            });
        });

        it('shows a non-white background color', () => {
            expect(wrapper.find(Paper).props().style.backgroundColor).not.toBe('white');
        });
    });

    describe('when notification is not unread', () => {
        beforeEach(() => {
            wrapper.setProps({
                notification: {
                    ...instance.props.notification,
                    unread: false,
                },
            });
        });

        it('shows a white background color', () => {
            expect(wrapper.find(Paper).props().style.backgroundColor).toBe('white');
        });
    });

    describe('when handleView() is called', () => {
        let setupA;
        let viewPath;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                viewPath = getNotificationViewPath(instance.props.notification);
                instance.handleView();
            };
            setupA();
        });

        it('calls onView() with notification and view path', () => {
            expect(instance.props.onView.callCount).toBe(1);
            expect(instance.props.onView.calledWith(instance.props.notification, viewPath)).toBe(true);
        });

        describe('when onView() returns true', () => {
            beforeEach(() => {
                setupA({
                    onView: () => true,
                });
            });

            it('navigates to view path', () => {
                expect(instance.props.router.push.callCount).toBe(1);
                expect(instance.props.router.push.calledWith(viewPath)).toBe(true);
            });

            it('marks notification as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
                expect(instance.props.markNotificationsAsRead.calledWith([instance.props.notification])).toBe(true);
            });
        });

        describe('when onView() returns false', () => {
            beforeEach(() => {
                setupA({
                    onView: () => false,
                });
            });

            it('does not navigate anywhere', () => {
                expect(instance.props.router.push.callCount).toBe(0);
            });

            it('does not mark notification as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(0);
            });
        });
    });
});
