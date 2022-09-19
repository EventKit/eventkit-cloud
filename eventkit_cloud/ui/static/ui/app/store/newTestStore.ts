import {simpleApiCall} from "./middlewares";
import thunk from "redux-thunk";
import {applyMiddleware, compose, createStore} from "redux";
import rootReducer from '../reducers/rootReducer';
import {reduxBatch} from "@manaflair/redux-batch";

let middleware = [simpleApiCall, thunk];
const newTestStore = (initialState) => {
    return createStore(rootReducer, initialState, compose(reduxBatch, applyMiddleware(...middleware), reduxBatch))
}

export default newTestStore;
