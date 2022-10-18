import {useCallback, useEffect, useRef, useState} from "react";

export const useWindowSize = () => {
    // Initialize state with undefined width/height so server and client renders match
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined
    });

    // Handler to call on window resize
    const handleResize = () => {
        // Set window width/height to state
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
    };

    useEffect(() => {
        // only execute all the code below in client side
        if (typeof window !== "undefined") {
            // Add event listener
            window.addEventListener("resize", handleResize);

            // Call handler right away so state gets updated with initial window size
            handleResize();

            // Remove event listener on cleanup
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []); // Empty array ensures that effect is only run on mount
    return windowSize;
};

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
export function usePrevious(stateValue) {
    const ref = useRef();
    useEffect(() => {
        ref.current = stateValue;
    });
    return ref.current;
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

export function useDebouncedState<T=any>(initialValue: T, timeout = 1000) : [T, ((args: T) => void)] {
    const [valueState, setValueState] = useState<T>(initialValue);
    return [valueState, useDebouncedSetter(setValueState, timeout)];
}

export class DepsHashers {

    private static readonly emptyEstimate = DepsHashers.stringHash('-1:-1');

    static stringHash(value: string | number): number {
        let h;
        if (!!value || value === 0) {
            const valueToString = value.toString();
            for (let i = 0; i < valueToString.length; i += 1) {
                // eslint-disable-next-line no-bitwise
                h = Math.imul(31, h) + valueToString.charCodeAt(i) | 0;
            }
            return h;
        }
        return undefined; // Explicit returns are preferred when a function is not void
    }

    static arrayHash(arrayIn: any[], hasher?: (val: any) => number | string): number {
        if (!hasher) {
            hasher = DepsHashers.stringHash;
        }
        let hash = '';
        arrayIn.forEach((val) => hash += hasher(val));
        return DepsHashers.stringHash(hash);
    }

    static providerIdentityHash(provider: Eventkit.Provider): number {
        return DepsHashers.stringHash(provider.slug + provider.name);
    }

    static providerEstimate(estimates: Eventkit.Store.Estimates): number {
        const {size = undefined, time = undefined} = estimates || {};
        if (!size && !time) {
            return DepsHashers.emptyEstimate;
        }
        return DepsHashers.stringHash(`${size.value}:${time.value}`);
    }

    static uidHash(objectsWithUid: Partial<{ uid: string }>[]) {
        return objectsWithUid ? DepsHashers.arrayHash(objectsWithUid.map(_object => _object?.uid)) : undefined;
    }
}

export function useProviderIdentity(effect: () => void, providers: Eventkit.Provider[], extraDeps = []) {
    useEffect(effect, [
        DepsHashers.arrayHash(providers.map(provider => DepsHashers.providerIdentityHash(provider))),
        ...extraDeps,
    ]);
}

export function useProvidersLoading(providers: Eventkit.Provider[]): [boolean, ((provider: Eventkit.Provider, isLoading: boolean) => void)] {
    const slugMap = useRef({});
    const [areProvidersLoading, setAreProvidersLoading] = useState(false);
    const [flag, setFlag] = useState(false);
    useProviderIdentity(() => {
        providers.map(provider => slugMap.current[provider.slug] = slugMap.current[provider.slug] || false);
    }, providers);
    useEffect(() => {
        setAreProvidersLoading(Object.values(slugMap.current).some(value => value));
    }, [flag]);

    function setProviderLoading(provider: Eventkit.Provider, isLoading: boolean) {
        slugMap.current[provider.slug] = isLoading;
        setFlag(flag => !flag);
    }

    return [areProvidersLoading, setProviderLoading];
}

// This is a wrapper around useRef that returns a getter and setter to avoid
// having to use ref.current and all associated mistakes.
// Adds the overhead of a function to save on confusion when mutable state is needed.
// TODO: Modify setter to accept a callback akin to useState
export function useAccessibleRef<T>(initialValue): [() => T, (value: T) => void] {
    const stateRef = useRef(initialValue);
    // This is used to force an update when the ref changes.
    // Flips an int back and forth from 0 to 1. Value unused.
    const updater = useState(0);
    const forceUpdate = () => updater[1](v => v ^ 1);
    return [
        () => stateRef.current,
        (value: T) => {
            stateRef.current = value;
            forceUpdate();
        }
    ]
}

export function useBoolean(initialValue: boolean):
    [boolean, (...args: any) => void, (...args: any) => void, any] {
    const [bool, setBool] = useState(initialValue);
    return [bool, (...args: any) => setBool(true), (...args: any) => setBool(false), setBool]
}
