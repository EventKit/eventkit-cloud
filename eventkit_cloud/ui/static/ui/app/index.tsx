import axios from 'axios';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Loadable from 'react-loadable';
import { Route } from 'react-router';
import { ConnectedRouter } from 'connected-react-router';
import history from './utils/history';
import { store } from './store/configureStore';
import ekTheme from './styles/eventkit_theme';
import PageLoading from './components/common/PageLoading';

// Add a 401 / 403 response interceptor to redirect the user to login if they are not authenticated to DRF.
axios.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
        window.location.href = '/login';
    } else {
        return Promise.reject(error);
    }
});

const theme = createMuiTheme(ekTheme);

const Loading = (args) => {
    if (args.pastDelay) {
        return (
            <PageLoading background="pattern" />
        );
    }

    return null;
};

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
