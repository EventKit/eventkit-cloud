import {applyMiddleware, createStore, combineReducers, compose} from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger';
import rootReducer from '../reducers/rootReducer';

const logger = createLogger();

export default function configureStore() {
    return createStore(
        rootReducer,
        applyMiddleware(thunkMiddleware, logger)
   );
}
