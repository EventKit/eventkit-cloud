import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import IconMenu from 'material-ui/IconMenu';
import { GroupsDropDownMenu } from '../../components/UserGroupsPage/GroupsDropDownMenu';
import ConfirmDialog from '../../components/Dialog/ConfirmDialog';
import UserHeader from '../../components/UserGroupsPage/UserHeader';

describe('UserHeader component', () => {
    const muiTheme = getMuiTheme();

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
        }
    );

    const getWrapper = props => (
        mount(<UserHeader {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserHeader')).toHaveLength(1);
        expect(wrapper.find(GroupsDropDownMenu)).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
    });

    it('should render the selected users options', () => {
        const props = getProps();
        props.selectedUsers = [];
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserHeader-IconButton-options')).toHaveLength(0);
        wrapper.setProps({ selectedUsers: getProps().selectedUsers });
        expect(wrapper.find('.qa-UserHeader-IconButton-options').hostNodes()).toHaveLength(1);
    });

    it('should render the admin and remove buttons', () => {
        const props = getProps();
        props.showRemoveButton = true;
        props.showAdminButton = true;
        const wrapper = getWrapper(props);
        const dropdown = wrapper.find(GroupsDropDownMenu);
        expect(dropdown.props().children).toHaveLength(6);
    });

    it('handleOpen should prevent default and set state', () => {
        const fakeEvent = { preventDefault: sinon.spy(), currentTarget: null };
        const props = getProps();
        const stateStub = sinon.stub(UserHeader.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleOpen(fakeEvent);
        expect(fakeEvent.preventDefault.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: true, popoverAnchor: null })).toBe(true);
        stateStub.restore();
    });

    it('handleClose should setState', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserHeader.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: false, popoverAnchor: null })).toBe(true);
        stateStub.restore();
    });

    it('handleAddUsersClick should call handleClose and handleAddUsers', () => {
        const props = getProps();
        props.handleAddUsers = sinon.spy();
        const closeStub = sinon.stub(UserHeader.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        wrapper.instance().handleAddUsersClick();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleAddUsers.calledOnce).toBe(true);
        expect(props.handleAddUsers.calledWith(props.selectedUsers)).toBe(true);
        closeStub.restore();
    });

    it('handleNewGroupClick should call handleClose and handleNewGroup', () => {
        const props = getProps();
        props.handleNewGroup = sinon.spy();
        const closeStub = sinon.stub(UserHeader.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        wrapper.instance().handleNewGroupClick();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleNewGroup.calledOnce).toBe(true);
        expect(props.handleNewGroup.calledWith(props.selectedUsers)).toBe(true);
        closeStub.restore();
    });

    it('handleRemoveUsersClick should call handleClose and handleRemoveUsers', () => {
        const props = getProps();
        props.handleRemoveUsers = sinon.spy();
        const closeStub = sinon.stub(UserHeader.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        wrapper.instance().handleRemoveUsersClick();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleRemoveUsers.calledOnce).toBe(true);
        expect(props.handleRemoveUsers.calledWith(props.selectedUsers)).toBe(true);
        closeStub.restore();
    });

    it('handleOpenAdminConfirm should call handleClose and setState', () => {
        const props = getProps();
        const closeStub = sinon.stub(UserHeader.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleOpenAdminConfirm();
        expect(closeStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdminConfirm: true })).toBe(true);
        closeStub.restore();
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
