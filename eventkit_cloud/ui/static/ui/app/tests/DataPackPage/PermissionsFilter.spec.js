import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import PermissionsFilter from '../../components/DataPackPage/PermissionsFilter';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';

describe('PermissionsFilter component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            permissions: {
                value: 'SHARED',
                groups: {},
                members: {},
            },
            onChange: () => {},
            groups: [
                { id: 1, name: 'group_one', members: ['user_one'] },
                { id: 2, name: 'group_two', members: ['user_two'] },
            ],
            members: [
                {
                    user: {
                        username: 'user_one',
                        first_name: 'user',
                        last_name: 'one',
                        email: 'user.one@email.com',
                    },
                    groups: [1],
                },
                {
                    user: {
                        username: 'user_two',
                        first_name: 'user',
                        last_name: 'two',
                        email: 'user.two@email.com',
                    },
                    groups: [2],
                },
            ],
        }
    );

    const getWrapper = props => (
        mount(<PermissionsFilter {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render a title and a RadioGroup with 2 Radios', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('p').text()).toEqual('Permissions');
        expect(wrapper.find(RadioGroup)).toHaveLength(1);
        expect(wrapper.find(RadioGroup).props().name).toEqual('permissions');
        expect(wrapper.find(RadioGroup).props().value).toEqual('SHARED');
        expect(wrapper.find(Radio)).toHaveLength(2);
        expect(wrapper.find(FormControlLabel).at(0).text()).toEqual('Private (only me)');
        expect(wrapper.find(Radio).at(0).props().value).toEqual('PRIVATE');
        expect(wrapper.find(FormControlLabel).at(1).text()).toEqual('Shared');
        expect(wrapper.find(Radio).at(1).props().value).toEqual('SHARED');
    });

    it('should render a Share Dialog', () => {
        const props = getProps();
        props.permissions.value = 'SHARED';
        const stub = sinon.stub(DataPackShareDialog.prototype, 'render').returns(null);
        const wrapper = getWrapper(props);
        wrapper.setState({ open: true });
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(1);
        stub.restore();
    });

    it('should render the correct members and groups text', () => {
        const props = getProps();
        props.permissions.value = 'SHARED';
        props.permissions.groups = {};
        props.permissions.members = {};
        const wrapper = getWrapper(props);
        const button = wrapper.find('.qa-PermissionsFilter-MembersAndGroups-button');

        expect(button.hostNodes().text()).toEqual('No Members / No Groups');

        let nextProps = { ...props };
        nextProps.permissions.groups = { 1: '' };
        nextProps.permissions.members = { user_one: '' };
        wrapper.setProps(nextProps);
        expect(button.hostNodes().text()).toEqual('1 Member / 1 Group');

        nextProps = { ...nextProps };
        nextProps.permissions.groups = { 1: '', 2: '' };
        nextProps.permissions.members = { user_one: '', user_two: '' };
        wrapper.setProps(nextProps);
        expect(button.hostNodes().text()).toEqual('All Members / All Groups');

        nextProps = { ...nextProps };
        nextProps.permissions.groups = { 1: '', 2: '', 3: '' };
        nextProps.permissions.members = { user_one: '', user_two: '', user_three: '' };
        wrapper.setProps(nextProps);
        expect(button.hostNodes().text()).toEqual('3 Members / 3 Groups');
    });

    it('handleOpen should setState to open', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const e = { preventDefault: () => {}, stopPropagation: () => {} };
        wrapper.instance().handleOpen(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: true })).toBe(true);
        stateStub.restore();
    });

    it('handleClose should setState to close', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: false })).toBe(true);
        stateStub.restore();
    });

    it('handleSave should call props onChange and handleClose', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        const closeStub = sinon.stub(wrapper.instance(), 'handleClose');
        const permissions = {
            value: 'SHARED',
            groups: {},
            members: {},
        };
        wrapper.instance().handleSave(permissions);
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.calledWith({ ...permissions })).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleSelection should call onChange with passed in value', () => {
        const props = getProps();
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleSelection({ target: { value: 'PRIVATE' } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.calledWith({ value: 'PRIVATE' })).toBe(true);
    });

    it('handleSelection should call onChange with all members and groups too', () => {
        const props = getProps();
        const expected = {
            value: 'PUBLIC',
            groups: {},
            members: {},
        };
        props.groups.forEach((group) => { expected.groups[group.name] = 'READ'; });
        props.members.forEach((member) => { expected.members[member.user.username] = 'READ'; });
        props.onChange = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleSelection({ target: { value: 'PUBLIC' } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.calledWith(expected)).toBe(true);
    });
});
