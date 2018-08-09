import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Link } from 'react-router';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import * as utils from '../../utils/notificationUtils';

const run = {
    job: {
        name: 'Test',
    },
};

const group = {
    name: 'Test',
};

describe('notificationUtils', () => {
    it('should correctly handle "run_started" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_started',
            actor: {
                details: run,
            },
        };

        const onLinkClickSpy = sinon.spy();
        const message = utils.getNotificationMessage({
            notification,
            onLinkClick: onLinkClickSpy,
        });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>&nbsp;has started processing.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(InfoIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_canceled" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_canceled',
            actor: {
                details: run,
            },
        };

        const onLinkClickSpy = sinon.spy();
        const message = utils.getNotificationMessage({
            notification,
            onLinkClick: onLinkClickSpy,
        });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>&nbsp;has been canceled.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(WarningIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_completed" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_completed',
            actor: {
                details: run,
            },
        };

        const onLinkClickSpy = sinon.spy();
        const message = utils.getNotificationMessage({
            notification,
            onLinkClick: onLinkClickSpy,
        });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>&nbsp;is complete.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(CheckCircleIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_failed" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_failed',
            actor: {
                details: run,
            },
        };

        const onLinkClickSpy = sinon.spy();
        const message = utils.getNotificationMessage({
            notification,
            onLinkClick: onLinkClickSpy,
        });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>&nbsp;failed to complete.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(ErrorIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_deleted" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_deleted',
            actor: {
                details: run,
            },
        };

        const onLinkClickSpy = sinon.spy();
        const message = utils.getNotificationMessage({
            notification,
            onLinkClick: onLinkClickSpy,
        });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>&nbsp;has been deleted.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(RemoveCircleIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
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

        const message = utils.getNotificationMessage({ notification });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>{"You've been added to"}&nbsp;</span>).text());
        expect(messageWrapper.find(Link).at(0).childAt(0).text()).toBe(notification.action_object.details.name);

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(AddCircleIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/groups?groups=${notification.action_object.details.id}`);
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

        const message = utils.getNotificationMessage({ notification });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>{"You've been removed from"}&nbsp;</span>).text());
        expect(messageWrapper.find(Link).at(0).childAt(0).text()).toBe(notification.action_object.details.name);

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(RemoveCircleIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/groups?groups=${notification.action_object.details.id}`);
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

        const message = utils.getNotificationMessage({ notification });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>{"You've been set as an admin of"}&nbsp;</span>).text());
        expect(messageWrapper.find(Link).at(0).childAt(0).text()).toBe(notification.action_object.details.name);

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(AddCircleIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/groups?groups=${notification.action_object.details.id}`);
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

        const message = utils.getNotificationMessage({ notification });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>{"You've been removed as an admin of"}&nbsp;</span>).text());
        expect(messageWrapper.find(Link).at(0).childAt(0).text()).toBe(notification.action_object.details.name);

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(RemoveCircleIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/groups?groups=${notification.action_object.details.id}`);
    });

    it('should handle notifications with no details', () => {
        const notification = {
            id: '1',
            actor: {},
            action_object: {},
            verb: 'removed_as_group_admin',
        };

        const ret = utils.getNotificationMessage({ notification });
        expect(ret[0].key).toEqual('1-error');
    });

    it('should correctly handle unsupported notification verbs', () => {
        const notification = {
            id: '1',
            actor: {},
            action_object: { details: 'something' },
            verb: 'some_unsupported_verb',
        };

        expect(utils.getNotificationMessage({ notification })).toBe(null);
        expect(utils.getNotificationIcon({ notification })).toBe(null);
        expect(utils.getNotificationViewPath(notification)).toBe(null);
    });
});
