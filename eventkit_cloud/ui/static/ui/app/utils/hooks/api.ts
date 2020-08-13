import {useCallback, useReducer} from "react";
import axios from "axios";


export enum ACTIONS {
    FETCHING='fetching',
    SUCCESS='success',
    ERROR='error',
    CANCEL='cancel',
    NOT_FIRED='not_fired',
}

enum FileStatus {
    PENDING='PENDING',
    RUNNING='RUNNING',
    SUCCESS='SUCCESS',
    FAILED='FAILED',
}

export class ApiStatuses {
    static readonly hookActions = ACTIONS;
    static readonly files = FileStatus;

    public static readonly IsFetching = (status: any) => status === ACTIONS.FETCHING;
    public static readonly IsSuccess = (status: any) => status === ACTIONS.SUCCESS;
    public static readonly IsNotFired = (status: any) => status === ACTIONS.NOT_FIRED;
    public static readonly IsError = (status: any) => status === ACTIONS.ERROR;
}

interface RequestState {
    status: any,
    response: any
    onCancel: () => void;
}

const initialState = {
    status: ACTIONS.NOT_FIRED, response: {}, onCancel: () => {
    }
} as RequestState;

function submitReducer(state = initialState, {type = undefined, response = undefined, onCancel = undefined} = {}): RequestState {
    switch (type) {
        case ACTIONS.FETCHING:
            return {...initialState, status: ACTIONS.FETCHING, onCancel: onCancel ? onCancel : initialState.onCancel};
        case ACTIONS.SUCCESS:
            return {...state, status: ACTIONS.SUCCESS, response};
        case ACTIONS.ERROR:
            return {...state, status: ACTIONS.ERROR, response};
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

export function useAsyncRequest(cancelMessage=''): [RequestState, (params: any) => Promise<void>, () => void] {
    const [state, dispatches] = useAsyncRequest_Control();
    const makeRequest = useCallback(async (params: any) => {
        const CancelToken = axios.CancelToken;
        const source = CancelToken.source();
        dispatches.fetching(() => source.cancel(cancelMessage));
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
