import {useCallback, useReducer} from "react";
import axios from "axios";


enum ACTIONS {
    FETCHING,
    SUCCESS,
    ERROR,
    CANCEL,
}

interface RequestState {
    status: any,
    response: any
    onCancel: () => void;
}

const initialState = {
    status: null, response: {}, onCancel: () => {
    }
} as RequestState;

function submitReducer(state = initialState, {type = undefined, response = undefined, onCancel = undefined} = {}): RequestState {
    switch (type) {
        case ACTIONS.FETCHING:
            return {...initialState, status: 'fetching', onCancel: onCancel ? onCancel : initialState.onCancel};
        case ACTIONS.SUCCESS:
            return {...state, status: 'success', response};
        case ACTIONS.ERROR:
            return {...state, status: 'error', response};
        case ACTIONS.CANCEL:
            return {...initialState};
        default:
            return state;
    }
}

interface Dispatcher {
    fetching: (onCancel: () => void) => void;
    success: (response) => void;
    error: (response) => void;
    cancel: () => void;
}

// Async request hook with more fine grained ability to control the request.
export function useAsyncRequest_Control(): [RequestState, Dispatcher] {
    const [state, dispatch] = useReducer(submitReducer, initialState);
    const dispatches = {
        fetching: (onCancel: () => void) => dispatch({onCancel, type: ACTIONS.FETCHING}),
        success: (response) => dispatch({type: ACTIONS.SUCCESS, response}),
        error: (response) => dispatch({type: ACTIONS.ERROR, response}),
        cancel: () => {
            if (state.onCancel) {
                state.onCancel();
            }
            dispatch({type: ACTIONS.CANCEL})
        },
    };
    return [state, dispatches]
}

export function useAsyncRequest(): [RequestState, (params: any) => Promise<void>, () => void] {
    const [state, dispatches] = useAsyncRequest_Control();
    const makeRequest = useCallback(async (params: any) => {
        const CancelToken = axios.CancelToken;
        const source = CancelToken.source();
        dispatches.fetching(() => source.cancel(''));
        try {
            const response = await axios({
                ...params,
                cancelToken: source.token,
            });
            dispatches.success(response);
        } catch (e) {
            dispatches.error(e);
        }
    }, []);
    return [state, makeRequest, dispatches.cancel];
}