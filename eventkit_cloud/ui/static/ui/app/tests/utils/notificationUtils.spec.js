import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Link } from 'react-router';
import InfoIcon from 'material-ui/svg-icons/action/info';
import CheckCircleIcon from 'material-ui/svg-icons/action/check-circle';
import WarningIcon from 'material-ui/svg-icons/alert/warning';
import ErrorIcon from 'material-ui/svg-icons/alert/error';
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
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>DataPack&nbsp;</span>).text());
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(1).text()).toEqual(shallow(<span>&nbsp;has started.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(InfoIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_canceled" notification', () => {
        const notification = {
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
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>DataPack&nbsp;</span>).text());
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(1).text()).toEqual(shallow(<span>&nbsp;was canceled.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(WarningIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_completed" notification', () => {
        const notification = {
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
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>DataPack&nbsp;</span>).text());
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(1).text()).toEqual(shallow(<span>&nbsp;is complete.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(CheckCircleIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_failed" notification', () => {
        const notification = {
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
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>DataPack&nbsp;</span>).text());
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(1).text()).toEqual(shallow(<span>&nbsp;failed to complete.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(ErrorIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_deleted" notification', () => {
        const notification = {
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
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>DataPack&nbsp;</span>).text());
        expect(messageWrapper.find(Link).childAt(0).text()).toBe(notification.actor.details.job.name);
        messageWrapper.find(Link).get(0).props.onClick({ preventDefault: () => {} });
        expect(onLinkClickSpy.callCount).toBe(1);
        expect(messageWrapper.find('span').at(1).text()).toEqual(shallow(<span>&nbsp;was deleted.</span>).text());

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(WarningIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "added_to_group" notification', () => {
        const notification = {
            verb: 'added_to_group',
            action_object: {
                details: group,
            },
        };

        const message = utils.getNotificationMessage({ notification });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>Added to group&nbsp;</span>).text());
        expect(messageWrapper.find('span').at(1).text()).toBe(notification.action_object.details.name);

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(InfoIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe('/groups');
    });

    it('should correctly handle "removed_from_group" notification', () => {
        const notification = {
            verb: 'removed_from_group',
            action_object: {
                details: group,
            },
        };

        const message = utils.getNotificationMessage({ notification });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>Removed from group&nbsp;</span>).text());
        expect(messageWrapper.find('span').at(1).text()).toBe(notification.action_object.details.name);

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(InfoIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe('/groups');
    });

    it('should correctly handle "set_as_group_admin" notification', () => {
        const notification = {
            verb: 'set_as_group_admin',
            action_object: {
                details: group,
            },
        };

        const message = utils.getNotificationMessage({ notification });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>Set as admin of group&nbsp;</span>).text());
        expect(messageWrapper.find('span').at(1).text()).toBe(notification.action_object.details.name);

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(InfoIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe('/groups');
    });

    it('should correctly handle "removed_as_group_admin" notification', () => {
        const notification = {
            verb: 'removed_as_group_admin',
            action_object: {
                details: group,
            },
        };

        const message = utils.getNotificationMessage({ notification });
        const messageWrapper = shallow(<div>{message}</div>);
        expect(messageWrapper.find('span').at(0).text()).toEqual(shallow(<span>Removed as admin of group&nbsp;</span>).text());
        expect(messageWrapper.find('span').at(1).text()).toBe(notification.action_object.details.name);

        const icon = utils.getNotificationIcon({ notification });
        const iconWrapper = shallow(<div>{icon}</div>);
        expect(iconWrapper.find(InfoIcon)).toHaveLength(1);

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe('/groups');
    });

    it('should correctly handle unsupported notification verbs', () => {
        const notification = {
            verb: 'some_unsupported_verb',
        };

        expect(utils.getNotificationMessage({ notification })).toBe(null);
        expect(utils.getNotificationIcon({ notification })).toBe(null);
        expect(utils.getNotificationViewPath(notification)).toBe(null);
    });
});