import * as React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import * as sinon from 'sinon';
import IconMenu from '../../components/common/IconMenu';
import ConfirmDialog from '../../components/Dialog/ConfirmDialog';
import { UserHeader } from '../../components/UserGroupsPage/UserHeader';

describe('UserHeader component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        selected: false,
        onSelect: sinon.spy(),
        orderingValue: 'username',
        handleOrderingChange: sinon.spy(),
        handleAddUsers: sinon.spy(),
        handleRemoveUsers: sinon.spy(),
        handleAdminRights: sinon.spy(),
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
        handleNewGroup: sinon.spy(),
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<UserHeader {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find('.qa-UserHeader')).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(2);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
    });

    it('should render the selected users options', () => {
        wrapper.setProps({ selectedUsers: [] });
        expect(wrapper.find('.qa-UserHeader-options')).toHaveLength(0);
        wrapper.setProps({ selectedUsers: getProps().selectedUsers });
        expect(wrapper.find('.qa-UserHeader-options')).toHaveLength(1);
    });

    it('should render the admin and remove buttons', () => {
        wrapper.setProps({ showRemoveButton: true, showAdminButton: true });
        const dropdown = wrapper.find(IconMenu).first();
        expect(dropdown.props().children).toHaveLength(4);
    });

    it('handleAddUsersClick should call handleAddUsers', () => {
        instance.handleAddUsersClick();
        expect(props.handleAddUsers.calledOnce).toBe(true);
        expect(props.handleAddUsers.calledWith(props.selectedUsers)).toBe(true);
    });

    it('handleNewGroupClick should call handleNewGroup', () => {
        instance.handleNewGroupClick();
        expect(props.handleNewGroup.calledOnce).toBe(true);
        expect(props.handleNewGroup.calledWith(props.selectedUsers)).toBe(true);
    });

    it('handleRemoveUsersClick should call handleRemoveUsers', () => {
        instance.handleRemoveUsersClick();
        expect(props.handleRemoveUsers.calledOnce).toBe(true);
        expect(props.handleRemoveUsers.calledWith(props.selectedUsers)).toBe(true);
    });

    it('handleOpenAdminConfirm should call setState', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleOpenAdminConfirm();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdminConfirm: true })).toBe(true);
    });

    it('handleCloseAdminConfirm should setState', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleCloseAdminConfirm();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdminConfirm: false })).toBe(true);
    });

    it('handleConfirmAdminAction should call handleCloseAdminConfirm and handleAdminRights', () => {
        const closeStub = sinon.stub(instance, 'handleCloseAdminConfirm');
        instance.handleConfirmAdminAction();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleAdminRights.calledOnce).toBe(true);
        expect(props.handleAdminRights.calledWith(props.selectedUsers)).toBe(true);
        closeStub.restore();
    });
});
