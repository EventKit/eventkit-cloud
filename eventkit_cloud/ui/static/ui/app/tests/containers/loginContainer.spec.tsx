import * as React from "react";
import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect"
import * as TestUtils from '../test-utils';
import Form from "../../containers/loginContainer";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

describe( 'loginContainer', () => {

    let mockAxios;
    beforeAll(() => {
        mockAxios = new MockAdapter(axios);
    });
    beforeEach(() => {
        mockAxios.onGet('/auth').reply(200);
        mockAxios.onPost('/auth').reply(200, { token: 'test' });
    });
    afterEach(() => {
        mockAxios.reset();
    });

    it('shows the login form if auth endpoint is available', async () => {
       TestUtils.renderComponent(<Form />);
       expect(await screen.findByText('Enter Login Information'));
    });

    it( 'shows the oauth button if oauth endpoint is available', async () => {
        mockAxios.reset();
        mockAxios.onGet('/oauth').reply(200, { name: 'OAuth' });

        TestUtils.renderComponent(<Form />);
        expect(await screen.findByText('Login with OAuth'));
    });

    it( 'shows both login form and oauth login when both are available', async () => {
        mockAxios.onGet('/oauth').reply(200, { name: 'OAuth' });

        TestUtils.renderComponent(<Form />);
        expect(await screen.findByText('Login'));
        expect(await screen.findByText('Or, login with OAuth'));
    });

    it( 'displays correct message to user when no login methods available', async () => {
       mockAxios.reset();

       TestUtils.renderComponent(<Form />);
       expect(await screen.findByText('No login methods available, please contact an administrator'));
    });
});
