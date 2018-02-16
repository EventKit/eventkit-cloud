import axios from 'axios';
import cookie from 'react-cookie';
import MockAdapter from 'axios-mock-adapter'; /// JUST FOR MOCKING ///
import types from './actionTypes';

export function getGroups(params) {
    return (dispatch, getState) => {
        //////// JUST FOR MOCKING THE API /////////////
        const fakeUsers = [
            { username: 'admin', name: 'admin', email: 'admin@eventkit.dev', groups: ['id-18'] },
            { username: 'JaneD', name: 'Jane Doe', email: 'jane.doe@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-8', 'id-10', 'id-14', 'id-16', 'id-20'] },
            { username: 'JohnD', name: 'John Doe', email: 'john.doe@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-7', 'id-11', 'id-13', 'id-17', 'id-19'] },
            { username: 'JoeS', name: 'Joe Shmo', email: 'joe.shmo@email.com', groups: ['id-0', 'id-2', 'id-1', 'id-3', 'id-2', 'id-3', 'id-5', 'id-8', 'id-9', 'id-12', 'id-13', 'id-14', 'id-18', 'id-19', 'id-20'] },
            { username: 'U1', name: 'User 1', email: 'user1@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-8', 'id-10', 'id-14', 'id-16', 'id-20'] },
            { username: 'U2', name: 'User 2', email: 'user2@email.com', groups: ['id-1', 'id-2', 'id-3', 'id-6', 'id-8', 'id-9', 'id-14', 'id-16', 'id-20'] },
            { username: 'U3', name: 'User 3', email: 'user3@email.com', groups: ['id-1', 'id-2', 'id-4', 'id-7', 'id-9', 'id-11', 'id-13', 'id-17', 'id-20'] },
        ];
        
        const fakeGroups = [
            {
                name: 'Group 0',
                administrators: ['admin', 'JohnD'],
                id: 'id-0',
                members: ['JaneD', 'JohnD', 'JoeS', 'U1'],
            }, {
                name: 'Group 1',
                administrators: ['admin', 'JoeS', 'U2'],
                id: 'id-1',
                members: ['JoeS', 'U2', 'U3'],
            }, {
                name: 'Group 2',
                administrators: ['admin'],
                id: 'id-2',
                members: ['JaneD', 'JohnD', 'JoeS', 'U1', 'U2', 'U3'],
            }, {
                name: 'Group 3',
                administrators: ['admin'],
                id: 'id-3',
                members: ['JaneD', 'JohnD', 'JoeS', 'U1', 'U2'],
            }, {
                name: 'Group 4',
                administrators: ['admin'],
                id: 'id-4',
                members: ['U3'],
            }, {
                name: 'Group 5',
                administrators: ['admin'],
                id: 'id-5',
                members: ['JoeS'],
            }, {
                name: 'Group 6',
                administrators: ['admin'],
                id: 'id-6',
                members: ['JaneD', 'JohnD', 'U1', 'U2'],
            }, {
                name: 'Group 7',
                administrators: ['admin'],
                id: 'id-7',
                members: ['JohnD', 'U3'],
            }, {
                name: 'Group 8',
                administrators: ['admin'],
                id: 'id-8',
                members: ['JaneD', 'JoeS', 'U1', 'U2'],
            }, {
                name: 'Group 9',
                administrators: ['admin'],
                id: 'id-9',
                members: ['JoeS', 'U2', 'U3'],
            }, {
                name: 'Group 10',
                administrators: ['admin'],
                id: 'id-10',
                members: ['JaneD', 'U1'],
            }, {
                name: 'Group 11',
                administrators: ['admin'],
                id: 'id-11',
                members: ['JohnD', 'U3'],
            }, {
                name: 'Group 12',
                administrators: ['admin'],
                id: 'id-12',
                members: ['JoeS'],
            }, {
                name: 'Group 13',
                administrators: ['admin'],
                id: 'id-13',
                members: ['JohnD', 'JoeS', 'U3'],
            }, {
                name: 'Group 14',
                administrators: ['admin'],
                id: 'id-14',
                members: ['JaneD', 'JoeS', 'U1', 'U2'],
            }, {
                name: 'Group 15',
                administrators: ['admin'],
                id: 'id-15',
                members: [],
            }, {
                name: 'Group 16',
                administrators: ['admin'],
                id: 'id-16',
                members: ['JaneD', 'U1', 'U2'],
            }, {
                name: 'Group 17',
                administrators: ['admin'],
                id: 'id-17',
                members: ['JohnD', 'U3'],
            }, {
                name: 'Group 18',
                administrators: ['JaneD'],
                id: 'id-18',
                members: ['admin', 'JoeS'],
            }, {
                name: 'Group 19',
                administrators: ['admin'],
                id: 'id-19',
                members: ['JohnD', 'JoeS'],
            }, {
                name: 'Group 20',
                administrators: ['admin'],
                id: 'id-20',
                members: ['JaneD', 'JoeS', 'U1', 'U2', 'U3'],
            },
        ];

        const fakeAxios = axios.create();
        const mock = new MockAdapter(fakeAxios, { delayResponse: 3000 });
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

        return fakeAxios({
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

export function createGroup(groupName, members = [], administrators = []) {
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
            data: JSON.stringify({ name: groupName, members, administrators }),
        }).then(() => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.CREATED_GROUP });
        }).catch((error) => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.CREATE_GROUP_ERROR, error: error.response.data });
        });
    };
}

export function updateGroup(groupId, options = {}) {
    return (dispatch) => {
        //////// JUST FOR MOCKING THE API /////////////
        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onPost(`/api/groups/${groupId}`).reply(200);
        //////////////////////////////////////////////////////////////
        dispatch({ type: types.UPDATING_GROUP });

        const csrftoken = cookie.load('csrftoken');

        const data = {};

        if (options.name) data.name = options.name;
        if (options.members) data.members = options.members;
        if (options.administrators) data.administrators = options.administrators;

        console.log(options);

        return axios({
            url: `/api/groups/${groupId}`,
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            data: JSON.stringify(data),
        }).then(() => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.UPDATED_GROUP });
        }).catch((error) => {
            mock.restore(); //// JUST FOR MOCKING
            dispatch({ type: types.UPDATE_GROUP_ERROR, error: error.response.data });
        });
    };
}
