import '@babel/polyfill';
import React from 'react';
import 'raf/polyfill';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Loadable from 'react-loadable';
import { connectedReduxRedirect } from 'redux-auth-wrapper/history4/redirect';
import { Route, Redirect, RouteComponentProps } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { ConnectedRouter, routerActions } from 'connected-react-router';
import history from './utils/history';
import configureStore from './store/configureStore';
import { login } from './actions/userActions';
import ekTheme from './styles/eventkit_theme';
import PageLoading from './components/common/PageLoading';

const theme = createMuiTheme(ekTheme);

const Loading = (args) => {
    if (args.pastDelay) {
        return (
            <PageLoading background="pattern" />
        );
    }

    return null;
};

const store = configureStore();

interface State {
    user: Eventkit.Store.User;
}

function allTrue(acceptedLicenses) {
    return Object.keys(acceptedLicenses).every(license => acceptedLicenses[license]);
}

const loadableDefaults = {
    loading: Loading,
    delay: 1000,
};

const Loader = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/common/PageLoading'),
});

const UserIsAuthenticated = connectedReduxRedirect({
    authenticatedSelector: (state: State) => !!state.user.data,
    authenticatingSelector: (state: State) => state.user.status.isLoading,
    AuthenticatingComponent: Loader,
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsAuthenticated',
    redirectPath: '/login',
});

const UserIsNotAuthenticated = connectedReduxRedirect({
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsNotAuthenticated',
    authenticatedSelector: (state: State) => !state.user.data && state.user.status.isLoading === false,
    redirectPath: (state, ownProps: RouteComponentProps<{}, {}>) => (
        ownProps.location.query || '/dashboard'
    ),
    allowRedirectBack: false,
});

const UserHasAgreed = connectedReduxRedirect({
    redirectAction: routerActions.replace,
    redirectPath: '/account',
    wrapperDisplayName: 'UserHasAgreed',
    authenticatedSelector: (state: State) => allTrue(state.user.data.accepted_licenses),
});

function checkAuth(storeObj) {
    return () => {
        const { user } = storeObj.getState();
        if (!user.data) {
            storeObj.dispatch(login(null));
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
        <MuiThemeProvider theme={theme}>
            <BrowserRouter history={history}>
                <ConnectedRouter history={history}>
                    <div>
                        <Redirect from="/" to="/dashboard" />
                        <Route path="/" component={Application} onEnter={checkAuth(store)} />
                        <Route path="/login" component={UserIsNotAuthenticated(LoginPage)} />
                        <Route path="/logout" component={Logout} />
                        <Route path="/dashboard" component={UserIsAuthenticated(UserHasAgreed(DashboardPage))} />
                        <Route path="/exports" component={UserIsAuthenticated(UserHasAgreed(DataPackPage))} />
                        <Route path="/create" component={UserIsAuthenticated(UserHasAgreed(CreateExport))} />
                        <Route
                            path="/status/:jobuid"
                            component={UserIsAuthenticated(UserHasAgreed(StatusDownload))}
                        />
                        <Route path="/about" component={UserIsAuthenticated(About)} />
                        <Route path="/account" component={UserIsAuthenticated(Account)} />
                        <Route path="/groups" component={UserIsAuthenticated(UserGroupsPage)} />
                        <Route path="/notifications" component={UserIsAuthenticated(NotificationsPage)} />
                    </div>
                </ConnectedRouter>
            </BrowserRouter>
        </MuiThemeProvider>
    </Provider>,
    document.getElementById('root'),
);
