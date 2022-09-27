
import ErrorMessage from "../../components/auth/ErrorMessage";
import {render, screen} from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect"
import {AppConfigProvider} from "../../components/ApplicationContext";
import {createMuiTheme, MuiThemeProvider} from "@material-ui/core/styles";
import * as React from "react";
import ekTheme from '../../styles/eventkit_theme';
const theme = createMuiTheme(ekTheme);

describe('LoginErrorPage component', () => {

    const renderComponent = (configContext) => {
        return {
            ...render(
                <AppConfigProvider value={configContext}>
                    <MuiThemeProvider theme={theme}>
                        <ErrorMessage {...(global as any).eventkit_test_props}/>
                    </MuiThemeProvider>
                </AppConfigProvider>)
        }
    }

    it('should render the error message component with link', async () => {
        renderComponent({CONTACT_URL: 'test'});
        expect(await screen.findByTestId('errorMessage'));
        expect(screen.getByTestId('errorLink')).toHaveAttribute('href', 'test');
    });

    it('should render the error message component with simple text', async () => {
        renderComponent({});
        expect(await screen.findByText('An error occurred during the authentication process. Please try again or contact an administrator.'));
    });

});
