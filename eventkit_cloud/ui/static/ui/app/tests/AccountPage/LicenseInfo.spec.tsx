import * as sinon from 'sinon';
import { LicenseInfo, Props, allTrue } from '../../components/AccountPage/LicenseInfo';
import { screen, within } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('LicenseInfo component', () => {
    const getProps = (): Props => (
        {
            ...(global as any).eventkit_test_props,
            user: { data: { accepted_licenses: { test1: false, test2: false } } },
            licenses: {
                licenses: [
                    { slug: 'test1', name: 'testname1', text: 'testtext1' },
                    { slug: 'test2', name: 'testname2', text: 'testtext2' },
                ],
            },
            acceptedLicenses: { test1: false, test2: false },
            onLicenseCheck: sinon.spy(),
            onAllCheck: sinon.spy(),
        }
    );

    it('should render a title, subtitle, all checkboxes, two UserLicenses, and the agreement warning', () => {
        const props = { ...getProps() };
        TestUtils.renderComponent(<LicenseInfo {...props}/>)
        expect(screen.getByText('Licenses and Terms of Use'));
        expect(screen.getByText('Usage of this product and all assets requires agreement to the following legalities:'));
        expect(screen.getByText('ALL'));

        const test1Checkbox = within(screen.getByTestId('testname1-checkbox')).getByRole('checkbox');
        const test2Checkbox = within(screen.getByTestId('testname2-checkbox')).getByRole('checkbox');
        expect(test2Checkbox).not.toBeChecked();
        expect(test1Checkbox).not.toBeChecked();
    });

    it('one of the UserLicenses should be checked and disabled', () => {
        const nextProps = { ...getProps() };
        nextProps.user.data.accepted_licenses.test1 = true;
        nextProps.acceptedLicenses.test1 = true;
        TestUtils.renderComponent(<LicenseInfo {...nextProps}/>)

        const test1Checkbox = within(screen.getByTestId('testname1-checkbox')).getByRole('checkbox');
        const test2Checkbox = within(screen.getByTestId('testname2-checkbox')).getByRole('checkbox');
        expect(test2Checkbox).not.toBeChecked();
        expect(test2Checkbox).not.toBeDisabled();
        expect(test1Checkbox).toBeChecked();
        expect(test1Checkbox).toBeDisabled();
    });

    it('one of the UserLicenses should be checked but not disabled', () => {
        const nextProps = { ...getProps() };
        nextProps.acceptedLicenses.test1 = true;
        TestUtils.renderComponent(<LicenseInfo {...nextProps}/>)

        const test1Checkbox = within(screen.getByTestId('testname1-checkbox')).getByRole('checkbox');
        const test2Checkbox = within(screen.getByTestId('testname2-checkbox')).getByRole('checkbox');
        expect(test2Checkbox).not.toBeChecked();
        expect(test2Checkbox).not.toBeDisabled();
        expect(test1Checkbox).toBeChecked();
        expect(test1Checkbox).not.toBeDisabled();
    });

    it('should have all checkboxes checked but not disabled', () => {
        const nextProps = { ...getProps() };
        nextProps.acceptedLicenses.test1 = true;
        nextProps.acceptedLicenses.test2 = true;
        TestUtils.renderComponent(<LicenseInfo {...nextProps}/>)

        const test1Checkbox = within(screen.getByTestId('testname1-checkbox')).getByRole('checkbox');
        const test2Checkbox = within(screen.getByTestId('testname2-checkbox')).getByRole('checkbox');
        expect(test2Checkbox).toBeChecked();
        expect(test2Checkbox).not.toBeDisabled();
        expect(test1Checkbox).toBeChecked();
        expect(test1Checkbox).not.toBeDisabled();
    });

    it('should have all checkboxes checked and disabled and not show the usage warning', () => {
        const nextProps = { ...getProps() };
        nextProps.acceptedLicenses.test1 = true;
        nextProps.acceptedLicenses.test2 = true;
        nextProps.user.data.accepted_licenses.test1 = true;
        nextProps.user.data.accepted_licenses.test2 = true;
        TestUtils.renderComponent(<LicenseInfo {...nextProps}/>)

        const test1Checkbox = within(screen.getByTestId('testname1-checkbox')).getByRole('checkbox');
        const test2Checkbox = within(screen.getByTestId('testname2-checkbox')).getByRole('checkbox');
        expect(test2Checkbox).toBeChecked();
        expect(test2Checkbox).toBeDisabled();
        expect(test1Checkbox).toBeChecked();
        expect(test1Checkbox).toBeDisabled();
        expect(screen.queryByText('You must agree to all license agreements and/or terms of use!')).toBeNull();
    });

    it('allTrue should return false', () => {
        const nextProps = { ...getProps() };
        nextProps.acceptedLicenses.test1 = true;
        nextProps.acceptedLicenses.tes2 = false;
        expect(allTrue(nextProps.acceptedLicenses)).toBe(false);
    });

    it('allTrue should return true', () => {
        const nextProps = { ...getProps() };
        nextProps.acceptedLicenses.test1 = true;
        nextProps.acceptedLicenses.test2 = true;
        expect(allTrue(nextProps.acceptedLicenses)).toBe(true);
    });
});
