import { configureStore } from '@reduxjs/toolkit'
import { reduxBatch } from '@manaflair/redux-batch';
import { createLogger } from 'redux-logger';
import { routerMiddleware } from 'connected-react-router';
import rootReducer from '../reducers/rootReducer';
import { simpleApiCall, crashReporter } from './middlewares';
import history from '../utils/history';

const routingMiddleware = routerMiddleware(history);

let middleware = [simpleApiCall, crashReporter, routingMiddleware];


if (process.env.NODE_ENV !== 'production') {
    const logger = createLogger();
    middleware = [...middleware, logger];
}

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => {
        //TODO: Once action cancellation is updated to work with redux-toolkit add back in serializableCheck
        let newMiddleware = getDefaultMiddleware({ serializableCheck: false }).prepend(middleware);
        if (process.env.NODE_ENV !== 'production') {
            const logger = createLogger();
            newMiddleware.concat(logger);
        }
        return newMiddleware;
    },
    enhancers: (defaultEnhancers) => [reduxBatch, ...defaultEnhancers, reduxBatch]
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
