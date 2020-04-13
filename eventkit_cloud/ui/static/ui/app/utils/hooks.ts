import {useCallback, useEffect, useReducer, useRef, useState} from "react";
import axios from "axios";

// Convenience function that acts like componentDidMount.
// useEffect replaces componentDidMount AND componentDidUpdate
// sending an empty array to the second param of useEffect causes it to fire only once, on mount.
// useEffect may return a function that will be called as a cleanup operation.
// cleanup function is used like componentWillUnmount
export const useEffectOnMount = (effect: () => void) => useEffect(effect, []);


// From react docs, custom hook that allows access to the previous state of a value.
// Example usage:
// --- const [count, setCount] = useState(0);
// --- const prevCount = usePrevious(count);
function usePrevious(stateValue) {
    const ref = useRef();
    useEffect(() => {
        ref.current = stateValue;
    });
    return ref.current;
}

enum ACTIONS {
    FETCHING,
    SUCCESS,
    ERROR,
    CLEAR,
}

interface RequestState {status: any, response: any}
const initialState = { status: null, response: {} } as RequestState;
function submitReducer(state = initialState, { type = undefined, response = undefined } = {}) : RequestState {
    switch (type) {
        case ACTIONS.FETCHING:
            return { ...initialState, status: 'fetching' };
        case ACTIONS.SUCCESS:
            return { ...state, status: 'success', response };
        case ACTIONS.ERROR:
            return { ...state, status: 'error', response };
        case ACTIONS.CLEAR:
            return { ...initialState };
        default:
            return state;
    }
}

interface Dispatcher {
    fetching: () => void;
    success: (response) => void;
    error: (response) => void;
    clear: () => void;
}

// Async request hook with more fine grained ability to control the request.
export function useAsyncRequest_Control(): [RequestState, Dispatcher] {
    const [state, dispatch] = useReducer(submitReducer, initialState);
    const dispatches = {
        fetching: () => dispatch({ type: ACTIONS.FETCHING }),
        success: (response) => dispatch({ type: ACTIONS.SUCCESS, response }),
        error: (response) => dispatch({ type: ACTIONS.ERROR, response }),
        clear: () => dispatch({ type: ACTIONS.CLEAR }),
    };
    return [state, dispatches]
}

export function useAsyncRequest(): [RequestState, ((params: any) => Promise<void>)] {
    const [state, dispatches] = useAsyncRequest_Control();
    const makeRequest = useCallback(async (params: any) => {
        dispatches.fetching();
        try {
            const response = await axios({ ...params });
            dispatches.success(response);
        } catch (e) {
            dispatches.error(e);
        }
    }, []);
    return [state, makeRequest];
}

export class DepsHashers {

    private static readonly emptyEstimate = DepsHashers.stringHash('-1:-1');

    static stringHash(value: string) : number {
        let h;
        for (let i = 0; i < value.length; i += 1) {
            // eslint-disable-next-line no-bitwise
            h = Math.imul(31, h) + value.charCodeAt(i) | 0;
        }
        return h;
    }

    static arrayHash(arrayIn: any[], hasher?: (val: any) => number | string) : number {
        if (!hasher) {
            hasher = DepsHashers.stringHash;
        }
        let hash = '';
        arrayIn.forEach((val) => hash += hasher(val));
        return DepsHashers.stringHash(hash);
    }

    static providerIdentityHash(provider: Eventkit.Provider) : number {
        return DepsHashers.stringHash(provider.slug + provider.name);
    }

    static providerEstimate(estimates: Eventkit.Store.Estimates) : number {
        const {size = undefined, time = undefined} = estimates || {};
        if (!size && !time) {
            return DepsHashers.emptyEstimate;
        }
        return DepsHashers.stringHash(`${size.value}:${time.value}`);
    }
}

export function useProviderIdentity(effect: () => void, providers: Eventkit.Provider[]) {
    useEffect(effect, [DepsHashers.arrayHash(providers.map(provider => DepsHashers.providerIdentityHash(provider)))]);
}

export function useProvidersLoading(providers: Eventkit.Provider[]): [boolean, ((provider: Eventkit.Provider, isLoading: boolean) => void)] {
    const slugMap = useRef({});
    const [ areProvidersLoading, setAreProvidersLoading ] = useState(true);
    const [ flag, setFlag ] = useState(false);
    useProviderIdentity(() => {
        providers.map(provider => slugMap.current[provider.slug] = slugMap.current[provider.slug] || true);
    }, providers);
    useEffect(() => {
        setAreProvidersLoading(Object.values(slugMap.current).some(value => value));
    }, [flag]);
    function setProviderLoading(provider: Eventkit.Provider, isLoading: boolean)  {
        slugMap.current[provider.slug] = isLoading;
        setFlag(flag => !flag);
    }
    return [areProvidersLoading, setProviderLoading];
}