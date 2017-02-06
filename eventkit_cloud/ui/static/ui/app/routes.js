import React from 'react'
import {  browserHistory, Router, Route, IndexRoute } from 'react-router'
import { Provider } from 'react-redux'
import Application from './components/Application'
import LoginPage from './components/login/LoginPage'
import About from './components/About'
import Exports from './components/Exports'
import Export from './components/Export'
import CreateExport from './components/CreateExport'
import ExportAOI from './components/ExportAOI'
import ExportInfo from './components/ExportInfo'
import configureStore from './store/configureStore'

const store = configureStore()
const loginFilter = createLoginFilter(store)

export default (
    <Provider store={store}>
        <Router history={browserHistory}>
            <Route path="/" component={Application}>
                <Route path="/login" component={LoginPage}/>
                <Route path="/exports" component={Exports} onEnter={loginFilter}>
                    <Route path="/export/:uid" component={Export} onEnter={loginFilter}/>
                </Route>
                <Route path="/create" component={CreateExport} onEnter={loginFilter}>
                    <Route path="/exportAOI" component={ExportAOI} onEnter={loginFilter}/>
                    <Route path="/exportInfo" component={ExportInfo} onEnter={loginFilter}/>
                </Route>
                <Route path="/about" component={About} onEnter={loginFilter}/>
            </Route>
        </Router>
    </Provider>
)

function createLoginFilter(store) {
    // return (nextState, replace) => {
    //     if (!store.getState().authentication.token) {
    //         replace({
    //             pathname: '/login',
    //             state: {
    //                 nextPathname: nextState.location.pathname || '/'
    //             }
    //         })
    //     }
    // }
}