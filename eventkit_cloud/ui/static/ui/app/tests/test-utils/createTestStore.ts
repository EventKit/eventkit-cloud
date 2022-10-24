import {simpleApiCall} from "../../store/middlewares";
import rootReducer from '../../reducers/rootReducer';
import {reduxBatch} from "@manaflair/redux-batch";
import {configureStore} from "@reduxjs/toolkit";

let middleware = [simpleApiCall];
export const createTestStore = (initialState) => configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => {
        //TODO: Once action cancellation is updated to work with redux-toolkit add back in serializableCheck
        return getDefaultMiddleware({serializableCheck: false, immutableCheck: false}).prepend(middleware);
    },
    enhancers: (defaultEnhancers) => [reduxBatch, ...defaultEnhancers, reduxBatch],
    preloadedState: initialState,
});

export default createTestStore;
