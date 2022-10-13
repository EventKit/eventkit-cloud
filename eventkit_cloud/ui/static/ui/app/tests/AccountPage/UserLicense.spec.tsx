import * as sinon from 'sinon';
import UserLicense from '../../components/AccountPage/UserLicense';
import { screen, fireEvent, within } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('User License component', () => {
    const getProps = () => ({
        ...(global as any).eventkit_test_props,
        license: { slug: 'test-license', name: 'license name', text: 'license text' },
        checked: false,
        onCheck: sinon.spy(),
        disabled: false,
    });

    it('should render a card with the license information', () => {
        const props = getProps();
        TestUtils.renderComponent(<UserLicense {...props} />);
        expect(screen.getByText('license name'));
    });

    it('should expand the card on click', () => {
        const props = getProps();
        TestUtils.renderComponent(<UserLicense {...props} />);
        const expandButton = screen.getByRole('button');
        fireEvent.click(expandButton);
        expect(screen.getByText('- Download this license text -')).toHaveAttribute('href', '/api/licenses/test-license/download');
    });

    it('should call onCheck function when checkbox is checked', () => {
        const props = getProps();
        props.onCheck = sinon.spy();
        TestUtils.renderComponent(<UserLicense {...props} />);
        expect(props.onCheck.notCalled).toBe(true);
        const checkbox = within(screen.getByTestId('license name-checkbox')).getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(props.onCheck.calledOnce).toBe(true);
    });

    it('should make checkbox disabled', () => {
        const props = getProps();
        props.disabled = true;
        TestUtils.renderComponent(<UserLicense {...props} />);
        const checkbox = within(screen.getByTestId('license name-checkbox')).getByRole('checkbox');
        expect(checkbox).toBeDisabled();
    });
});
