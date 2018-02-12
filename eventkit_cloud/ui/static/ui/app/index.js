import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { UserAuthWrapper } from 'redux-auth-wrapper';
import { browserHistory, Router, Route, Redirect } from 'react-router';
import { syncHistoryWithStore, routerActions } from 'react-router-redux';
import configureStore from './store/configureStore';
import Application from './components/Application';
import LoginPage from './components/auth/LoginPage';
import Loading from './components/auth/Loading';
import Logout from './containers/logoutContainer';
import About from './components/About/About';
import Account from './components/AccountPage/Account';
import DataPackPage from './components/DataPackPage/DataPackPage';
import CreateExport from './components/CreateDataPack/CreateExport';
import StatusDownload from './components/StatusDownloadPage/StatusDownload';
import { isBrowserValid } from './utils/generic';
import { login, userActive } from './actions/userActions';


const store = configureStore();
const history = syncHistoryWithStore(browserHistory, store);
injectTapEventPlugin();

function allTrue(acceptedLicenses) {
    for (const l in acceptedLicenses) {
        if (acceptedLicenses[l]) {continue;}
        else {return false;}
    }
    return true;
}

const UserIsAuthenticated = UserAuthWrapper({
    authSelector: state => state.user.data,
    authenticatingSelector: state => state.user.isLoading,
    LoadingComponent: Loading,
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsAuthenticated',
});

const UserIsNotAuthenticated = UserAuthWrapper({
    authSelector: state => state.user,
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsNotAuthenticated',
    // Want to redirect the user when they are done loading and authenticated
    predicate: user => !user.data && user.isLoading === false,
    failureRedirectPath: (state, ownProps) => (ownProps.location.query.redirect || ownProps.location.query.next) || '/exports',
    allowRedirectBack: false,
});

const UserHasAgreed = UserAuthWrapper({
    authSelector: state => state.user.data,
    redirectAction: routerActions.replace,
    failureRedirectPath: '/account',
    wrapperDisplayName: 'UserHasAgreed',
    predicate: userData => allTrue(userData.accepted_licenses),
});

function checkAuth(store) {
    if (isBrowserValid()) {
        return (nextState, replace) => {
            const { user } = store.getState();
            if (!user.data) {
                store.dispatch(login(null, (nextState.location ? nextState.location.query : '')));
            }
        };
    }
    return null;
}

render(
    <Provider store={store}>
        <Router history={history}>
            <Redirect from="/" to="/exports" />
            <Route path="/" component={Application} onEnter={checkAuth(store)}>
                <Route path="/login" component={UserIsNotAuthenticated(LoginPage)} />
                <Route path="/logout" component={Logout} />
                <Route
                    path="/exports"
                    component={UserIsAuthenticated(UserHasAgreed(DataPackPage))}
                />
                <Route
                    path="/create"
                    component={UserIsAuthenticated(UserHasAgreed(CreateExport))}
                />
                <Route
                    path="/status/:jobuid"
                    component={UserIsAuthenticated(UserHasAgreed(StatusDownload))}
                />
                <Route path="/about" component={UserIsAuthenticated(About)} />
                <Route path="/account" component={UserIsAuthenticated(Account)} />
            </Route>
        </Router>
    </Provider>,
    document.getElementById('root'),
);
