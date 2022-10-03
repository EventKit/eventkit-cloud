import * as React from "react";
import ekTheme from '../../styles/eventkit_theme';
import {createMuiTheme, MuiThemeProvider} from "@material-ui/core/styles";
import { render } from "@testing-library/react";
import { AppConfigProvider, ApplicationContext } from "../../components/ApplicationContext";
import { Provider } from "react-redux";
import createTestStore from "./createTestStore";
import { getDefaultTestState } from "./defaultTestState";
import { ToastContainer } from "react-toastify";

const theme = createMuiTheme(ekTheme);

export const renderComponent = (component: any, {
    initialState = getDefaultTestState(),
    store = createTestStore(initialState),
    appContextConfig = {} as ApplicationContext,
} = {}) => {
    return {
        ...render(
            <Provider store={store}>
                <AppConfigProvider value={appContextConfig}>
                    <MuiThemeProvider theme={theme}>
                        {component}
                        <ToastContainer />
                    </MuiThemeProvider>
                </AppConfigProvider>
            </Provider>
        )
    };
};
