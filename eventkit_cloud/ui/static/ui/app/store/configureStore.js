import {applyMiddleware, createStore, combineReducers, compose} from 'redux'
import thunkMiddleware from 'redux-thunk'
import rootReducer from '../reducers/rootReducer';
//import ReduxThunk from 'redux-thunk'

export default function configureStore() {
    return createStore(
        rootReducer,
        applyMiddleware(thunkMiddleware)
   );
}
