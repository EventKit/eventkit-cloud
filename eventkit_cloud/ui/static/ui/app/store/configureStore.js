import {applyMiddleware, createStore, combineReducers, compose} from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import rootReducer from '../reducers/rootReducer'
import { browserHistory } from 'react-router'
import { routerMiddleware } from 'react-router-redux'

// const logger = createLogger();

const baseHistory = browserHistory
const routingMiddleware = routerMiddleware(baseHistory)


const logger = store => next => action => {
  console.log('dispatching', action)
  let result = next(action)
  console.log('next state', store.getState())
  return result
}

const crashReporter = store => next => action => {
  try {
    return next(action)
  } catch (err) {
    console.error('Caught an exception!', err)
    Raven.captureException(err, {
      extra: {
        action,
        state: store.getState()
      }
    })
    throw err
  }
}

export default () => {
    return createStore(
        rootReducer,
        applyMiddleware(thunkMiddleware, logger, crashReporter, routingMiddleware)
   );
}

