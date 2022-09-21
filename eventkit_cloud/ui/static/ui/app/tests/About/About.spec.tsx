import About from '../../components/About/About';
import { render, screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect"
import {AppConfigProvider} from "../../components/ApplicationContext";
import * as React from "react";
import ekTheme from '../../styles/eventkit_theme';
import {createMuiTheme, MuiThemeProvider} from "@material-ui/core/styles";

const theme = createMuiTheme(ekTheme);

describe('About component', () => {
    const renderComponent = (configContext) => {
        return {
            ...render(
                <AppConfigProvider value={configContext}>
                    <MuiThemeProvider theme={theme}>
                        <About/>
                    </MuiThemeProvider>
                </AppConfigProvider>)
        }
    }

    it('should render all the basic elements', async () => {
        renderComponent({});
        expect(await screen.findByText('About EventKit'));
        expect(await screen.findByText('Overview'));
        expect(await screen.findByText('What is a DataPack?'));
    });

    it('should not show the version tag if no version in context', () => {
        renderComponent({VERSION: ''});
        expect(screen.getByTestId('pageHeader').textContent).toBe('');
    });

    it('should not show the contact link if no contact url in context', () => {
        renderComponent({});
        expect(screen.queryByTestId('aboutContact')).toBe(null);
    });

    it('should render the version tag', () => {
        renderComponent({ VERSION: '1.3.0'});
        expect(screen.getByTestId('pageHeader').textContent).toBe('1.3.0');
    });

    it('should show the contact link', async () => {
        renderComponent({ CONTACT_URL: 'something' });
        expect(screen.getByText('Contact Us').closest('a')).toHaveAttribute('href', 'something');
    });

});
