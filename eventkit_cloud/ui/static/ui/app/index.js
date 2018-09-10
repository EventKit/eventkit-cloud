import '@babel/polyfill';
import React from 'react';
import 'raf/polyfill';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import Loadable from 'react-loadable';
import { connectedReduxRedirect } from 'redux-auth-wrapper/history3/redirect';
import { browserHistory, Router, Route, Redirect } from 'react-router';
import { syncHistoryWithStore, routerActions } from 'react-router-redux';
import configureStore from './store/configureStore';
import { login } from './actions/userActions';

const Loading = (args) => {
    if (args.pastDelay) {
        return (
            <div
                style={{
                    color: 'white',
                    height: '100vh',
                    background: 'rgb(17, 24, 35)',
                }}
            >
                Loading. . .
            </div>
        );
    }

    return null;
};

const store = configureStore();
const history = syncHistoryWithStore(browserHistory, store);

function allTrue(acceptedLicenses) {
    return Object.keys(acceptedLicenses).every(license => acceptedLicenses[license]);
}

const loadableDefaults = {
    loading: Loading,
    delay: 1000,
};

const Loader = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/auth/Loading'),
});

const UserIsAuthenticated = connectedReduxRedirect({
    authenticatedSelector: state => !!state.user.data,
    authenticatingSelector: state => state.user.isLoading,
    AuthenticatingComponent: Loader,
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsAuthenticated',
    redirectPath: '/login',
});

const UserIsNotAuthenticated = connectedReduxRedirect({
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsNotAuthenticated',
    authenticatedSelector: state => !state.user.data && state.user.isLoading === false,
    redirectPath: (state, ownProps) => (ownProps.location.query.redirect || ownProps.location.query.next) || '/dashboard',
    allowRedirectBack: false,
});

const UserHasAgreed = connectedReduxRedirect({
    redirectAction: routerActions.replace,
    redirectPath: '/account',
    wrapperDisplayName: 'UserHasAgreed',
    authenticatedSelector: state => allTrue(state.user.data.accepted_licenses),
});

function checkAuth(storeObj) {
    return (nextState) => {
        const { user } = storeObj.getState();
        if (!user.data) {
            storeObj.dispatch(login(null, (nextState.location ? nextState.location.query : '')));
        }
    };
}

const Application = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/Application'),
});

const LoginPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/auth/LoginPage'),
});

const Logout = Loadable({
    ...loadableDefaults,
    loader: () => import('./containers/logoutContainer'),
});

const About = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/About/About'),
});

const Account = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/AccountPage/Account'),
});

const DashboardPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/DashboardPage/DashboardPage'),
});

const DataPackPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/DataPackPage/DataPackPage'),
});

const CreateExport = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/CreateDataPack/CreateExport'),
});

const StatusDownload = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/StatusDownloadPage/StatusDownload'),
});

const UserGroupsPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/UserGroupsPage/UserGroupsPage'),
});

const NotificationsPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/NotificationsPage/NotificationsPage'),
});

render(
    <Provider store={store}>
        <Router history={history}>
            <Redirect from="/" to="/dashboard" />
            <Route path="/" component={Application} onEnter={checkAuth(store)}>
                <Route path="/login" component={UserIsNotAuthenticated(LoginPage)} />
                <Route path="/logout" component={Logout} />
                <Route path="/dashboard" component={UserIsAuthenticated(UserHasAgreed(DashboardPage))} />
                <Route path="/exports" component={UserIsAuthenticated(UserHasAgreed(DataPackPage))} />
                <Route path="/create" component={UserIsAuthenticated(UserHasAgreed(CreateExport))} />
                <Route path="/status/:jobuid" component={UserIsAuthenticated(UserHasAgreed(StatusDownload))} />
                <Route path="/about" component={UserIsAuthenticated(About)} />
                <Route path="/account" component={UserIsAuthenticated(Account)} />
                <Route path="/groups" component={UserIsAuthenticated(UserGroupsPage)} />
                <Route path="/notifications" component={UserIsAuthenticated(NotificationsPage)} />
            </Route>
        </Router>
    </Provider>,
    document.getElementById('root'),
);
