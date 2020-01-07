
import { getHeaderPageInfo } from '../utils/generic';

export const types = {
    CREATED_GROUP: 'CREATED_GROUP',
    CREATE_GROUP_ERROR: 'CREATE_GROUP_ERROR',
    CREATING_GROUP: 'CREATING_GROUP',
    DELETED_GROUP: 'DELETED_GROUP',
    DELETE_GROUP_ERROR: 'DELETE_GROUP_ERROR',
    DELETING_GROUP: 'DELETING_GROUP',
    FETCHED_GROUPS: 'FETCHED_GROUPS',
    FETCHING_GROUPS: 'FETCHING_GROUPS',
    FETCH_GROUPS_ERROR: 'FETCH_GROUPS_ERROR',
    UPDATED_GROUP: 'UPDATED_GROUP',
    UPDATING_GROUP: 'UPDATING_GROUP',
    UPDATING_GROUP_ERROR: 'UPDATING_GROUP_ERROR',
};

export function getGroups(params, append = false) {
    return {
        cancellable: true,
        getCancelSource: state => state.groups.cancelSource,
        method: 'GET',
        onSuccess: (response) => {
            // get the total count from the header
            const totalGroups = Number(response.headers['total-groups']);
            const { nextPage, range } = getHeaderPageInfo(response);
            return {
                groups: response.data,
                nextPage,
                range,
                total: totalGroups,
            };
        },
        params,
        payload: { append },
        types: [
            types.FETCHED_GROUPS,
            types.FETCHING_GROUPS,
            types.FETCH_GROUPS_ERROR,
        ],
        url: '/api/groups',
    };
}

export function deleteGroup(groupId) {
    return {
        method: 'DELETE',
        types: [
            types.DELETED_GROUP,
            types.DELETING_GROUP,
            types.DELETE_GROUP_ERROR,
        ],
        url: `/api/groups/${groupId}`,
    };
}

export function createGroup(groupName, members) {
    return {
        data: { name: groupName, members },
        method: 'POST',
        types: [
            types.CREATED_GROUP,
            types.CREATING_GROUP,
            types.CREATE_GROUP_ERROR,
        ],
        url: '/api/groups',
    };
}

export function updateGroup(groupId, options = {}) {
    const data = {};

    if (options.name) { data.name = options.name; }
    if (options.members) { data.members = options.members; }
    if (options.administrators) { data.administrators = options.administrators; }

    return {
        data,
        method: 'PATCH',
        types: [
            types.UPDATED_GROUP,
            types.UPDATING_GROUP,
            types.UPDATING_GROUP_ERROR,
        ],
        url: `/api/groups/${groupId}`,
    };
}
