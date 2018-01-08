import axios from 'axios';
import cookie from 'react-cookie';
import MockAdapter from 'axios-mock-adapter'; /// JUST FOR MOCKING ///
import types from './actionTypes';

export function getGroups(params) {
    return (dispatch, getState) => {
        //////// JUST FOR MOCKING THE API /////////////
        const fakeUsers = [
            { name: 'admin', email: 'admin@eventkit.dev', groups: ['uid-0', 'uid-2', 'uid-3', 'uid-5', 'uid-6', 'uid-9', 'uid-12', 'uid-15', 'uid-18'] },
            { name: 'Jane Doe', email: 'jane.doe@email.com', groups: ['uid-0', 'uid-2', 'uid-3', 'uid-6', 'uid-8', 'uid-10', 'uid-14', 'uid-16', 'uid-20'] },
            { name: 'John Doe', email: 'john.doe@email.com', groups: ['uid-0', 'uid-2', 'uid-3', 'uid-6', 'uid-7', 'uid-11', 'uid-13', 'uid-17', 'uid-19'] },
            { name: 'Joe Shmo', email: 'joe.shmo@email.com', groups: ['uid-0', 'uid-2', 'uid-1', 'uid-3', 'uid-2', 'uid-3', 'uid-5', 'uid-8', 'uid-9', 'uid-12', 'uid-13', 'uid-14', 'uid-18', 'uid-19', 'uid-20'] },
            { name: 'User 1', email: 'user1@email.com', groups: ['uid-0', 'uid-2', 'uid-3', 'uid-6', 'uid-8', 'uid-10', 'uid-14', 'uid-16', 'uid-20'] },
            { name: 'User 2', email: 'user2@email.com', groups: ['uid-1', 'uid-2', 'uid-3', 'uid-6', 'uid-8', 'uid-9', 'uid-14', 'uid-16', 'uid-20'] },
            { name: 'User 3', email: 'user3@email.com', groups: ['uid-1', 'uid-2', 'uid-4', 'uid-7', 'uid-9', 'uid-11', 'uid-13', 'uid-17', 'uid-20'] },
        ];
        const fakeGroups = [];
        for (let i = 0; i < 21; i++) {
            let count = 0;
            count = fakeUsers.reduce((ac, cv) => (
                ac + (cv.groups.includes(`uid-${i}`) ? 1 : 0)
            ), count);
            fakeGroups.push({
                name: `Group ${i}`,
                memberCount: count,
                owners: i === 18 ? [fakeUsers[1]] : [fakeUsers[0]],
                uid: `uid-${i}`,
            });
        }

        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onGet('/api/groups').reply(200, fakeGroups);
        //////////////////////////////////////////////////////////////

        const { groups } = getState();
        if (groups.fetching && groups.cancelSource) {
            // if there is already a request in process we need to cancel it
            // before executing the current request
            groups.cancelSource.cancel('Request is no longer valid, cancelling');
        }

        const { CancelToken } = axios;
        const source = CancelToken.source();

        dispatch({ type: types.FETCHING_GROUPS, cancelSource: source });

        const url = params ? `/api/groups?${params}` : '/api/groups';
        const csrfmiddlewaretoken = cookie.load('csrftoken');

        return axios({
            url,
            method: 'GET',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: source.token,
        }).then((response) => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.FETCHED_GROUPS, groups: response.data });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                mock.restore(); //// JUST FOR MOCKING
                dispatch({ type: types.FETCH_GROUPS_ERROR, error: error.response.data });
            }
        });
    };
}

export function deleteGroup(groupUID) {
    return (dispatch) => {
        //////// JUST FOR MOCKING THE API /////////////
        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onDelete(`/api/groups/${groupUID}`).reply(400, 'The requested group could could not be found and deleted, if problems persist please contact an administrator');
        //////////////////////////////////////////////////////////////
        dispatch({ type: types.DELETING_GROUP });

        const csrftoken = cookie.load('csrftoken');

        return axios({
            url: `/api/groups/${groupUID}`,
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.DELETED_GROUP });
        }).catch((error) => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.DELETE_GROUP_ERROR, error: error.response.data });
        });
    };
}

export function createGroup(groupName, members) {
    return (dispatch) => {
        //////// JUST FOR MOCKING THE API /////////////
        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onPut('/api/groups').reply(200);
        //////////////////////////////////////////////////////////////

        dispatch({ type: types.CREATING_GROUP });

        const csrftoken = cookie.load('csrftoken');

        return axios({
            url: '/api/groups',
            method: 'PUT',
            headers: { 'X-CSRFToken': csrftoken },
            data: JSON.stringify({ name: groupName, members }),
        }).then(() => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.CREATED_GROUP });
        }).catch((error) => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.CREATE_GROUP_ERROR, error: error.response.data });
        });
    };
}

export function addGroupUsers(groupUID, users) {
    return (dispatch) => {
        //////// JUST FOR MOCKING THE API /////////////
        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onPost(`/api/groups/${groupUID}`).reply(200);
        //////////////////////////////////////////////////////////////
        dispatch({ type: types.ADDING_GROUP_USERS });

        const csrftoken = cookie.load('csrftoken');

        return axios({
            url: `/api/groups/${groupUID}`,
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            data: JSON.stringify({ add: users }),
        }).then(() => {
            mock.restore(); ///// JUST FOR MOCKING
            dispatch({ type: types.ADDED_GROUP_USERS });
        }).catch((error) => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.ADDING_GROUP_USERS_ERROR, error: error.response.data });
        });
    };
}

export function removeGroupUsers(groupUID, users) {
    return (dispatch) => {
        //////// JUST FOR MOCKING THE API /////////////
        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onPost(`/api/groups/${groupUID}`).reply(200);
        //////////////////////////////////////////////////////////////
        dispatch({ type: types.REMOVING_GROUP_USERS });

        const csrftoken = cookie.load('csrftoken');

        return axios({
            url: `/api/groups/${groupUID}`,
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            data: JSON.stringify({ remove: users }),
        }).then(() => {
            mock.restore(); ///// JUST FOR MOCKING
            dispatch({ type: types.REMOVED_GROUP_USERS });
        }).catch((error) => {
            mock.restore(); ///// JUST FOR MOCKING
            dispatch({ type: types.REMOVING_GROUP_USERS_ERROR, error: error.response.data });
        });
    };
}

