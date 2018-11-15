import axios from 'axios';
import cookie from 'react-cookie';

export const crashReporter = () => next => (action) => {
    try {
        return next(action);
    } catch (err) {
        console.error('Caught an exception!', err);
        throw err;
    }
};

// do not let actions update state if auth is required and user not signed-in
export const checkAuth = store => next => (action) => {
    const { user } = store.getState();
    // if user is not signed in check the actions before proceeding
    if (!user.data) {
        // ignore thunk actions and only process objects
        if (typeof action === 'object') {
            // if its an array of actions we need to check each one
            if (Array.isArray(action)) {
                // eslint-disable-next-line no-underscore-dangle
                const actions = action.filter(a => !a._auth_required);
                // if all actions filtered out log and return
                if (!actions.length) {
                    console.error('Authentication is required for these actions:', action);
                    return undefined;
                }
                // if some actions left then execute them
                return next(actions);
                // eslint-disable-next-line no-underscore-dangle
            } else if (action._auth_required) {
                // if action is a json obj and requires auth return
                console.error('Authentication is required for action:', action);
                return undefined;
            }
        }
    }

    return next(action);
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
        onSuccess = () => ({}),
        onError = () => ({}),
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

    if (!shouldCallApi(getState())) {
        return;
    }

    const source = getCancelSource(getState());
    if (!auto && source) {
        source.cancel('Request is no longer valid, cancelling.');
    }

    const cancelSource = cancellable ? axios.CancelToken.source() : undefined;
    const token = cancelSource ? cancelSource.token : undefined;

    const [requestType, successType, failureType] = types;

    dispatch({ ...payload, cancelSource, type: requestType });

    const csrftoken = cookie.load('csrftoken');

    axios({
        url,
        method,
        params,
        data,
        headers: { 'X-CSRFToken': csrftoken, ...headers },
        cancelToken: token,
    }).then(response => (
        dispatch({ ...payload, type: successType, ...onSuccess(response) })
    )).catch(error => {
        if (axios.isCancel(error)) {
            console.warn(error.message);
        } else {
            dispatch({ ...payload, type: failureType, ...onError(error) });
        }
    });

};
