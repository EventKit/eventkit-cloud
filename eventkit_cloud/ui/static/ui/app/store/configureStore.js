import { applyMiddleware, createStore, compose } from 'redux';
import { reduxBatch } from '@manaflair/redux-batch';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from '../reducers/rootReducer';

const baseHistory = browserHistory;
const routingMiddleware = routerMiddleware(baseHistory);

const crashReporter = () => next => (action) => {
    try {
        return next(action);
    } catch (err) {
        console.error('Caught an exception!', err);
        throw err;
    }
};

// do not let actions update state if auth is required and user not signed-in
const checkAuth = store => next => (action) => {
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

let middleware = [checkAuth, thunkMiddleware, crashReporter, routingMiddleware];

if (process.env.NODE_ENV !== 'production') {
    const logger = createLogger();
    middleware = [...middleware, logger];
}

export default () => (
    createStore(
        rootReducer,
        compose(reduxBatch, applyMiddleware(...middleware), reduxBatch),
    )
);
