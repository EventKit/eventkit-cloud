import axios from 'axios';
import cookie from 'react-cookie';

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

export function getGroups() {
    return (dispatch, getState) => {
        const { groups } = getState();
        if (groups.fetching && groups.cancelSource) {
            // if there is already a request in process we need to cancel it
            // before executing the current request
            groups.cancelSource.cancel('Request is no longer valid, cancelling');
        }

        const { CancelToken } = axios;
        const source = CancelToken.source();

        dispatch({ type: types.FETCHING_GROUPS, cancelSource: source });

        const csrfmiddlewaretoken = cookie.load('csrftoken');

        return axios({
            url: '/api/groups',
            method: 'GET',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: source.token,
        }).then((response) => {
            dispatch({ type: types.FETCHED_GROUPS, groups: response.data });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({ type: types.FETCH_GROUPS_ERROR, error: error.response.data });
            }
        });
    };
}

export function deleteGroup(groupId) {
    return (dispatch) => {
        dispatch({ type: types.DELETING_GROUP });

        const csrftoken = cookie.load('csrftoken');

        return axios({
            url: `/api/groups/${groupId}`,
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            dispatch({ type: types.DELETED_GROUP });
        }).catch((error) => {
            dispatch({ type: types.DELETE_GROUP_ERROR, error: error.response.data });
        });
    };
}

export function createGroup(groupName, members) {
    return (dispatch) => {
        dispatch({ type: types.CREATING_GROUP });

        const csrftoken = cookie.load('csrftoken');

        return axios({
            url: '/api/groups',
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            data: { name: groupName, members },
        }).then(() => {
            dispatch({ type: types.CREATED_GROUP });
        }).catch((error) => {
            dispatch({ type: types.CREATE_GROUP_ERROR, error: error.response.data });
        });
    };
}

export function updateGroup(groupId, options = {}) {
    return (dispatch) => {
        dispatch({ type: types.UPDATING_GROUP });

        const csrftoken = cookie.load('csrftoken');

        const data = {};

        if (options.name) data.name = options.name;
        if (options.members) data.members = options.members;
        if (options.administrators) data.administrators = options.administrators;

        return axios({
            url: `/api/groups/${groupId}`,
            method: 'PATCH',
            headers: { 'X-CSRFToken': csrftoken },
            data,
        }).then(() => {
            dispatch({ type: types.UPDATED_GROUP });
        }).catch((error) => {
            dispatch({ type: types.UPDATING_GROUP_ERROR, error: error.response.data });
        });
    };
}
