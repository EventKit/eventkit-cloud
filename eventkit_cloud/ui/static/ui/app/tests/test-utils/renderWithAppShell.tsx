import * as React from "react";
import ekTheme from '../../styles/eventkit_theme';
import {MuiThemeProvider, createTheme} from "@material-ui/core/styles";
import { render } from "@testing-library/react";
import { AppConfigProvider, ApplicationContext } from "../../components/ApplicationContext";
import { Provider } from "react-redux";
import createTestStore from "./createTestStore";
import { getDefaultTestState } from "./defaultTestState";
import { ToastContainer } from "react-toastify";
import { MemoryRouter } from "react-router";

const theme = createTheme(ekTheme);

export const renderComponent = (component: any, {
    initialState = getDefaultTestState(),
    store = createTestStore(initialState),
    appContextConfig = {} as ApplicationContext,
    includeToastContainer = true,
} = {}) => {
    return {
        ...render(
            <Provider store={store}>
                <AppConfigProvider value={appContextConfig}>
                    <MemoryRouter>
                    <MuiThemeProvider theme={theme}>
                        {component}
                        {includeToastContainer && <ToastContainer />}
                    </MuiThemeProvider>
                    </MemoryRouter>
                </AppConfigProvider>
            </Provider>
        )
    };
};
