import React from 'react';
import { mount } from 'enzyme';
import UserInfo from '../../components/AccountPage/UserInfo';
import UserInfoTableRow from '../../components/AccountPage/UserInfoTableRow';

describe('UserInfo component', () => {
    const getProps = () => ({
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
        const wrapper = mount(<UserInfo {...props} />);
        expect(wrapper.find('h4')).toHaveLength(1);
        expect(wrapper.find('h4').text()).toEqual('Personal Information');
        expect(wrapper.find('div').at(1).text()).toEqual('To update your personal details, please visit here');
        expect(wrapper.find('a')).toHaveLength(1);
        expect(wrapper.find('a').props().href).toEqual(props.updateLink);
        expect(wrapper.find('table')).toHaveLength(1);
        expect(wrapper.find('tbody')).toHaveLength(1);
        expect(wrapper.find(UserInfoTableRow)).toHaveLength(6);
        const trs = wrapper.find(UserInfoTableRow);
        expect(trs.at(0).props().title).toEqual('Username');
        expect(trs.at(0).props().data).toEqual(props.user.username);
        expect(trs.at(1).props().title).toEqual('First name');
        expect(trs.at(1).props().data).toEqual(props.user.first_name);
        expect(trs.at(2).props().title).toEqual('Last name');
        expect(trs.at(2).props().data).toEqual(props.user.last_name);
        expect(trs.at(3).props().title).toEqual('Email');
        expect(trs.at(3).props().data).toEqual(props.user.email);
        expect(trs.at(4).props().title).toEqual('Date Joined');
        expect(trs.at(4).props().data).toEqual('5/10/17');
        expect(trs.at(5).props().title).toEqual('Last Login');
        expect(trs.at(5).props().data).toEqual('5/10/17 11:28am');
    });

    it('should not display the update link', () => {
        const props = getProps();
        props.updateLink = '';
        const wrapper = mount(<UserInfo {...props} />);
        expect(wrapper.find('div').at(1).exists()).toBe(false);
        expect(wrapper.find('a')).toHaveLength(0);
    });
});
