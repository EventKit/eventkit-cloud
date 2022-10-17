import { UserInfo } from '../../components/AccountPage/UserInfo';
import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('UserInfo component', () => {
    const getProps = () => ({
        ...(global as any).eventkit_test_props,
        user: {
            username: 'admin',
            first_name: 'first',
            last_name: 'last',
            email: 'admin@admin.com',
            date_joined: '2017-05-10T11:28:03.300240Z',
            last_login: '2017-05-10T11:28:03.300240Z',
        },
        updateLink: 'http://www.google.com',
    });

    it('should display a section title, update link, and table with user data', () => {
        const props = getProps();
        TestUtils.renderComponent(<UserInfo {...props} />)
        expect(screen.getByText('Personal Information'));
        expect(screen.getByText('here')).toHaveAttribute('href', 'http://www.google.com');
    });

    it('should not display the update link', () => {
        const props = getProps();
        props.updateLink = '';
        TestUtils.renderComponent(<UserInfo {...props} />)
        expect(screen.queryByText('here')).toBeNull();
    });
});
