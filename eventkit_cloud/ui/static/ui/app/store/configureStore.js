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

const checkAuth = store => next => (action) => {
    const { user } = store.getState();
    if (!user.data) {
        console.log('not logged in for this action');
    }

    const result = next(action);

    if (!user.data) {
        if (action.cancelSource) {
            console.log('cancellable action, return nothing');
            return {};
        }
    }

    // let promise = false;
    // if (Promise.resolve(result) === result) {
    //     promise = true;
    // }

    return result;
};

let middleware = [thunkMiddleware, crashReporter, routingMiddleware];

if (process.env.NODE_ENV !== 'production') {
    const logger = createLogger();
    middleware = [...middleware, checkAuth, logger];
}

export default () => (
    createStore(
        rootReducer,
        compose(reduxBatch, applyMiddleware(...middleware), reduxBatch),
    )
);
