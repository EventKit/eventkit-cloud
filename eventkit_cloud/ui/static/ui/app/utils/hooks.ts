import {useEffect, useRef} from "react";

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