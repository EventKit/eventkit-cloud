import { getHeaderPageInfo } from '../utils/generic';

export const types = {
    CLEAR_USERS: 'CLEAR_USERS',
    FETCHED_USERS: 'FETCHED_USERS',
    FETCHING_USERS: 'FETCHING_USERS',
    FETCH_USERS_ERROR: 'FETCH_USERS_ERROR',
};

export function clearUsers() {
    return { type: types.CLEAR_USERS };
}

export function getUsers(params, append = false) {
    return {
        cancellable: true,
        getCancelSource: state => state.users.cancelSource,
        method: 'GET',
        onSuccess: (response) => {
            // get the total count from the header
            const totalUsers = Number(response.headers['total-users']);
            const { nextPage, range } = getHeaderPageInfo(response);

            return {
                nextPage,
                range,
                total: totalUsers,
                users: response.data,
            };
        },
        params,
        payload: { append },
        types: [
            types.FETCHING_USERS,
            types.FETCHED_USERS,
            types.FETCH_USERS_ERROR,
        ],
        url: '/api/users',
    };
}
