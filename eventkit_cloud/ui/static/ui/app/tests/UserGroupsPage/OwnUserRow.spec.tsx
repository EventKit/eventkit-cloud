import * as React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import * as sinon from 'sinon';
import IconMenu from '../../components/common/IconMenu';
import { OwnUserRow } from '../../components/UserGroupsPage/OwnUserRow';

describe('OwnUserRow component', () => {
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
        handleRemoveUser: sinon.spy(),
        handleDemoteAdmin: sinon.spy(),
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<OwnUserRow {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find('.qa-OwnUserRow')).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
    });

    it('should render username and no email text', () => {
        const user = { ...props.user };
        user.user.first_name = '';
        user.user.last_name = '';
        user.user.email = '';
        wrapper.setProps({ user });
        expect(wrapper.find('.qa-OwnUserRow-name').text()).toEqual(props.user.user.username);
        expect(wrapper.find('.qa-OwnUserRow-email').text()).toEqual('No email provided');
    });

    it('should render an admin and remove button and admin label', () => {
        wrapper.setProps({
            showRemoveButton: true,
            showAdminButton: true,
            showAdminLabel: true,
            isAdmin: true,
        });
        const dropdown = wrapper.find(IconMenu);
        expect(dropdown.props().children).toHaveLength(2);
        expect(wrapper.find('.qa-OwnUserRow-adminLabel')).toHaveLength(1);
    });

    it('handleDemoteAdminClick should call handleDemoteAdmin', () => {
        instance.handleDemoteAdminClick();
        expect(props.handleDemoteAdmin.calledOnce).toBe(true);
        expect(props.handleDemoteAdmin.calledWith(props.user)).toBe(true);
    });

    it('demote admin and remove user should log a warning if functions are not supplied', () => {
        const consoleStub = sinon.stub(console, 'warn');
        wrapper.setProps({
            handleDemoteAdmin: undefined,
            handleRemoveUser: undefined,
        });
        const e = { stopPropagation: sinon.spy() };
        instance.handleDemoteAdminClick(e);
        instance.handleRemoveUserClick(e);
        expect(consoleStub.calledTwice).toBe(true);
        consoleStub.restore();
    });

    it('handleRemoveUserClick should call handleRemoveUser', () => {
        instance.handleRemoveUserClick();
        expect(props.handleRemoveUser.calledOnce).toBe(true);
        expect(props.handleRemoveUser.calledWith(props.user)).toBe(true);
    });
});
