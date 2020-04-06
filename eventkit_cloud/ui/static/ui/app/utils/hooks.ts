import {Dispatch, ReducerAction, ReducerState, useCallback, useEffect, useReducer, useRef} from "react";
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

const initialState = {
    status: null,
    response: {},
};

function submitReducer(state = initialState, { type = undefined, response = undefined } = {}) {
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
}

// Async request hook with more fine grained ability to control the request.
export function useAsyncRequest_Control(): [any, Dispatcher] {
    const [state, dispatch] = useReducer(submitReducer, initialState);
    const dispatches = {
        fetching: () => dispatch({ type: ACTIONS.FETCHING }),
        success: (response) => dispatch({ type: ACTIONS.SUCCESS, response }),
        error: (response) => dispatch({ type: ACTIONS.ERROR, response }),
        clear: () => dispatch({ type: ACTIONS.CLEAR }),
    };
    return [state, dispatches]
}

export function useAsyncRequest(params) {
    const [state, dispatches] = useAsyncRequest_Control();
    const makeRequest = useCallback(async () => {
        dispatches.fetching();
        try {
            const response = await axios({ ...params });
            dispatches.success(response);
        } catch (e) {
            dispatches.error(e);
        }
    }, [params]);
    return [state, makeRequest];
}

// Returns a callback function that wraps the passed setter in a debouncer mechanism
// While the timer is off, the setter will be called immediately and trigger a new timer.
// While the timer is on, the value to be set is captured and used at the end of the timer period.
// Subsequent calls during the timer period will replace the captured value to be set, there is no queue.
export function useDebouncedSetter(setter: (value: any) => void, timeout = 1000) {
    const timerActive = useRef(false);
    const valueCapture = useRef(null);
    const setterCapture = useRef(setter);  // Capture the setter value to detect if a new one is passed
    return useCallback(async (value: any) => {
        if (timerActive.current === true) {
            valueCapture.current = value;
        } else {
            setter(value);
            valueCapture.current = value;
            timerActive.current = true;
            setterCapture.current = setter;
            setTimeout(() => {
                timerActive.current = false;
                // If the last captured value is the same as the value when the timeout was started, do nothing
                // If the last captured setter is different from the current setter, do nothing
                // This later case means a new setter was passed invalidating the old one.
                if (valueCapture.current !== value && setterCapture.current === setter) {
                    setter(valueCapture.current);
                }
            }, timeout);
        }
        return () => {
            // Cleanup, set the flag to false, get rid of the last value.
            timerActive.current = false;
            valueCapture.current = null;
        }
    }, [setter, timeout]);
}
