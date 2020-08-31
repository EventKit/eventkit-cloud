import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import { Link } from 'react-router-dom';
import { NotificationMessage } from '../../components/Notification/NotificationMessage';

describe('NotificationMessage component', () => {
    const run = {
        job: {
            name: 'Test',
        },
    };

    const group = {
        name: 'Test',
    };

    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getWrapper = (props) => (
        shallow(<NotificationMessage {...props} {...global.eventkit_test_props} />)
    );

    it('should correctly handle "run_started" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_started',
            actor: {
                details: run,
            },
        };

        const onLinkClick = sinon.spy();
        const wrapper = getWrapper({ notification, onLinkClick });
        expect(wrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        wrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClick.callCount).toBe(1);
        expect(wrapper.find('span').at(0).text()).toEqual('\xa0has started processing.');
    });

    it('should correctly handle "run_canceled" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_canceled',
            actor: {
                details: run,
            },
        };

        const onLinkClick = sinon.spy();
        const wrapper = getWrapper({ notification, onLinkClick });
        expect(wrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        wrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClick.callCount).toBe(1);
        expect(wrapper.find('span').at(0).text()).toEqual('\xa0has been canceled.');
    });

    it('should correctly handle "run_completed" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_completed',
            actor: {
                details: run,
            },
        };

        const onLinkClick = sinon.spy();
        const wrapper = getWrapper({ notification, onLinkClick });
        expect(wrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        wrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClick.callCount).toBe(1);
        expect(wrapper.find('span').at(0).text()).toEqual('\xa0is complete.');
    });

    it('should correctly handle "run_failed" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_failed',
            actor: {
                details: run,
            },
        };

        const onLinkClick = sinon.spy();
        const wrapper = getWrapper({ notification, onLinkClick });
        expect(wrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        wrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClick.callCount).toBe(1);
        expect(wrapper.find('span').at(0).text()).toEqual('\xa0failed to complete.');
    });

    it('should correctly handle "run_deleted" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_deleted',
            actor: {
                details: run,
            },
        };

        const onLinkClick = sinon.spy();
        const wrapper = getWrapper({ notification, onLinkClick });
        expect(wrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        wrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClick.callCount).toBe(1);
        expect(wrapper.find('span').at(0).text()).toEqual('\xa0has been deleted.');
    });

    it('should correctly handle "added_to_group" notification', () => {
        const notification = {
            id: '1',
            verb: 'added_to_group',
            actor: {},
            action_object: {
                details: group,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find('span').at(0).text()).toEqual("You've been added to\xa0");
        expect(wrapper.find(Link).at(0).childAt(0).text()).toBe(notification.action_object.details.name);
    });

    it('should correctly handle "removed_from_group" notification', () => {
        const notification = {
            id: '1',
            verb: 'removed_from_group',
            actor: {},
            action_object: {
                details: group,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find('span').at(0).text()).toEqual("You've been removed from\xa0");
        expect(wrapper.find(Link).at(0).childAt(0).text()).toBe(notification.action_object.details.name);
    });

    it('should correctly handle "set_as_group_admin" notification', () => {
        const notification = {
            id: '1',
            verb: 'set_as_group_admin',
            actor: {},
            action_object: {
                details: group,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find('span').at(0).text()).toEqual("You've been set as an admin of\xa0");
        expect(wrapper.find(Link).at(0).childAt(0).text()).toBe(notification.action_object.details.name);
    });

    it('should correctly handle "removed_as_group_admin" notification', () => {
        const notification = {
            id: '1',
            verb: 'removed_as_group_admin',
            actor: {},
            action_object: {
                details: group,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find('span').at(0).text()).toEqual("You've been removed as an admin of\xa0");
        expect(wrapper.find(Link).at(0).childAt(0).text()).toBe(notification.action_object.details.name);
    });

    it('should handle notifications with no details', () => {
        const notification = {
            id: '1',
            actor: {},
            action_object: {},
            verb: 'removed_as_group_admin',
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find('span').at(0).text()).toEqual("Uh oh! Sorry, this notification's details are no longer available.");
    });

    it('should correctly handle unsupported notification verbs', () => {
        const notification = {
            id: '1',
            actor: {},
            action_object: { details: 'something' },
            verb: 'some_unsupported_verb',
        };

        expect(getWrapper({ notification }).get(0)).toBe(null);
    });
});
