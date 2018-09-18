import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import IconMenu from '../../components/common/IconMenu';
import ConfirmDialog from '../../components/Dialog/ConfirmDialog';
import { UserHeader } from '../../components/UserGroupsPage/UserHeader';

describe('UserHeader component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => (
        {
            selected: false,
            onSelect: () => {},
            orderingValue: 'username',
            handleOrderingChange: () => {},
            handleAddUsers: () => {},
            handleRemoveUsers: () => {},
            handleAdminRights: () => {},
            selectedUsers: [
                { user: { name: 'user1', username: 'user2' } },
                { user: { name: 'user2', username: 'user2' } },
            ],
            selectedGroup: {
                name: 'group1',
                id: 1,
                administrators: ['user1'],
                members: ['user1', 'user2'],
            },
            handleNewGroup: () => {},
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<UserHeader {...props} />)
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserHeader')).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(2);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
    });

    it('should render the selected users options', () => {
        const props = getProps();
        props.selectedUsers = [];
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserHeader-options')).toHaveLength(0);
        wrapper.setProps({ selectedUsers: getProps().selectedUsers });
        expect(wrapper.find('.qa-UserHeader-options')).toHaveLength(1);
    });

    it('should render the admin and remove buttons', () => {
        const props = getProps();
        props.showRemoveButton = true;
        props.showAdminButton = true;
        const wrapper = getWrapper(props);
        const dropdown = wrapper.find(IconMenu).first();
        expect(dropdown.props().children).toHaveLength(4);
    });

    it('handleAddUsersClick should call handleAddUsers', () => {
        const props = getProps();
        props.handleAddUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleAddUsersClick();
        expect(props.handleAddUsers.calledOnce).toBe(true);
        expect(props.handleAddUsers.calledWith(props.selectedUsers)).toBe(true);
    });

    it('handleNewGroupClick should call handleNewGroup', () => {
        const props = getProps();
        props.handleNewGroup = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleNewGroupClick();
        expect(props.handleNewGroup.calledOnce).toBe(true);
        expect(props.handleNewGroup.calledWith(props.selectedUsers)).toBe(true);
    });

    it('handleRemoveUsersClick should call handleRemoveUsers', () => {
        const props = getProps();
        props.handleRemoveUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleRemoveUsersClick();
        expect(props.handleRemoveUsers.calledOnce).toBe(true);
        expect(props.handleRemoveUsers.calledWith(props.selectedUsers)).toBe(true);
    });

    it('handleOpenAdminConfirm should call setState', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleOpenAdminConfirm();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdminConfirm: true })).toBe(true);
    });

    it('handleCloseAdminConfirm should setState', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleCloseAdminConfirm();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdminConfirm: false })).toBe(true);
    });

    it('handleConfirmAdminAction should call handleCloseAdminConfirm and handleAdminRights', () => {
        const props = getProps();
        props.handleAdminRights = sinon.spy();
        const closeStub = sinon.stub(UserHeader.prototype, 'handleCloseAdminConfirm');
        const wrapper = getWrapper(props);
        wrapper.instance().handleConfirmAdminAction();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleAdminRights.calledOnce).toBe(true);
        expect(props.handleAdminRights.calledWith(props.selectedUsers)).toBe(true);
        closeStub.restore();
    });
});
