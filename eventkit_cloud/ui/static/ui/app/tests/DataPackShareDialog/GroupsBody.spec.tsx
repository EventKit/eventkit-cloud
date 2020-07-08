import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import CustomTextField from '../../components/common/CustomTextField';
import GroupRow from '../../components/DataPackShareDialog/GroupRow';
import GroupsHeaderRow from '../../components/DataPackShareDialog/GroupsHeaderRow';
import GroupBodyTooltip from '../../components/DataPackShareDialog/ShareBodyTooltip';
import { GroupsBody } from '../../components/DataPackShareDialog/GroupsBody';

describe('GroupBody component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        groups: [
            {
                id: 1,
                name: 'group_one',
                members: ['user_one', 'user_two'],
                administrators: ['user_one'],
            },
            {
                id: 2,
                name: 'group_two',
                members: ['user_two'],
                administrators: ['user_two'],
            },
        ],
        job: {uid: 'xx222'},
        nextPage: false,
        getPermissionGroups
            : sinon.spy(),
        selectedGroups: {},
        groupsText: 'Test text',
        onUncheckAll: sinon.spy(),
        onCheckAll: sinon.spy(),
        onGroupCheck: sinon.spy(),
        onAdminCheck: sinon.spy(),
        canUpdateAdmin: false,
        handleShowShareInfo: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;

    const setup = (customProps = {}, options = { disableLifecycleMethods: true }) => {
        props = { ...getProps(), ...customProps };
        wrapper = shallow(<GroupsBody {...props} />, options);
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find('.qa-GroupsBody-groupsText')).toHaveLength(1);
        expect(wrapper.find('.qa-GroupsBody-groupsText').text()).toEqual(props.groupsText);
        expect(wrapper.find(CustomTextField)).toHaveLength(1);
        expect(wrapper.find(GroupsHeaderRow)).toHaveLength(1);
        expect(wrapper.find(GroupRow)).toHaveLength(props.groups.length);
    });

    it('should show shareInfo', () => {
        expect(wrapper.find('.qa-GroupsBody-shareInfo')).toHaveLength(0);
        const nextProps = getProps();
        nextProps.canUpdateAdmin = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find('.qa-GroupsBody-shareInfo')).toHaveLength(1);
    });

    it('should render a tooltip', () => {
        const stub = sinon.stub(GroupBodyTooltip.prototype, 'render').returns(null);
        wrapper.setState({ tooltip: { target: {}, admin: true } });
        expect(wrapper.find(GroupBodyTooltip)).toHaveLength(1);
        wrapper.unmount();
        stub.restore();
    });

    it('componentDidMount should add event listener', () => {
        const addStub = sinon.stub((global as any).window, 'addEventListener');
        wrapper.instance().componentDidMount();
        expect(addStub.called).toBe(true);
        expect(addStub.calledWith('wheel', wrapper.instance().handleScroll)).toBe(true);
        addStub.restore();
    });

    it('componentWillUnmount should remove event listener', () => {
        const removeStub = sinon.stub((global as any).window, 'removeEventListener');
        const fnc = wrapper.instance().handleScroll;
        wrapper.unmount();
        expect(removeStub.called).toBe(true);
        expect(removeStub.calledWith('wheel', fnc)).toBe(true);
        removeStub.restore();
    });

    it('getPermissionGroups' +
        ' should set loading states and call props.getPermissionGroups' +
        '', async () => {
        const getStub = sinon.stub().returns(new Promise(resolve => resolve()));
        setup({getPermissionGroups
                : getStub});
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const jobUid = 'xx222';
        const permissions = 'shared';
        const groupOrder = wrapper.state('groupOrder');
        const params = {
            prepend_self: 'true',
            ordering: `${permissions},${groupOrder}`,
            page: 1,
        };
        await wrapper.instance().getPermissionGroups
        (jobUid, 'shared', 'name', {}, false);
        expect(stateStub.calledTwice).toBe(true);
        expect(stateStub.calledWith({ loading: true })).toBe(true);
        expect(stateStub.calledWith({ loading: false })).toBe(true);
        expect(props.getPermissionGroups
            .calledOnce).toBe(true);
        expect(props.getPermissionGroups
            .calledWith(jobUid, params, false)).toBe(true);
    });

    it('loadMore should call getPermissionGroups' +
        ' and setState with incremented page number', () => {
        const getStub = sinon.stub(wrapper.instance(), 'getPermissionGroups');
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const page = wrapper.state('page');
        const jobUid = 'xx222';
        wrapper.instance().loadMore();
        expect(getStub.calledOnce).toBe(true);
        expect(getStub.calledWith(jobUid, 'shared', 'name', { page: page + 1 })).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ page: page + 1 })).toBe(true);
    });

    it('handleUncheckAll should call onUncheckAll', () => {
        wrapper.instance().handleUncheckAll();
        expect(props.onUncheckAll.calledOnce).toBe(true);
    });

    it('handleCheckAll should call onCheckAll', () => {
        wrapper.instance().handleCheckAll();
        expect(props.onCheckAll.calledOnce).toBe(true);
    });

    it('handleCheck should call onGroupCheck with the target groupname', () => {
        const groupname = 'test-user';
        const group = { name: groupname };
        wrapper.instance().handleCheck(group);
        expect(props.onGroupCheck.calledOnce).toBe(true);
        expect(props.onGroupCheck.calledWith(groupname)).toBe(true);
    });

    it('handleAdminCheck should call onAdminCheck with the target groupname', () => {
        const groupname = 'test-user';
        const group = { name: groupname };
        wrapper.instance().handleAdminCheck(group);
        expect(props.onAdminCheck.calledOnce).toBe(true);
        expect(props.onAdminCheck.calledWith(groupname)).toBe(true);
    });

    it('handleAdminMouseOver should setState with tooltip', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const target = { key: 'value' };
        const admin = true;
        wrapper.instance().handleAdminMouseOver(target, admin);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ tooltip: { target, admin } })).toBe(true);
        stateStub.restore();
    });

    it('handleAdminMouseOut should clear the tooltip state', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleAdminMouseOut();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ tooltip: { target: null, admin: false } })).toBe(true);
        stateStub.restore();
    });

    it('handleScroll should call handleAdminMouseOut if there is a tooltip', () => {
        const mouseStub = sinon.stub(wrapper.instance(), 'handleAdminMouseOut');
        wrapper.instance().render = sinon.stub().returns(null);
        wrapper.setState({ tooltip: { target: {}, admin: true } });
        wrapper.instance().handleScroll();
        expect(mouseStub.calledOnce).toBe(true);
        mouseStub.restore();
    });

    it('handleSearchInput should set state with target value', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const e = { target: { value: 'search text' } };
        wrapper.instance().handleSearchInput(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ search: 'search text' }));
        stateStub.restore();
    });

    it('handleSearchInput should call getPermissionGroups' +
        ' if input is empty', () => {
        wrapper.setState({ search: 'some search text' });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const getStub = sinon.stub(wrapper.instance(), 'getPermissionGroups' +
            '');
        const e = { target: { value: '' } };
        wrapper.instance().handleSearchInput(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ page: 1, search: '' })).toBe(true);
        expect(getStub.calledOnce).toBe(true);
    });

    it('reverseGroupOrder should call getPermissionGroups' +
        ' and update order state', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const getStub = sinon.stub(wrapper.instance(), 'getPermissionGroups' +
            '');
        const v = 'newValue';
        wrapper.instance().reverseGroupOrder(v);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ groupOrder: v, activeOrder: v, page: 1 })).toBe(true);
        expect(getStub.calledOnce).toBe(true);
    });

    it('reverseShareOrder should update shareOrder and activeOrder', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const getStub = sinon.stub(wrapper.instance(), 'getPermissionGroups' +
            '');
        const v = 'newValue';
        wrapper.instance().reverseSharedOrder(v);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sharedOrder: v, activeOrder: v }));
        expect(getStub.calledOnce).toBe(true);
    });
});
