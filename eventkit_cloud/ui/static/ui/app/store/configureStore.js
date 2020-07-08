import { applyMiddleware, createStore, compose } from 'redux';
import { reduxBatch } from '@manaflair/redux-batch';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { routerMiddleware } from 'connected-react-router';
import rootReducer from '../reducers/rootReducer';
import { simpleApiCall, crashReporter } from './middlewares';
import history from '../utils/history';

const routingMiddleware = routerMiddleware(history);

let middleware = [simpleApiCall, thunkMiddleware, crashReporter, routingMiddleware];

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
