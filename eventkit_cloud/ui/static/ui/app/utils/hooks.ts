import {useEffect, useRef, useState} from "react";

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