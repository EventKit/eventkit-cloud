import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { PermissionsFilter } from '../../components/DataPackPage/PermissionsFilter';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';

describe('PermissionsFilter component', () => {
    const getProps = () => ({
        permissions: {
            value: 'SHARED',
            groups: {},
            members: {},
        },
        onChange: sinon.spy(),
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
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<PermissionsFilter {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render a title and a RadioGroup with 2 Radios', () => {
        expect(wrapper.find('p').text()).toEqual('Permissions');
        expect(wrapper.find(RadioGroup)).toHaveLength(1);
        expect(wrapper.find(RadioGroup).props().name).toEqual('permissions');
        expect(wrapper.find(RadioGroup).props().value).toEqual('SHARED');
        expect(wrapper.find(FormControlLabel)).toHaveLength(2);
        expect(wrapper.find(FormControlLabel).at(0).html()).toContain('Private (only me)');
        expect(wrapper.find(FormControlLabel).at(0).props().value).toEqual('PRIVATE');
        expect(wrapper.find(FormControlLabel).at(1).html()).toContain('Shared');
        expect(wrapper.find(FormControlLabel).at(1).props().value).toEqual('SHARED');
    });

    it('should render a Share Dialog', () => {
        setup({ permissions: { ...props.permissions, value: 'SHARED' } });
        const stub = sinon.stub(DataPackShareDialog.prototype, 'render').returns(null);
        wrapper.setState({ open: true });
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(1);
        stub.restore();
    });

    it('should render the correct members and groups text', () => {
        setup({ permissions: { members: {}, groups: {}, value: 'SHARED' } });
        let button = wrapper.find('.qa-PermissionsFilter-MembersAndGroups-button');

        expect(button.html()).toContain('No Members / No Groups');

        let nextProps = { ...props };
        nextProps.permissions.groups = { 1: '' };
        nextProps.permissions.members = { user_one: '' };
        wrapper.setProps(nextProps);
        wrapper.update();
        button = wrapper.find('.qa-PermissionsFilter-MembersAndGroups-button');
        expect(button.html()).toContain('1 Member / 1 Group');

        nextProps = { ...nextProps };
        nextProps.permissions.groups = { 1: '', 2: '' };
        nextProps.permissions.members = { user_one: '', user_two: '' };
        wrapper.setProps(nextProps);
        wrapper.update();
        button = wrapper.find('.qa-PermissionsFilter-MembersAndGroups-button');
        expect(button.html()).toContain('2 Members / 2 Groups');

        nextProps = { ...nextProps };
        nextProps.permissions.groups = { 1: '', 2: '', 3: '' };
        nextProps.permissions.members = { user_one: '', user_two: '', user_three: '' };
        wrapper.setProps(nextProps);
        wrapper.update();
        button = wrapper.find('.qa-PermissionsFilter-MembersAndGroups-button');
        expect(button.html()).toContain('3 Members / 3 Groups');
    });

    it('handleOpen should setState to open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const e = { preventDefault: sinon.spy(), stopPropagation: sinon.spy() };
        instance.handleOpen(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: true })).toBe(true);
        stateStub.restore();
    });

    it('handleClose should setState to close', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: false })).toBe(true);
        stateStub.restore();
    });

    it('handleSave should call props onChange and handleClose', () => {
        const closeStub = sinon.stub(instance, 'handleClose');
        const permissions = {
            value: 'SHARED',
            groups: {},
            members: {},
        };
        instance.handleSave(permissions);
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.calledWith({ ...permissions })).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleSelection should call onChange with passed in value', () => {
        instance.handleSelection({ target: { value: 'PRIVATE' } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.calledWith({ value: 'PRIVATE' })).toBe(true);
    });

    it('handleSelection should call onChange with all members and groups too', () => {
        const expected = {
            value: 'PUBLIC',
            groups: {},
            members: {},
        };
        instance.handleSelection({ target: { value: 'PUBLIC' } });
        expect(props.onChange.calledOnce).toBe(true);
        expect(props.onChange.calledWith(expected)).toBe(true);
    });
});
