import * as React from 'react';
import { mount } from 'enzyme';
import { UserInfoTableRow } from '../../components/AccountPage/UserInfoTableRow';

describe('UserInfoTableRow component', () => {
    const props = { title: 'test title', data: 'test data', ...(global as any).eventkit_test_props };
    it('should render a table row with title and data cells', () => {
        const wrapper = mount(<UserInfoTableRow {...props} />);
        expect(wrapper.find('tr')).toHaveLength(1);
        expect(wrapper.find('td')).toHaveLength(2);
        expect(wrapper.find('td').first().text()).toEqual('test title');
        expect(wrapper.find('td').last().text()).toEqual('test data');
    });

    it('should return null if no title or data are passed in', () => {
        const wrapper = mount(<UserInfoTableRow {...props} data={null} />);
        expect(wrapper.find('tr')).toHaveLength(0);
        expect(wrapper.find('td')).toHaveLength(0);
        expect(wrapper.children().exists()).toBe(false);
    });

    it('should update text when props change', () => {
        const wrapper = mount(<UserInfoTableRow {...props} />);
        const newProps = { ...props, title: 'new title', data: 'new data' };
        wrapper.setProps(newProps);
        expect(wrapper.find('td').first().text()).toEqual('new title');
        expect(wrapper.find('td').last().text()).toEqual('new data');
    });
});
