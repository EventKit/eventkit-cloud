import { applyMiddleware, createStore, compose } from 'redux';
import { reduxBatch } from '@manaflair/redux-batch';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import rootReducer from '../reducers/rootReducer';
import { simpleApiCall, crashReporter } from './middlewares';

const baseHistory = browserHistory;
const routingMiddleware = routerMiddleware(baseHistory);

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
