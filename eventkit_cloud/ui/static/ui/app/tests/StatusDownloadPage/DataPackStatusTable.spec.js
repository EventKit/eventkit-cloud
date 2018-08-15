import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DropDownMenu from 'material-ui/DropDownMenu';
import DatePicker from 'material-ui/DatePicker';
import Edit from '@material-ui/icons/Edit';
import CustomTableRow from '../../components/CustomTableRow';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';
import DataPackStatusTable from '../../components/StatusDownloadPage/DataPackStatusTable';

describe('DataPackStatusTable component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            status: 'COMPLETED',
            expiration: '2017-03-24T15:52:35.637258Z',
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
            handleExpirationChange: () => {},
            handlePermissionsChange: () => {},
            members: [
                { user: { username: 'user_one' } },
                { user: { username: 'user_two' } },
            ],
            groups: [
                { id: 1 },
                { id: 2 },
            ],
            adminPermissions: true,
            user: { user: { username: 'admin' } },
        }
    );

    const getWrapper = props => (
        mount(<DataPackStatusTable {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CustomTableRow)).toHaveLength(3);
        expect(wrapper.find(DatePicker)).toHaveLength(1);
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render the share dialog', () => {
        const props = getProps();
        const stub = sinon.stub(DataPackShareDialog.prototype, 'render').returns(null);
        const wrapper = getWrapper(props);
        wrapper.setState({ shareDialogOpen: true });
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(1);
        wrapper.unmount();
        stub.restore();
    });

    it('should display the correct members and groups text', () => {
        const props = getProps();
        props.permissions.value = 'SHARED';
        const wrapper = getWrapper(props);
        let button = wrapper.find('.qa-DataPackStatusTable-MembersAndGroups-button').hostNodes();
        expect(button).toHaveLength(1);
        expect(button.text()).toEqual('No Members / No Groups');

        let nextProps = getProps();
        nextProps.permissions = {
            value: 'SHARED',
            groups: { 1: 'READ', 2: 'READ' },
            members: { user_one: 'READ', user_two: 'READ' },
        };
        wrapper.setProps(nextProps);
        button = wrapper.find('.qa-DataPackStatusTable-MembersAndGroups-button').hostNodes();
        expect(button.text()).toEqual('All Members / All Groups');

        nextProps = getProps();
        nextProps.permissions = {
            value: 'SHARED',
            groups: { 1: 'READ' },
            members: { user_one: 'READ' },
        };
        wrapper.setProps(nextProps);
        button = wrapper.find('.qa-DataPackStatusTable-MembersAndGroups-button').hostNodes();
        expect(button.text()).toEqual('1 Member / 1 Group');


        nextProps = getProps();
        nextProps.permissions = {
            value: 'SHARED',
            groups: { 1: 'READ', 2: 'READ', 3: 'READ' },
            members: { user_one: 'READ', user_two: 'READ', user_three: 'READ' },
        };
        wrapper.setProps(nextProps);
        button = wrapper.find('.qa-DataPackStatusTable-MembersAndGroups-button').hostNodes();
        expect(button.text()).toEqual('3 Members / 3 Groups');
    });

    it('Edit icon should call dp.focus on click', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const focusSpy = sinon.spy();
        wrapper.instance().dp = { focus: focusSpy };
        wrapper.find(Edit).simulate('click');
        expect(focusSpy.calledOnce).toBe(true);
    });

    it('the value of the drop down menu should be SHARED', () => {
        const props = getProps();
        props.permissions.value = 'SHARED';
        const wrapper = getWrapper(props);
        const val = wrapper.find(DropDownMenu).props().value;
        wrapper.update();
        expect(val).toEqual('SHARED');
    });

    it('handleShareDialogOpen should set open to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleShareDialogOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ shareDialogOpen: true })).toBe(true);
        stateStub.restore();
    });

    it('handleShareDialogClose should set close to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleShareDialogClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ shareDialogOpen: false })).toBe(true);
        stateStub.restore();
    });

    it('handleShareDialogSave should call handleChange and Close', () => {
        const props = getProps();
        props.handlePermissionsChange = sinon.spy();
        const wrapper = getWrapper(props);
        const closeStub = sinon.stub(wrapper.instance(), 'handleShareDialogClose');
        const newPermissions = {
            value: 'SHARED',
            members: { user_one: 'ADMIN', user_two: 'READ' },
            groups: { group_one: 'READ', group_two: 'READ' },
        };
        wrapper.instance().handleShareDialogSave(newPermissions);
        expect(props.handlePermissionsChange.calledOnce).toBe(true);
        expect(props.handlePermissionsChange.calledWith({ ...newPermissions })).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleDropDownChange should update the permission value', () => {
        const props = getProps();
        props.handlePermissionsChange = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleDropDownChange({}, 0, 'SHARED');
        expect(props.handlePermissionsChange.calledOnce).toBe(true);
        expect(props.handlePermissionsChange.calledWith({ ...props.permissions, value: 'SHARED' })).toBe(true);
    });
});
