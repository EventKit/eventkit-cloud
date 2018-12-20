import * as React from 'react';
import { shallow } from 'enzyme';
import { UserInfo } from '../../components/AccountPage/UserInfo';
import UserInfoTableRow from '../../components/AccountPage/UserInfoTableRow';

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
        const wrapper = shallow(<UserInfo {...props} />);
        expect(wrapper.find('h4')).toHaveLength(1);
        expect(wrapper.find('h4').text()).toEqual('Personal Information');
        expect(wrapper.find('div').at(1).text()).toEqual('To update your personal details, please visit here');
        expect(wrapper.find('a')).toHaveLength(1);
        expect(wrapper.find('a').props().href).toEqual(props.updateLink);
        expect(wrapper.find('table')).toHaveLength(1);
        expect(wrapper.find('tbody')).toHaveLength(1);
        expect(wrapper.find(UserInfoTableRow)).toHaveLength(6);
    });

    it('should not display the update link', () => {
        const props = getProps();
        props.updateLink = '';
        const wrapper = shallow(<UserInfo {...props} />);
        expect(wrapper.find('.qa-UserInfo-personalDetails')).toHaveLength(0);
        expect(wrapper.find('a')).toHaveLength(0);
    });
});
