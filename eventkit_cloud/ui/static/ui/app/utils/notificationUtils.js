
export const verbs = {
    addedToGroup: 'added_to_group',
    removedAsGroupAdmin: 'removed_as_group_admin',
    removedFromGroup: 'removed_from_group',
    runCanceled: 'run_canceled',
    runCompleted: 'run_completed',
    runDeleted: 'run_deleted',
    runFailed: 'run_failed',
    runStarted: 'run_started',
    setAsGroupAdmin: 'set_as_group_admin',
};

export const requiresActorDetails = [
    verbs.runStarted,
    verbs.runCanceled,
    verbs.runCompleted,
    verbs.runDeleted,
    verbs.runFailed,
];

export const requiresActionObjDetails = [
    verbs.addedToGroup,
    verbs.removedFromGroup,
    verbs.setAsGroupAdmin,
    verbs.removedAsGroupAdmin,
];

export function getNotificationViewPath(notification) {
    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.runStarted:
        case verbs.runCanceled:
        case verbs.runCompleted:
        case verbs.runDeleted:
        case verbs.runFailed: {
            const run = notification.actor.details;
            if (!run) {
                return '';
            }

            return `/status/${notification.actor.details.job.uid}`;
        }
        case verbs.addedToGroup:
        case verbs.removedFromGroup:
        case verbs.setAsGroupAdmin:
        case verbs.removedAsGroupAdmin: {
            const group = notification.action_object.details;
            if (!group) {
                return '';
            }

            return `/groups?groups=${group.id}`;
        }
        default:
            return null;
    }
}
