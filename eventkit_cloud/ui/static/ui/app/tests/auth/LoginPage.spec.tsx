import { LoginPage } from '../../components/auth/LoginPage';

import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('LoginPage component', () => {
    const loginConfig = { LOGIN_DISCLAIMER: 'This is a disclaimer', };

    it('should render just the login paper', () => {
        TestUtils.renderComponent(<LoginPage {...(global as any).eventkit_test_props} />);

        expect(screen.getByTestId('loginPaper'));
    });

    it('should render a login paper and disclaimer paper', () => {
        TestUtils.renderComponent(<LoginPage {...(global as any).eventkit_test_props} />,
            {
                appContextConfig: loginConfig
            });

        expect(screen.getByText('ATTENTION'));
        expect(screen.getByText('This is a disclaimer'));
    });
});
