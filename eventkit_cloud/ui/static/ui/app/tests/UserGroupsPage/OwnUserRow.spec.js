import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import IconButton from 'material-ui/IconButton';
import { GroupsDropDownMenu } from '../../components/UserGroupsPage/GroupsDropDownMenu';
import OwnUserRow from '../../components/UserGroupsPage/OwnUserRow';

describe('OwnUserRow component', () => {
    const muiTheme = getMuiTheme();
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
        }
    );

    const getWrapper = props => (
        mount(<OwnUserRow {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-OwnUserRow')).toHaveLength(1);
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(GroupsDropDownMenu)).toHaveLength(1);
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
        const dropdown = wrapper.find(GroupsDropDownMenu);
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

    it('handleOpen should preventDefault, stopPropagation, and setState', () => {
        const fakeEvent = {
            preventDefault: sinon.spy(),
            stopPropagation: sinon.spy(),
            currentTarget: null,
        };
        const props = getProps();
        const stateSpy = sinon.spy(OwnUserRow.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleOpen(fakeEvent);
        expect(fakeEvent.preventDefault.calledOnce).toBe(true);
        expect(fakeEvent.stopPropagation.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: true, popoverAnchor: null })).toBe(true);
        stateSpy.restore();
    });

    it('handleClose should setState', () => {
        const props = getProps();
        const stateSpy = sinon.spy(OwnUserRow.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleDemoteAdminClick should handleClose and call handleDemoteAdmin', () => {
        const props = getProps();
        props.handleDemoteAdmin = sinon.spy();
        const closeStub = sinon.stub(OwnUserRow.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        wrapper.instance().handleDemoteAdminClick();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleDemoteAdmin.calledOnce).toBe(true);
        expect(props.handleDemoteAdmin.calledWith(props.user)).toBe(true);
        closeStub.restore();
    });

    it('demote admin and remove user should log a warning if functions are not supplied', () => {
        const consoleStub = sinon.stub(console, 'error');
        const props = getProps();
        const wrapper = getWrapper(props);
        const e = { stopPropagation: sinon.spy() };
        wrapper.instance().handleDemoteAdminClick(e);
        wrapper.instance().handleRemoveUserClick(e);
        expect(consoleStub.calledTwice).toBe(true);
        consoleStub.restore();
    });

    it('handleRemoveUserClick should call handleClose and handleRemoveUser', () => {
        const props = getProps();
        props.handleRemoveUser = sinon.spy();
        const closeStub = sinon.stub(OwnUserRow.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        wrapper.instance().handleRemoveUserClick();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleRemoveUser.calledOnce).toBe(true);
        expect(props.handleRemoveUser.calledWith(props.user)).toBe(true);
    });
});
