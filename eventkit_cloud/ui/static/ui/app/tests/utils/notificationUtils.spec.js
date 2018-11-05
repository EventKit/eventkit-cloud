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

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/status/${notification.actor.details.job.uid}`);
    });

    it('should correctly handle "run_started" with no run', () => {
        const notification = {
            id: '1',
            verb: 'run_started',
            actor: {
                details: undefined,
            },
        };

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe('');
    });

    it('should correctly handle "run_canceled" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_canceled',
            actor: {
                details: run,
            },
        };

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

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/groups?groups=${notification.action_object.details.id}`);
    });

    it('should correctly handle "added_to_group" with no group', () => {
        const notification = {
            id: '1',
            verb: 'added_to_group',
            actor: {},
            action_object: {
                details: undefined,
            },
        };

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe('');
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

        const viewPath = utils.getNotificationViewPath(notification);
        expect(viewPath).toBe(`/groups?groups=${notification.action_object.details.id}`);
    });

    it('should correctly handle unsupported notification verbs', () => {
        const notification = {
            id: '1',
            actor: {},
            action_object: { details: 'something' },
            verb: 'some_unsupported_verb',
        };

        expect(utils.getNotificationViewPath(notification)).toBe(null);
    });
});
