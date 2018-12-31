import * as React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import * as sinon from 'sinon';
import IconMenu from '../../components/common/IconMenu';
import { UserRow } from '../../components/UserGroupsPage/UserRow';

describe('UserRow component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
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
        onSelect: sinon.spy(),
        handleNewGroup: sinon.spy(),
        handleAddUser: sinon.spy(),
        handleMakeAdmin: sinon.spy(),
        handleDemoteAdmin: sinon.spy(),
        handleRemoveUser: sinon.spy(),
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<UserRow {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find('.qa-UserRow')).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
    });

    it('should render username and no email text', () => {
        const user = { ...props.user };
        user.user.first_name = '';
        user.user.last_name = '';
        user.user.email = '';
        wrapper.setProps({ user });
        expect(wrapper.find('.qa-UserRow-name').text()).toEqual(props.user.user.username);
        expect(wrapper.find('.qa-UserRow-email').text()).toEqual('No email provided');
    });

    it('should render an admin and remove button', () => {
        props.showRemoveButton = true;
        props.showAdminButton = true;
        props.isAdmin = true;
        wrapper.setProps({
            showRemoveButton: true,
            showAdminButton: true,
            isAdmin: true,
        });
        const dropdown = wrapper.find(IconMenu);
        expect(dropdown.props().children).toHaveLength(4);
    });

    it('handleAddUserClick should call handleNewGroup', () => {
        instance.handleAddUserClick();
        expect(props.handleAddUser.calledOnce).toBe(true);
        expect(props.handleAddUser.calledWith([props.user])).toBe(true);
    });

    it('handleNewGroupClick should call handle new group', () => {
        instance.handleNewGroupClick();
        expect(props.handleNewGroup.calledOnce).toBe(true);
        expect(props.handleNewGroup.calledWith([props.user])).toBe(true);
    });

    it('handleMakeAdminClick should call handleMakeAdmin', () => {
        instance.handleMakeAdminClick();
        expect(props.handleMakeAdmin.calledOnce).toBe(true);
        expect(props.handleMakeAdmin.calledWith(props.user)).toBe(true);
    });

    it('handleDemoteAdminClick should call handleDemoteAdmin', () => {
        instance.handleDemoteAdminClick();
        expect(props.handleDemoteAdmin.calledOnce).toBe(true);
        expect(props.handleDemoteAdmin.calledWith(props.user)).toBe(true);
    });

    it('make and demote admin and remove user should log a warning if functions are not supplied', () => {
        wrapper.setProps({ handleMakeAdmin: undefined, handleDemoteAdmin: undefined, handleRemoveUser: undefined });
        const consoleStub = sinon.stub(console, 'warn');
        const e = { stopPropagation: sinon.spy() };
        instance.handleMakeAdminClick(e);
        instance.handleDemoteAdminClick(e);
        instance.handleRemoveUserClick(e);
        expect(consoleStub.calledThrice).toBe(true);
        consoleStub.restore();
    });

    it('handleRemoveUserClick should call handleRemoveUser', () => {
        instance.handleRemoveUserClick();
        expect(props.handleRemoveUser.calledOnce).toBe(true);
        expect(props.handleRemoveUser.calledWith(props.user)).toBe(true);
    });
});
