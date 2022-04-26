// @ts-nocheck
import '@babel/polyfill';
import React from 'react';
import 'raf/polyfill';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Loadable from 'react-loadable';
import { Route, Redirect } from 'react-router';
import { ConnectedRouter } from 'connected-react-router';
import history from './utils/history';
import configureStore from './store/configureStore';
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

const loadableDefaults = {
    loading: Loading,
    delay: 1000,
};

const Application = Loadable({
    ...loadableDefaults,
    loader: () => import('./components/Application'),
});

render(
    <Provider store={store}>
        <MuiThemeProvider theme={theme}>
            <ConnectedRouter history={history}>
                <div>
                    <Route path="/" component={Application} />
                </div>
            </ConnectedRouter>
        </MuiThemeProvider>
    </Provider>,
    document.getElementById('root'),
);
