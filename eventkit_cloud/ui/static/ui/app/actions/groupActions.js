
import { getHeaderPageInfo } from '../utils/generic';

export const types = {
    FETCHING_GROUPS: 'FETCHING_GROUPS',
    FETCHED_GROUPS: 'FETCHED_GROUPS',
    FETCH_GROUPS_ERROR: 'FETCH_GROUPS_ERROR',
    DELETING_GROUP: 'DELETING_GROUP',
    DELETED_GROUP: 'DELETED_GROUP',
    DELETE_GROUP_ERROR: 'DELETE_GROUP_ERROR',
    CREATING_GROUP: 'CREATING_GROUP',
    CREATED_GROUP: 'CREATED_GROUP',
    CREATE_GROUP_ERROR: 'CREATE_GROUP_ERROR',
    UPDATING_GROUP: 'UPDATING_GROUP',
    UPDATED_GROUP: 'UPDATED_GROUP',
    UPDATING_GROUP_ERROR: 'UPDATING_GROUP_ERROR',
};

export function getGroups(params, append = false) {
    return {
        types: [
            types.FETCHING_GROUPS,
            types.FETCHED_GROUPS,
            types.FETCH_GROUPS_ERROR,
        ],
        url: '/api/groups',
        method: 'GET',
        params,
        payload: { append },
        getCancelSource: state => state.groups.cancelSource,
        cancellable: true,
        onSuccess: (response) => {
            // get the total count from the header
            const totalGroups = Number(response.headers['total-groups']);
            const { nextPage, range } = getHeaderPageInfo(response);
            return {
                groups: response.data,
                total: totalGroups,
                range,
                nextPage,
            };
        },
    };
}

export function deleteGroup(groupId) {
    return {
        types: [
            types.DELETING_GROUP,
            types.DELETED_GROUP,
            types.DELETE_GROUP_ERROR,
        ],
        url: `/api/groups/${groupId}`,
        method: 'DELETE',
    };
}

export function createGroup(groupName, members) {
    return {
        types: [
            types.CREATING_GROUP,
            types.CREATED_GROUP,
            types.CREATE_GROUP_ERROR,
        ],
        url: '/api/groups',
        method: 'POST',
        data: { name: groupName, members },
    };
}

export function updateGroup(groupId, options = {}) {
    const data = {};

    if (options.name) data.name = options.name;
    if (options.members) data.members = options.members;
    if (options.administrators) data.administrators = options.administrators;

    return {
        types: [
            types.UPDATING_GROUP,
            types.UPDATED_GROUP,
            types.UPDATING_GROUP_ERROR,
        ],
        url: `/api/groups/${groupId}`,
        method: 'PATCH',
        data,
    };
}
