import { compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { reduxBatch } from '@manaflair/redux-batch';

// An adaption of:
// https://github.com/reduxjs/redux/blob/master/src/createStore.js
// AND
// https://github.com/dmitry-zaets/redux-mock-store/blob/master/src/index.js
//
// To be used with EventKit tests to create a fake store that records actions
// The redux-mock-store lib was making it difficult to test batch actions so we dont use it anymore

export function createStore(preloadedState, enhancer) {
    if (typeof enhancer !== 'undefined') {
        if (typeof enhancer !== 'function') {
            throw new Error('Expected the enhancer to be a function.');
        }

        return enhancer(createStore)(preloadedState);
    }

    let actions = [];
    let currentReducer = () => ({});
    let currentState = preloadedState;
    let currentListeners = [];
    let nextListeners = currentListeners;
    let isDispatching = false;

    function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
            nextListeners = currentListeners.slice();
        }
    }

    function getState() {
        if (isDispatching) {
            throw new Error(`You may not call store.getState() while the reducer is executing.
                The reducer has already received the state as an argument.
                Pass it down from the top reducer instead of reading it from the store.`);
        }

        return currentState;
    }

    function getActions() {
        return actions;
    }

    function clearActions() {
        actions = [];
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') {
            throw new Error('Expected the listener to be a function.');
        }

        if (isDispatching) {
            throw new Error(`You may not call store.subscribe() while the reducer is executing.
                If you would like to be notified after the store has been updated, subscribe from a
                component and invoke store.getState() in the callback to access the latest state.
                See https://redux.js.org/api-reference/store#subscribe(listener) for more details.`);
        }

        let isSubscribed = true;

        ensureCanMutateNextListeners();
        nextListeners.push(listener);

        return function unsubscribe() {
            if (!isSubscribed) {
                return;
            }

            if (isDispatching) {
                throw new Error(`You may not unsubscribe from a store listener while the reducer is executing.
                    See https://redux.js.org/api-reference/store#subscribe(listener) for more details.`);
            }

            isSubscribed = false;

            ensureCanMutateNextListeners();
            const index = nextListeners.indexOf(listener);
            nextListeners.splice(index, 1);
        };
    }

    function dispatch(action) {
        if (typeof action.type === 'undefined') {
            throw new Error(`Actions may not have an undefined "type" property.
                Have you misspelled a constant?`);
        }

        if (isDispatching) {
            throw new Error('Reducers may not dispatch actions.');
        }

        try {
            isDispatching = true;
            currentState = currentReducer(currentState, action);
        } finally {
            isDispatching = false;
        }

        actions.push(action);

        currentListeners = nextListeners;
        const listeners = currentListeners;
        listeners.forEach((listener) => {
            listener();
        });

        return action;
    }

    function replaceReducer(nextReducer) {
        if (typeof nextReducer !== 'function') {
            throw new Error('Expected the nextReducer to be a function.');
        }

        currentReducer = nextReducer;
    }

    return {
        dispatch,
        subscribe,
        getState,
        replaceReducer,
        getActions,
        clearActions,
    };
}

const createTestStore = (initialState) => (
    createStore(
        initialState,
        compose(reduxBatch, applyMiddleware(thunk), reduxBatch),
    )
);

export default createTestStore;
