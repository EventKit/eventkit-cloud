import * as React from 'react';
import { shallow } from 'enzyme';
import { GroupMemberRow } from '../../components/DataPackShareDialog/GroupMemberRow';

describe('GroupMemberRow component', () => {
    const getProps = () => ({
        member: {
            username: 'user_one',
            first_name: 'user',
            last_name: 'one',
            email: 'user.one@email.com',
            permission: 'READ',
        },
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => (
        shallow(<GroupMemberRow {...props} />)
    );

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-GroupMemberRow')).toHaveLength(1);
        expect(wrapper.find('.qa-GroupMemberRow-name').text()).toEqual('user one');
        expect(wrapper.find('.qa-GroupMemberRow-email').text()).toEqual('user.one@email.com');
    });

    it('should diplay "(Group Admin)"', () => {
        const props = getProps();
        props.member.permission = 'ADMIN';
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-GroupMemberRow-name').text()).toEqual('user one (Group Admin)');
    });
});
