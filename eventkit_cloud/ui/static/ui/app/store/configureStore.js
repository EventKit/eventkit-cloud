import {applyMiddleware, createStore, combineReducers, compose} from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import rootReducer from '../reducers/rootReducer'
import { browserHistory } from 'react-router'
import { routerMiddleware } from 'react-router-redux'
import createDebounce from 'redux-debounced';

const bouncer = createDebounce();
const baseHistory = browserHistory;
const routingMiddleware = routerMiddleware(baseHistory);

const crashReporter = store => next => action => {
  try {
    return next(action);
  } catch (err) {
    console.error('Caught an exception!', err);
    throw err;
  }
}

let middleware = [bouncer, thunkMiddleware, crashReporter, routingMiddleware];

if (process.env.NODE_ENV !== 'production') {
  const logger = createLogger();
  middleware = [...middleware, logger];
}

export default () => {
    return createStore(
        rootReducer,
        applyMiddleware(...middleware)
   );
}


