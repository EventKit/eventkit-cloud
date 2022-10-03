import ErrorMessage from "../../components/auth/ErrorMessage";

import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('LoginErrorPage component', () => {

    it('should render the error message component with link', async () => {
        TestUtils.renderComponent(<ErrorMessage {...(global as any).eventkit_test_props} />, {
            appContextConfig: { CONTACT_URL: 'test' }
        });
        expect(await screen.findByTestId('errorMessage'));
        expect(screen.getByTestId('errorLink')).toHaveAttribute('href', 'test');
    });

    it('should render the error message component with simple text', async () => {
        TestUtils.renderComponent(<ErrorMessage {...(global as any).eventkit_test_props} />);
        expect(await screen.findByText('An error occurred during the authentication process. Please try again or contact an administrator.'));
    });

});
