import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import CustomTextField from '../../components/CustomTextField';
import MembersHeaderRow from '../../components/DataPackShareDialog/MembersHeaderRow';
import MemberRow from '../../components/DataPackShareDialog/MemberRow';
import MembersBodyTooltip from '../../components/DataPackShareDialog/ShareBodyTooltip';
import MembersBody from '../../components/DataPackShareDialog/MembersBody';

describe('GroupBody component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
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
                    groups: [1, 2],
                },
            ],
            selectedMembers: {},
            membersText: 'Test text',
            onMembersUpdate: () => {},
            canUpdateAdmin: false,
            handleShowShareInfo: () => {},
        }
    );

    const getWrapper = props => (
        mount(<MembersBody {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-MembersBody-membersText')).toHaveLength(1);
        expect(wrapper.find('.qa-MembersBody-membersText').text()).toEqual(props.membersText);
        expect(wrapper.find(CustomTextField)).toHaveLength(1);
        expect(wrapper.find(MembersHeaderRow)).toHaveLength(1);
        expect(wrapper.find(MemberRow)).toHaveLength(props.members.length);
    });

    it('should sort members by name', () => {
        const props = getProps();
        const sortSpy = sinon.spy(MembersBody.prototype, 'sortByMember');
        const wrapper = getWrapper(props);
        expect(sortSpy.calledOnce).toBe(true);
        sortSpy.restore();
    });

    it('should sort members by admin-share', () => {
        const props = getProps();
        const sortSpy = sinon.spy(MembersBody.prototype, 'sortByAdmin');
        const wrapper = getWrapper(props);
        wrapper.setState({ activeOrder: 'admin-shared' });
        expect(sortSpy.calledOnce).toBe(true);
        sortSpy.restore();
    });

    it('should sort members by shared', () => {
        const props = getProps();
        const sortSpy = sinon.spy(MembersBody.prototype, 'sortByShared');
        const wrapper = getWrapper(props);
        wrapper.setState({ activeOrder: 'shared' });
        expect(sortSpy.calledOnce).toBe(true);
        sortSpy.restore();
    });

    it('should show shareInfo', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-MembersBody-shareInfo')).toHaveLength(0);
        const nextProps = getProps();
        nextProps.canUpdateAdmin = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find('.qa-MembersBody-shareInfo')).toHaveLength(1);
    });

    it('should render a tooltip', () => {
        const props = getProps();
        const stub = sinon.stub(MembersBodyTooltip.prototype, 'render').returns(null);
        const wrapper = getWrapper(props);
        wrapper.setState({ tooltip: { target: {}, admin: true } });
        expect(wrapper.find(MembersBodyTooltip)).toHaveLength(1);
        wrapper.unmount();
        stub.restore();
    });

    it('componentDidMount should add event listener', () => {
        const props = getProps();
        const addStub = sinon.stub(global.window, 'addEventListener');
        const wrapper = getWrapper(props);
        expect(addStub.called).toBe(true);
        expect(addStub.calledWith('wheel', wrapper.instance().handleScroll)).toBe(true);
        addStub.restore();
    });

    it('componentWillUnmount should remove event listener', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const removeStub = sinon.stub(global.window, 'removeEventListener');
        const fnc = wrapper.instance().handleScroll;
        wrapper.unmount();
        expect(removeStub.called).toBe(true);
        expect(removeStub.calledWith('wheel', fnc)).toBe(true);
        removeStub.restore();
    });

    it('handleUncheckAll should call onMembersUpdate with empty object', () => {
        const props = getProps();
        props.onMembersUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleUncheckAll();
        expect(props.onMembersUpdate.calledOnce).toBe(true);
        expect(props.onMembersUpdate.calledWith({})).toBe(true);
    });

    it('handleUncheckAll should only uncheck from searched members', () => {
        const props = getProps();
        props.selectedMembers = { user_one: 'READ', user_two: 'READ' };
        props.onMembersUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ search: 'one' });
        wrapper.instance().handleUncheckAll();
        expect(props.onMembersUpdate.calledOnce).toBe(true);
        expect(props.onMembersUpdate.calledWith({ user_two: 'READ' })).toBe(true);
    });

    it('handleCheckAll should call onMembersUpdate with all members selected', () => {
        const props = getProps();
        props.onMembersUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { user_one: 'READ', user_two: 'READ' };
        wrapper.instance().handleCheckAll();
        expect(props.onMembersUpdate.calledOnce).toBe(true);
        expect(props.onMembersUpdate.calledWith(expected)).toBe(true);
    });

    it('handleCheckAll should call onMembersUpdate with all searched members', () => {
        const props = getProps();
        props.onMembersUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ search: 'one' });
        const expected = { user_one: 'READ' };
        wrapper.instance().handleCheckAll();
        expect(props.onMembersUpdate.calledOnce).toBe(true);
        expect(props.onMembersUpdate.calledWith(expected)).toBe(true);
    });

    it('handleCheck should call onMembersUpdate with the target member removed', () => {
        const props = getProps();
        props.selectedMembers = { user_one: 'READ', user_two: 'READ' };
        props.onMembersUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { user_two: 'READ' };
        wrapper.instance().handleCheck(props.members[0]);
        expect(props.onMembersUpdate.calledOnce).toBe(true);
        expect(props.onMembersUpdate.calledWith(expected)).toBe(true);
    });

    it('handleCheck should call onMembersUpdate with the target member added', () => {
        const props = getProps();
        props.selectedMembers = {};
        props.onMembersUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { user_one: 'READ' };
        wrapper.instance().handleCheck(props.members[0]);
        expect(props.onMembersUpdate.calledOnce).toBe(true);
        expect(props.onMembersUpdate.calledWith(expected)).toBe(true);
    });

    it('handleAdminCheck should demote ADMIN to READ and call onMembersUpdate', () => {
        const props = getProps();
        props.selectedMembers = { user_one: 'ADMIN', user_two: 'ADMIN' };
        props.onMembersUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { user_one: 'READ', user_two: 'ADMIN' };
        wrapper.instance().handleAdminCheck(props.members[0]);
        expect(props.onMembersUpdate.calledOnce).toBe(true);
        expect(props.onMembersUpdate.calledWith(expected)).toBe(true);
    });

    it('handleAdminCheck should make group an ADMIN and call onMembersUpdate', () => {
        const props = getProps();
        props.selectedMembers = { user_one: 'READ', user_two: 'READ' };
        props.onMembersUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { user_one: 'ADMIN', user_two: 'READ' };
        wrapper.instance().handleAdminCheck(props.members[0]);
        expect(props.onMembersUpdate.calledOnce).toBe(true);
        expect(props.onMembersUpdate.calledWith(expected)).toBe(true);
    });

    it('handleAdminMouseOver should setState with tooltip', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const target = { key: 'value' };
        const admin = true;
        wrapper.instance().handleAdminMouseOver(target, admin);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ tooltip: { target, admin } })).toBe(true);
        stateStub.restore();
    });

    it('handleAdminMouseOut should clear the tooltip state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleAdminMouseOut();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ tooltip: { target: null, admin: false } })).toBe(true);
        stateStub.restore();
    });

    it('handleScroll should call handleAdminMouseOut if there is a tooltip', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const mouseStub = sinon.stub(wrapper.instance(), 'handleAdminMouseOut');
        wrapper.instance().render = sinon.stub().returns(null);
        wrapper.setState({ tooltip: { target: {}, admin: true } });
        wrapper.instance().handleScroll();
        expect(mouseStub.calledOnce).toBe(true);
        mouseStub.restore();
    });

    it('handleSearchInput should set state with target value', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const e = { target: { value: 'search text' } };
        wrapper.instance().handleSearchInput(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ search: 'search text'}));
        stateStub.restore();
    });

    it('reverseMemberOrder should update memberOrder and activeOrder', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const v = 'newValue';
        wrapper.instance().reverseMemberOrder(v);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ memberOrder: v, activeOrder: v })).toBe(true);
        stateStub.restore();
    });

    it('reverseSharedOrder should update shareOrder and activeOrder', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const v = 'newValue';
        wrapper.instance().reverseSharedOrder(v);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sharedOrder: v, activeOrder: v }));
    });

    it('searchMembers should filter by member username and email', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [members[1]];
        const search = 'two';
        const ret = wrapper.instance().searchMembers(members, search);
        expect(ret).toEqual(expected);
    });

    it('sortByMember should sort by name A-Z', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [...props.members];
        const ret = wrapper.instance().sortByMember(members, true);
        expect(ret).toEqual(expected);
    });

    it('sortByMember should sort by name Z-A', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [...props.members].reverse();
        const ret = wrapper.instance().sortByMember(members, false);
        expect(ret).toEqual(expected);
    });

    it('sortByMember should not change the order', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [
            { user: { username: 'one', other_key: 'one' } },
            { user: { username: 'one', other_key: 'two' } },
            { user: { username: 'one', other_key: 'three' } },
        ];
        const expected = [...members];
        const ret = wrapper.instance().sortByMember(members, false);
        expect(ret).toEqual(expected);

        const ret2 = wrapper.instance().sortByMember(members, true);
        expect(ret2).toEqual(expected);
    });

    it('sortByShared should sort by selected', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [...props.members];
        const selected = { user_one: 'READ' };
        const ret = wrapper.instance().sortByShared(members, selected, true);
        expect(ret).toEqual(expected);
    });

    it('sortByShared should sort by not selected', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [...props.members].reverse();
        const selected = { user_one: 'READ' };
        const ret = wrapper.instance().sortByShared(members, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByShared should not change the order', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [...props.members];
        const selected = { user_one: 'READ', user_two: 'READ' };
        const ret = wrapper.instance().sortByShared(members, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should sort by admin status', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [...props.members];
        const selected = { user_one: 'ADMIN', user_two: 'READ' };
        const ret = wrapper.instance().sortByAdmin(members, selected, true);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should sort by no admin status', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [...props.members].reverse();
        const selected = { user_one: 'ADMIN', user_two: 'READ' };
        const ret = wrapper.instance().sortByAdmin(members, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should not modify the order', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const members = [...props.members];
        const expected = [...props.members];
        const selected = { user_one: 'ADMIN', user_two: 'ADMIN' };
        const ret = wrapper.instance().sortByAdmin(members, selected, false);
        expect(ret).toEqual(expected);
    });
});
