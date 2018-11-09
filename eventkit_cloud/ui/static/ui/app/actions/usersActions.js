import axios from 'axios';
import cookie from 'react-cookie';
import { makeAuthRequired } from './authActions';

export const types = {
    FETCHING_USERS: 'FETCHING_USERS',
    FETCHED_USERS: 'FETCHED_USERS',
    FETCH_USERS_ERROR: 'FETCH_USERS_ERROR',
};

export function getUsers(params) {
    return (dispatch) => {
        dispatch(makeAuthRequired({ type: types.FETCHING_USERS }));

        const csrfmiddlewaretoken = cookie.load('csrftoken');

        return axios({
            url: '/api/users',
            params,
            method: 'GET',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        }).then((response) => {
            // get the total count from the header
            const totalUsers = Number(response.headers['total-users']);

            let nextPage = false;
            let links = [];

            if (response.headers.link) {
                links = response.headers.link.split(',');
            }

            links.forEach((link) => {
                if (link.includes('rel="next"')) {
                    nextPage = true;
                }
            });

            let range = '';
            if (response.headers['content-range']) {
                [, range] = response.headers['content-range'].split('-');
            }

            const users = response.data;
            dispatch(makeAuthRequired({
                type: types.FETCHED_USERS,
                users,
                total: totalUsers,
                range,
                nextPage,
            }));
        }).catch((error) => {
            dispatch(makeAuthRequired({ type: types.FETCH_USERS_ERROR, error: error.response.data }));
        });
    };
}
