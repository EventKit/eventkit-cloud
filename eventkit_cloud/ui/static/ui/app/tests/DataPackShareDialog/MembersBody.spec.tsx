import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import CustomTextField from '../../components/CustomTextField';
import MembersHeaderRow from '../../components/DataPackShareDialog/MembersHeaderRow';
import MemberRow from '../../components/DataPackShareDialog/MemberRow';
import MembersBodyTooltip from '../../components/DataPackShareDialog/ShareBodyTooltip';
import { MembersBody } from '../../components/DataPackShareDialog/MembersBody';

describe('MembersBody component', () => {
    const getProps = () => ({
        public: false,
        getUsers: sinon.spy(),
        nextPage: false,
        userCount: 2,
        users: [
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
                groups: [1, 2],
            },
        ],
        selectedMembers: {},
        membersText: 'Test text',
        onMemberCheck: sinon.spy(),
        onAdminCheck: sinon.spy(),
        onCheckCurrent: sinon.spy(),
        onCheckAll: sinon.spy(),
        onUncheckAll: sinon.spy(),
        canUpdateAdmin: false,
        handleShowShareInfo: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;

    const setup = (customProps = {}, options = { disableLifecycleMethods: true }) => {
        props = { ...getProps(), ...customProps };
        wrapper = shallow(<MembersBody {...props} />, options);
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        setup(props);
        expect(wrapper.find('.qa-MembersBody-membersText')).toHaveLength(1);
        expect(wrapper.find('.qa-MembersBody-membersText').text()).toEqual(props.membersText);
        expect(wrapper.find(CustomTextField)).toHaveLength(1);
        expect(wrapper.find(MembersHeaderRow)).toHaveLength(1);
        expect(wrapper.find(MemberRow)).toHaveLength(props.users.length);
    });

    it('should sort members by admin-share', () => {
        const sortSpy = sinon.spy(wrapper.instance(), 'sortByAdmin');
        wrapper.setState({ activeOrder: 'admin-shared' });
        expect(sortSpy.calledOnce).toBe(true);
    });

    it('should sort members by shared', () => {
        const sortSpy = sinon.spy(wrapper.instance(), 'sortByShared');
        wrapper.setState({ activeOrder: 'shared' });
        expect(sortSpy.calledOnce).toBe(true);
    });

    it('should show shareInfo', () => {
        expect(wrapper.find('.qa-MembersBody-shareInfo')).toHaveLength(0);
        const nextProps = getProps();
        nextProps.canUpdateAdmin = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find('.qa-MembersBody-shareInfo')).toHaveLength(1);
    });

    it('should render a tooltip', () => {
        const stub = sinon.stub(MembersBodyTooltip.prototype, 'render').returns(null);
        wrapper.setState({ tooltip: { target: {}, admin: true } });
        expect(wrapper.find(MembersBodyTooltip)).toHaveLength(1);
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

    it('getUsers should set loading states and call props.getUsers', async () => {
        const getStub = sinon.stub().returns(new Promise(resolve => resolve()));
        setup({ getUsers: getStub });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const params = {
            page: 1,
            exclude_self: 'true',
            ordering: wrapper.state('memberOrder'),
            search: wrapper.state('search'),
        };
        await wrapper.instance().getUsers({}, false);
        expect(stateStub.calledTwice).toBe(true);
        expect(stateStub.calledWith({ loading: true })).toBe(true);
        expect(stateStub.calledWith({ loading: false })).toBe(true);
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(params, false)).toBe(true);
    });

    it('loadMore should call getUsers and setState with incremented page number', () => {
        const getStub = sinon.stub(wrapper.instance(), 'getUsers');
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const page = wrapper.state('page');
        wrapper.instance().loadMore();
        expect(getStub.calledOnce).toBe(true);
        expect(getStub.calledWith({ page: page + 1 })).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ page: page + 1 })).toBe(true);
    });

    it('closeConfirm should set checkAllConfirm to false', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().closeConfirm();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ checkAllConfirm: false }));
    });

    it('handleUncheckAll should call onUncheckAll', () => {
        wrapper.instance().handleUncheckAll();
        expect(props.onUncheckAll.calledOnce).toBe(true);
    });

    it('handleCheckAll setState with checkAllConfirm true', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleCheckAll();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ checkAllConfirm: true })).toBe(true);
    });

    it('handlePageCheckAll should call closeConfirm and onCheckCurrent', () => {
        const closeStub = sinon.stub(wrapper.instance(), 'closeConfirm');
        wrapper.instance().handlePageCheckAll();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.onCheckCurrent.calledOnce).toBe(true);
    });

    it('handleSystemCheckAll should call closeConfirm and onCheckAll', () => {
        const closeStub = sinon.stub(wrapper.instance(), 'closeConfirm');
        wrapper.instance().handleSystemCheckAll();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.onCheckAll.calledOnce).toBe(true);
    });

    it('handleCheck should call onMemberCheck with the target username', () => {
        const username = 'test-user';
        const user = { user: { username } };
        wrapper.instance().handleCheck(user);
        expect(props.onMemberCheck.calledOnce).toBe(true);
        expect(props.onMemberCheck.calledWith(username)).toBe(true);
    });

    it('handleAdminCheck call onAdminCheck with target username', () => {
        const username = 'test-user';
        const user = { user: { username } };
        wrapper.instance().handleAdminCheck(user);
        expect(props.onAdminCheck.calledOnce).toBe(true);
        expect(props.onAdminCheck.calledWith(username)).toBe(true);
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

    it('handleSearchInput should call getUsers and update page state', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const getStub = sinon.stub(wrapper.instance(), 'getUsers');
        const e = { target: { value: 'search text' }, key: 'Enter' };
        wrapper.instance().handleSearchKeyDown(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ page: 1 }));
        expect(getStub.calledOnce).toBe(true);
        expect(getStub.calledWith({ page: 1, search: 'search text' })).toBe(true);
    });

    it('handleSearchInput should set state with target value', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const e = { target: { value: 'search text' } };
        wrapper.instance().handleSearchInput(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ search: 'search text' }));
        stateStub.restore();
    });

    it('handleSearchInput should call getUsers and update search state', () => {
        wrapper.setState({ search: 'searchy search' });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const getStub = sinon.stub(wrapper.instance(), 'getUsers');
        const e = { target: { value: '' } };
        wrapper.instance().handleSearchInput(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ search: '', page: 1 }));
        expect(getStub.calledOnce).toBe(true);
    });

    it('reverseMemberOrder should call getUsers and update order state', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const getStub = sinon.stub(wrapper.instance(), 'getUsers');
        const v = 'newValue';
        wrapper.instance().reverseMemberOrder(v);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ memberOrder: v, activeOrder: v, page: 1 })).toBe(true);
        expect(getStub.calledOnce).toBe(true);
    });

    it('reverseSharedOrder should update shareOrder and activeOrder', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const v = 'newValue';
        wrapper.instance().reverseSharedOrder(v);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sharedOrder: v, activeOrder: v }));
    });

    it('sortByShared should sort by selected', () => {
        const users = [...props.users];
        const expected = [...props.users];
        const selected = { user_one: 'READ' };
        const ret = wrapper.instance().sortByShared(users, selected, true);
        expect(ret).toEqual(expected);
    });

    it('sortByShared should sort by not selected', () => {
        const users = [...props.users];
        const expected = [...props.users].reverse();
        const selected = { user_one: 'READ' };
        const ret = wrapper.instance().sortByShared(users, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByShared should not change the order', () => {
        const users = [...props.users];
        const expected = [...props.users];
        const selected = { user_one: 'READ', user_two: 'READ' };
        const ret = wrapper.instance().sortByShared(users, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should sort by admin status', () => {
        const users = [...props.users];
        const expected = [...props.users];
        const selected = { user_one: 'ADMIN', user_two: 'READ' };
        const ret = wrapper.instance().sortByAdmin(users, selected, true);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should sort by no admin status', () => {
        const users = [...props.users];
        const expected = [...props.users].reverse();
        const selected = { user_one: 'ADMIN', user_two: 'READ' };
        const ret = wrapper.instance().sortByAdmin(users, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should not modify the order', () => {
        const users = [...props.users];
        const expected = [...props.users];
        const selected = { user_one: 'ADMIN', user_two: 'ADMIN' };
        const ret = wrapper.instance().sortByAdmin(users, selected, false);
        expect(ret).toEqual(expected);
    });
});
