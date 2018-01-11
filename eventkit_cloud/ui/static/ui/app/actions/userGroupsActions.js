import axios from 'axios';
import cookie from 'react-cookie';
import MockAdapter from 'axios-mock-adapter'; /// JUST FOR MOCKING ///
import types from './actionTypes';

export function getGroups(params) {
    return (dispatch, getState) => {
        //////// JUST FOR MOCKING THE API /////////////
        const fakeUsers = [
            { username: 'admin', name: 'admin', email: 'admin@eventkit.dev', groups: ['id-0', 'id-2', 'id-3', 'id-5', 'id-6', 'id-9', 'id-12', 'id-15', 'id-18'] },
            { username: 'JaneD', name: 'Jane Doe', email: 'jane.doe@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-8', 'id-10', 'id-14', 'id-16', 'id-20'] },
            { username: 'JohnD', name: 'John Doe', email: 'john.doe@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-7', 'id-11', 'id-13', 'id-17', 'id-19'] },
            { username: 'JoeS', name: 'Joe Shmo', email: 'joe.shmo@email.com', groups: ['id-0', 'id-2', 'id-1', 'id-3', 'id-2', 'id-3', 'id-5', 'id-8', 'id-9', 'id-12', 'id-13', 'id-14', 'id-18', 'id-19', 'id-20'] },
            { username: 'U1', name: 'User 1', email: 'user1@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-8', 'id-10', 'id-14', 'id-16', 'id-20'] },
            { username: 'U2', name: 'User 2', email: 'user2@email.com', groups: ['id-1', 'id-2', 'id-3', 'id-6', 'id-8', 'id-9', 'id-14', 'id-16', 'id-20'] },
            { username: 'U3', name: 'User 3', email: 'user3@email.com', groups: ['id-1', 'id-2', 'id-4', 'id-7', 'id-9', 'id-11', 'id-13', 'id-17', 'id-20'] },
        ];
        const fakeGroups = [];
        for (let i = 0; i < 21; i++) {
            fakeGroups.push({
                name: `Group ${i}`,
                owners: i === 18 ? [fakeUsers[1].username] : [fakeUsers[0].username],
                id: `id-${i}`,
                members: fakeUsers.filter(user => user.groups.includes(`id-${i}`)).map(user => (user.username)),
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

export function deleteGroup(groupId) {
    return (dispatch) => {
        //////// JUST FOR MOCKING THE API /////////////
        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onDelete(`/api/groups/${groupId}`).reply(200);
        //////////////////////////////////////////////////////////////
        dispatch({ type: types.DELETING_GROUP });

        const csrftoken = cookie.load('csrftoken');

        return axios({
            url: `/api/groups/${groupId}`,
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

export function addGroupUsers(group, users) {
    return (dispatch) => {
        //////// JUST FOR MOCKING THE API /////////////
        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onPost(`/api/groups/${group.id}`).reply(200);
        //////////////////////////////////////////////////////////////
        dispatch({ type: types.ADDING_GROUP_USERS });

        const csrftoken = cookie.load('csrftoken');

        const members = [...group.members, ...users];

        return axios({
            url: `/api/groups/${group.id}`,
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            data: JSON.stringify({ members }),
        }).then(() => {
            mock.restore(); ///// JUST FOR MOCKING
            dispatch({ type: types.ADDED_GROUP_USERS });
        }).catch((error) => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.ADDING_GROUP_USERS_ERROR, error: error.response.data });
        });
    };
}

export function removeGroupUsers(group, users) {
    return (dispatch) => {
        //////// JUST FOR MOCKING THE API /////////////
        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onPost(`/api/groups/${group.id}`).reply(200);
        //////////////////////////////////////////////////////////////
        dispatch({ type: types.REMOVING_GROUP_USERS });

        const csrftoken = cookie.load('csrftoken');

        const members = group.members.filter(member => (!users.includes(member)));

        return axios({
            url: `/api/groups/${group.id}`,
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            data: JSON.stringify({ members }),
        }).then(() => {
            mock.restore(); ///// JUST FOR MOCKING
            dispatch({ type: types.REMOVED_GROUP_USERS });
        }).catch((error) => {
            mock.restore(); ///// JUST FOR MOCKING
            dispatch({ type: types.REMOVING_GROUP_USERS_ERROR, error: error.response.data });
        });
    };
}

