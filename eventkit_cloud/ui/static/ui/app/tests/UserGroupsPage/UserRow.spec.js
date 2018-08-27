import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import IconMenu from '../../components/common/IconMenu';
import UserRow from '../../components/UserGroupsPage/UserRow';

describe('UserRow component', () => {
    const getProps = () => (
        {
            user: {
                user: {
                    username: 'user_one',
                    first_name: 'user',
                    last_name: 'one',
                    email: 'user.one@email.com',
                },
                groups: [1],
            },
            selected: false,
            onSelect: () => {},
            handleNewGroup: () => {},
            handleAddUser: () => {},
        }
    );

    const getWrapper = props => (
        mount(<UserRow {...props} />)
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserRow')).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
    });

    it('should render username and no email text', () => {
        const props = getProps();
        props.user.user.first_name = '';
        props.user.user.last_name = '';
        props.user.user.email = '';
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserRow-name').text()).toEqual(props.user.user.username);
        expect(wrapper.find('.qa-UserRow-email').text()).toEqual('No email provided');
    });

    it('should render an admin and remove button', () => {
        const props = getProps();
        props.showRemoveButton = true;
        props.showAdminButton = true;
        props.isAdmin = true;
        const wrapper = getWrapper(props);
        const dropdown = wrapper.find(IconMenu);
        expect(dropdown.props().children).toHaveLength(4);
    });

    it('handleMouseOver should setState to hovered', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleMouseOver();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ hovered: true })).toBe(true);
    });

    it('handleMouseOut should setState to not hovered', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleMouseOut();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ hovered: false })).toBe(true);
    });

    it('handleAddUserClick should call handleNewGroup', () => {
        const props = getProps();
        props.handleAddUser = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleAddUserClick();
        expect(props.handleAddUser.calledOnce).toBe(true);
        expect(props.handleAddUser.calledWith([props.user])).toBe(true);
    });

    it('handleNewGroupClick should call handle new group', () => {
        const props = getProps();
        props.handleNewGroup = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleNewGroupClick();
        expect(props.handleNewGroup.calledOnce).toBe(true);
        expect(props.handleNewGroup.calledWith([props.user])).toBe(true);
    });

    it('handleMakeAdminClick should call handleMakeAdmin', () => {
        const props = getProps();
        props.handleMakeAdmin = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleMakeAdminClick();
        expect(props.handleMakeAdmin.calledOnce).toBe(true);
        expect(props.handleMakeAdmin.calledWith(props.user)).toBe(true);
    });

    it('handleDemoteAdminClick should call handleDemoteAdmin', () => {
        const props = getProps();
        props.handleDemoteAdmin = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleDemoteAdminClick();
        expect(props.handleDemoteAdmin.calledOnce).toBe(true);
        expect(props.handleDemoteAdmin.calledWith(props.user)).toBe(true);
    });

    it('make and demote admin and remove user should log a warning if functions are not supplied', () => {
        const consoleStub = sinon.stub(console, 'error');
        const props = getProps();
        const wrapper = getWrapper(props);
        const e = { stopPropagation: sinon.spy() };
        wrapper.instance().handleMakeAdminClick(e);
        wrapper.instance().handleDemoteAdminClick(e);
        wrapper.instance().handleRemoveUserClick(e);
        expect(consoleStub.calledThrice).toBe(true);
        consoleStub.restore();
    });

    it('handleRemoveUserClick should call handleRemoveUser', () => {
        const props = getProps();
        props.handleRemoveUser = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleRemoveUserClick();
        expect(props.handleRemoveUser.calledOnce).toBe(true);
        expect(props.handleRemoveUser.calledWith(props.user)).toBe(true);
    });
});
