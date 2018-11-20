import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import IconMenu from '../../components/common/IconMenu';
import { OwnUserRow } from '../../components/UserGroupsPage/OwnUserRow';

describe('OwnUserRow component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

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
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<OwnUserRow {...props} />)
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-OwnUserRow')).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
    });

    it('should render username and no email text', () => {
        const props = getProps();
        props.user.user.first_name = '';
        props.user.user.last_name = '';
        props.user.user.email = '';
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-OwnUserRow-name').text()).toEqual(props.user.user.username);
        expect(wrapper.find('.qa-OwnUserRow-email').text()).toEqual('No email provided');
    });

    it('should render an admin and remove button and admin label', () => {
        const props = getProps();
        props.showRemoveButton = true;
        props.showAdminButton = true;
        props.showAdminLabel = true;
        props.isAdmin = true;
        const wrapper = getWrapper(props);
        const dropdown = wrapper.find(IconMenu);
        expect(dropdown.props().children).toHaveLength(2);
        expect(wrapper.find('.qa-OwnUserRow-adminLabel')).toHaveLength(1);
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

    it('handleDemoteAdminClick should call handleDemoteAdmin', () => {
        const props = getProps();
        props.handleDemoteAdmin = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleDemoteAdminClick();
        expect(props.handleDemoteAdmin.calledOnce).toBe(true);
        expect(props.handleDemoteAdmin.calledWith(props.user)).toBe(true);
    });

    it('demote admin and remove user should log a warning if functions are not supplied', () => {
        const consoleStub = sinon.stub(console, 'warn');
        const props = getProps();
        const wrapper = getWrapper(props);
        const e = { stopPropagation: sinon.spy() };
        wrapper.instance().handleDemoteAdminClick(e);
        wrapper.instance().handleRemoveUserClick(e);
        expect(consoleStub.calledTwice).toBe(true);
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
