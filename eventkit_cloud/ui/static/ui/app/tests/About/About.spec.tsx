import * as React from "react";
import About from '../../components/About/About';
import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('About component', () => {

    it('should render all the basic elements', async () => {
        TestUtils.renderComponent(<About/>);
        expect(await screen.findByText('About EventKit'));
        expect(await screen.findByText('Overview'));
        expect(await screen.findByText('What is a DataPack?'));
    });

    it('should not show the version tag if no version in context', () => {
        TestUtils.renderComponent(<About/>, {appContextConfig: {VERSION: ''}});
        expect(screen.getByTestId('pageHeader').textContent).toBe('');
    });

    it('should not show the contact link if no contact url in context', () => {
        TestUtils.renderComponent(<About/>);
        expect(screen.queryByTestId('aboutContact')).toBe(null);
    });

    it('should render the version tag', () => {
        TestUtils.renderComponent(<About/>, {appContextConfig: {VERSION: '1.3.0'}});
        expect(screen.getByTestId('pageHeader').textContent).toBe('1.3.0');
    });

    it('should show the contact link',() => {
        TestUtils.renderComponent(<About/>, {appContextConfig: {CONTACT_URL: 'something'}});
        expect(screen.getByText('Contact Us').closest('a')).toHaveAttribute('href', 'something');
    });

});
