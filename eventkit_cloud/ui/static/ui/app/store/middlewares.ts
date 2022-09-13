import axios from 'axios';
import { getCookie } from '../utils/generic'

export const crashReporter = () => next => (action) => {
    try {
        return next(action);
    } catch (err) {
        console.error('Caught an exception!', err);
        throw err;
    }
};

export const simpleApiCall = ({ dispatch, getState }) => next => (action) => {
    if (Array.isArray(action)) {
        // batch action: pass it on
        return next(action);
    }

    const {
        types,
        auto = false,
        getCancelSource = () => undefined,
        shouldCallApi = () => true,
        requiresAuth = true,
        onSuccess = () => ({}),
        batchSuccess = () => undefined,
        onError = error => ({ error: error.response?.data }),
        payload = {},
        url,
        method,
        params,
        data,
        headers = {},
        cancellable = false,
    } = action;

    if (!types) {
        // normal action: pass it on
        return next(action);
    }

    if (!Array.isArray(types) || types.length !== 3 || !types.every(type => typeof type === 'string')) {
        throw new Error('Expected an array of three string types.');
    }

    const state = getState();

    if (requiresAuth) {
        if (!state.user.data) {
            throw new Error('Authentication is required for this action');
        }
    }

    if (!shouldCallApi(state)) {
        return;
    }

    const source = getCancelSource(state);
    if (!auto && source) {
        source.abort();
    }

    const cancelSource = cancellable ? new AbortController() : undefined;
    const signal = cancelSource ? cancelSource.signal : undefined;

    const [requestType, successType, failureType] = types;

    dispatch({...payload, cancelSource, type: requestType});

    const csrftoken = getCookie('csrftoken');

    return axios({
        url,
        method,
        params,
        data,
        headers: { 'X-CSRFToken': csrftoken, ...headers },
        signal: signal,
    }).then((response) => {
        const batched = batchSuccess(response, state);
        if (batched) {
            dispatch([
                { ...payload, type: successType, ...onSuccess(response) },
                ...batched,
            ]);
        } else {
            dispatch({ ...payload, type: successType, ...onSuccess(response) });
        }
    }).catch(error => {
        if (axios.isAxiosError(error)) {
            dispatch({ ...payload, type: failureType, ...onError(error) });
        } else {
            console.warn(error.message);
            //dispatch({ ...payload, type: failureType, ...onError(error) });
        }
    });
};
