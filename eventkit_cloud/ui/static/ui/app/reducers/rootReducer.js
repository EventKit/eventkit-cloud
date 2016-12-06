
import {combineReducers} from 'redux';
import jobs from './exportsReducer';

const rootReducer = combineReducers({
    // short hand property names
    jobs
})

export default rootReducer;