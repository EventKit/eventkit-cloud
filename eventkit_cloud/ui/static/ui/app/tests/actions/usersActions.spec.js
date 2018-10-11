import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import createTestStore from '../../store/configureTestStore';
import * as actions from '../../actions/usersActions';

describe('usersActions actions', () => {
    it('getUsers should fetch users from the api', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const users = [
            { user: { name: 'user1', username: 'user1' } },
            { user: { name: 'user2', username: 'user2' } },
            { user: { name: 'user3', username: 'user3' } },
        ];
        const headers = {
            'total-users': '3',
            'new-users': '2',
            'not-grouped-users': '1',
        };
        mock.onGet('/api/users').reply(200, users, headers);

        const expectedUsers = [
            users[0],
            users[1],
            users[2],
        ];

        const expectedActions = [
            { type: actions.types.FETCHING_USERS },
            {
                type: actions.types.FETCHED_USERS,
                users: expectedUsers,
                total: 3,
                new: 2,
                ungrouped: 1,
            },
        ];

        const store = createTestStore({
            user: {
                data: {
                    user: { username: 'user1' },
                },
            },
        });

        return store.dispatch(actions.getUsers())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getUsers should handle fetching error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const error = 'Oh no an error';
        mock.onGet('/api/users').reply(400, error);
        const expectedActions = [
            { type: actions.types.FETCHING_USERS },
            { type: actions.types.FETCH_USERS_ERROR, error },
        ];
        const store = createTestStore({
            user: { data: { user: {} } },
        });

        return store.dispatch(actions.getUsers())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
