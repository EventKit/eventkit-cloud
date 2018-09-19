import axios from 'axios';
import cookie from 'react-cookie';

export const types = {
    FETCHING_USERS: 'FETCHING_USERS',
    FETCHED_USERS: 'FETCHED_USERS',
    FETCH_USERS_ERROR: 'FETCH_USERS_ERROR',
};

export function getUsers(params) {
    return (dispatch) => {
        dispatch({ type: types.FETCHING_USERS });

        const csrfmiddlewaretoken = cookie.load('csrftoken');

        return axios({
            url: '/api/users',
            params,
            method: 'GET',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        }).then((response) => {
            // get the total, new, and ungrouped counts from the header
            const totalUsers = Number(response.headers['total-users']);
            const newUsers = Number(response.headers['new-users']);
            const ungroupedUsers = Number(response.headers['not-grouped-users']);

            const users = response.data;
            dispatch({
                type: types.FETCHED_USERS,
                users,
                total: totalUsers,
                new: newUsers,
                ungrouped: ungroupedUsers,
            });
        }).catch((error) => {
            dispatch({ type: types.FETCH_USERS_ERROR, error: error.response.data });
        });
    };
}
