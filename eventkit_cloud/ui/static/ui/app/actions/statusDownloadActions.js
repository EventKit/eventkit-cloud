import axios from 'axios';
import cookie from 'react-cookie';
import types from './actionTypes';

export const getDatacartDetails = jobuid => (dispatch) => {
    dispatch({
        type: types.GETTING_DATACART_DETAILS,
    });

    return axios({
        url: `/api/runs?job_uid=${jobuid}`,
        method: 'GET',
    }).then((response) => {
        const data = { ...response.data[0] };

        dispatch({
            type: types.DATACART_DETAILS_RECEIVED,
            datacartDetails: {
                data: [data],
            },
        });
    }).catch((error) => {
        console.log(error);
        dispatch({
            type: types.DATACART_DETAILS_ERROR, error,
        });
    });
};

export function deleteRun(uid) {
    return (dispatch) => {
        dispatch({ type: types.DELETING_RUN });

        const csrftoken = cookie.load('csrftoken');
        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', csrftoken);

        return axios({
            url: `/api/runs/${uid}`,
            method: 'DELETE',
            data: formData,
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            dispatch({ type: types.DELETED_RUN });
        }).catch((error) => {
            dispatch({ type: types.DELETE_RUN_ERROR, error });
        });
    };
}

export const rerunExport = jobuid => (dispatch) => {
    dispatch({
        type: types.RERUNNING_EXPORT,
    });

    const csrfmiddlewaretoken = cookie.load('csrftoken');
    return axios({
        url: `/api/jobs/${jobuid}/run`,
        method: 'POST',
        contentType: 'application/json; version=1.0',
        headers: { 'X-CSRFToken': csrfmiddlewaretoken },
    }).then((response) => {
        dispatch({
            type: types.RERUN_EXPORT_SUCCESS,
            exportReRun: {
                data: response.data,
            },
        });
    }).catch((error) => {
        console.log(error);
        dispatch({
            type: types.RERUN_EXPORT_ERROR, error,
        });
    });
};

export function clearReRunInfo() {
    return {
        type: types.CLEAR_RERUN_INFO,
    };
}

export function cancelProviderTask(uid) {
    return (dispatch) => {
        dispatch({ type: types.CANCELING_PROVIDER_TASK });

        const csrftoken = cookie.load('csrftoken');

        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', csrftoken);

        return axios({
            url: `/api/provider_tasks/${uid}`,
            method: 'PATCH',
            data: formData,
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            dispatch({ type: types.CANCELED_PROVIDER_TASK });
        }).catch((error) => {
            dispatch({ type: types.CANCEL_PROVIDER_TASK_ERROR, error });
        });
    };
}

export function updateExpiration(uid, expiration) {
    return (dispatch) => {
        dispatch({ type: types.UPDATING_EXPIRATION });
        const csrftoken = cookie.load('csrftoken');
        return axios({
            url: `/api/runs/${uid}`,
            method: 'PATCH',
            data: { expiration },
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            dispatch({ type: types.UPDATE_EXPIRATION_SUCCESS });
        }).catch((error) => {
            dispatch({ type: types.UPDATE_EXPIRATION_ERROR, error });
        });
    };
}

export function updatePermission(uid, value) {
    return (dispatch) => {
        dispatch({ type: types.UPDATING_PERMISSION });
        const csrftoken = cookie.load('csrftoken');

        return axios({
            url: `/api/jobs/${uid}`,
            method: 'PATCH',
            data: { published: value },
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            dispatch({ type: types.UPDATE_PERMISSION_SUCCESS });
        }).catch((error) => {
            dispatch({ type: types.UPDATE_PERMISSION_ERROR, error });
        });
    };
}
