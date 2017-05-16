import "babel-polyfill";
import React from 'react';
import { render } from 'react-dom';
import configureStore from './store/configureStore';
import { Provider } from 'react-redux';
import { browserHistory, Router, Route, IndexRoute, Redirect } from 'react-router'
import { syncHistoryWithStore, routerActions, routerMiddleware } from 'react-router-redux'
import Application from './components/Application'
import LoginPage from './components/auth/LoginPage'
import Loading from './components/auth/Loading'
import Logout from './containers/logoutContainer'
import About from './components/About'
import DataPackPage from './components/DataPackPage/DataPackPage'
import Export from './components/Export'
import CreateExport from './components/CreateExport'
import ExportAOI from './components/ExportAOI'
import ExportInfo from './components/ExportInfo'
import ExportSummary from './components/ExportSummary'
import StatusDownload from './components/StatusDownloadPage/StatusDownload'
import { UserAuthWrapper } from 'redux-auth-wrapper'
import { applyMiddleware } from 'redux'
import { login } from './actions/userActions'
import { setCSRF } from './actions/authActions'


const store = configureStore();
const history = syncHistoryWithStore(browserHistory, store);

const UserIsAuthenticated = UserAuthWrapper({
    authSelector: state => state.user.data,
    authenticatingSelector: state => state.user.isLoading,
    LoadingComponent: Loading,
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsAuthenticated'
});

const UserIsNotAuthenticated = UserAuthWrapper({
    authSelector: state => state.user,
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsNotAuthenticated',
    // Want to redirect the user when they are done loading and authenticated
    predicate: user => !user.data && user.isLoading === false,
    failureRedirectPath: (state, ownProps) => (ownProps.location.query.redirect || ownProps.location.query.next) || '/exports',
    allowRedirectBack: false
});

const UserHasAgreed = UserAuthWrapper({
    authSelector: state => state.user.data,
    redirectAction: routerActions.replace,
    failureRedirectPath: '/account',
    wrapperDisplayName: 'UserHasAgreed',
    predicate: userData => allTrue(userData.accepted_licenses)
});

function checkAuth(store) {
  return (nextState, replace) => {
    let { user } = store.getState();
    console.log(user)
    if (!user.data){
        store.dispatch(login())
    }
  }
};

function allTrue(accepted_licenses) {
    for (const l in accepted_licenses) {
        if(accepted_licenses[l]) {continue;}
        else {return false;}
    }
    return true
}

render(
    <Provider store={store}>
        <Router history={history}>
            <Redirect from="/" to="/exports"/>
            <Route path="/" component={Application} onEnter={checkAuth(store)}>
                
                <Route path="/login" component={UserIsNotAuthenticated(LoginPage)}/>
                <Route path="/logout" component={Logout}/>
                <Route path="/exports" component={UserIsAuthenticated(UserHasAgreed(DataPackPage))}>
                    <Route path="/export/:uid" component={UserIsAuthenticated(UserHasAgreed(Export))}/>
                </Route>
                <Route path="/create" component={UserIsAuthenticated(CreateExport)}>
                    <Route path="/exportAOI" component={UserIsAuthenticated(ExportAOI)}/>
                    <Route path="/exportInfo" component={UserIsAuthenticated(ExportInfo)}/>
                    <Route path="/exportSummary" component={UserIsAuthenticated(ExportSummary)}/>
                </Route>
                <Route path="/status/:jobuid" component={UserIsAuthenticated(StatusDownload)}/>
                <Route path="/about" component={About}/>
                <Route path="/account" component={UserIsAuthenticated(Account)}/>
                
            </Route>
        </Router>
    </Provider>,
    document.getElementById('root')
);
