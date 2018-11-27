import { getHeaderPageInfo } from '../utils/generic';

export const types = {
    FETCHING_USERS: 'FETCHING_USERS',
    FETCHED_USERS: 'FETCHED_USERS',
    FETCH_USERS_ERROR: 'FETCH_USERS_ERROR',
};

export function getUsers(params) {
    return {
        types: [
            types.FETCHING_USERS,
            types.FETCHED_USERS,
            types.FETCH_USERS_ERROR,
        ],
        getCancelSource: state => state.users.cancelSource,
        cancellable: true,
        url: '/api/users',
        method: 'GET',
        params,
        onSuccess: (response) => {
            // get the total count from the header
            const totalUsers = Number(response.headers['total-users']);
            const { nextPage, range } = getHeaderPageInfo(response);

            return {
                users: response.data,
                total: totalUsers,
                range,
                nextPage,
            };
        },
    };
}
