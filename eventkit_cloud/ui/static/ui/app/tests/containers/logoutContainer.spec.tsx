import * as React from "react";
import "@testing-library/jest-dom/extend-expect"
import * as TestUtils from '../test-utils';
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import Logout from "../../containers/logoutContainer";

describe('logoutContainer', () => {

    let mockAxios;
    beforeAll(() => {
        mockAxios = new MockAdapter(axios);
    });
    beforeEach(() => {
        mockAxios.onGet('/logout').reply(200);
    });
    afterEach(() => {
        mockAxios.reset();
    });

    it('should render without issue', () => {
       TestUtils.renderComponent(<Logout/>);
    });
});
