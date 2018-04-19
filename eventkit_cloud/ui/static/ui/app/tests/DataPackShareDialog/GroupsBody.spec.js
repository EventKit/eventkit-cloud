import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import CustomTextField from '../../components/CustomTextField';
import GroupRow from '../../components/DataPackShareDialog/GroupRow';
import GroupsHeaderRow from '../../components/DataPackShareDialog/GroupsHeaderRow';
import GroupBodyTooltip from '../../components/DataPackShareDialog/ShareBodyTooltip';
import GroupBody, { GroupsBody } from '../../components/DataPackShareDialog/GroupsBody';

describe('GroupBody component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
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
            selectedGroups: {},
            groupsText: 'Test text',
            onGroupsUpdate: () => {},
            canUpdateAdmin: false,
            handleShowShareInfo: () => {},
        }
    );

    const getWrapper = props => (
        mount(<GroupBody {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-GroupsBody-groupsText')).toHaveLength(1);
        expect(wrapper.find('.qa-GroupsBody-groupsText').text()).toEqual(props.groupsText);
        expect(wrapper.find(CustomTextField)).toHaveLength(1);
        expect(wrapper.find(GroupsHeaderRow)).toHaveLength(1);
        expect(wrapper.find(GroupRow)).toHaveLength(props.groups.length);
    });

    it('should sort groups by name', () => {
        const props = getProps();
        const sortSpy = sinon.spy(GroupsBody.prototype, 'sortByGroup');
        const wrapper = getWrapper(props);
        expect(sortSpy.calledOnce).toBe(true);
        sortSpy.restore();
    });

    it('should sort groups by admin-share', () => {
        const props = getProps();
        const sortSpy = sinon.spy(GroupsBody.prototype, 'sortByAdmin');
        const wrapper = getWrapper(props);
        wrapper.setState({ activeOrder: 'admin-shared' });
        expect(sortSpy.calledOnce).toBe(true);
        sortSpy.restore();
    });

    it('should sort groups by shared', () => {
        const props = getProps();
        const sortSpy = sinon.spy(GroupBody.prototype, 'sortByShared');
        const wrapper = getWrapper(props);
        wrapper.setState({ activeOrder: 'shared' });
        expect(sortSpy.calledOnce).toBe(true);
        sortSpy.restore();
    });

    it('should show shareInfo', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-GroupsBody-shareInfo')).toHaveLength(0);
        const nextProps = getProps();
        nextProps.canUpdateAdmin = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find('.qa-GroupsBody-shareInfo')).toHaveLength(1);
    });

    it('should render a tooltip', () => {
        const props = getProps();
        const stub = sinon.stub(GroupBodyTooltip.prototype, 'render').returns(null);
        const wrapper = getWrapper(props);
        wrapper.setState({ tooltip: { target: {}, admin: true } });
        expect(wrapper.find(GroupBodyTooltip)).toHaveLength(1);
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

    it('handleUncheckAll should call onGroupsUpdate with empty object', () => {
        const props = getProps();
        props.onGroupsUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleUncheckAll();
        expect(props.onGroupsUpdate.calledOnce).toBe(true);
        expect(props.onGroupsUpdate.calledWith({})).toBe(true);
    });

    it('handleUncheckAll should only uncheck from searched groups', () => {
        const props = getProps();
        props.selectedGroups = { group_one: 'READ', group_two: 'READ' };
        props.onGroupsUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ search: 'one' });
        wrapper.instance().handleUncheckAll();
        expect(props.onGroupsUpdate.calledOnce).toBe(true);
        expect(props.onGroupsUpdate.calledWith({ group_two: 'READ' })).toBe(true);
    });

    it('handleCheckAll should call onGroupsUpdate with all groups selected', () => {
        const props = getProps();
        props.onGroupsUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { group_one: 'READ', group_two: 'READ' };
        wrapper.instance().handleCheckAll();
        expect(props.onGroupsUpdate.calledOnce).toBe(true);
        expect(props.onGroupsUpdate.calledWith(expected)).toBe(true);
    });

    it('handleCheckAll should call onGroupsUpdate with all searched groups', () => {
        const props = getProps();
        props.onGroupsUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ search: 'one' });
        const expected = { group_one: 'READ' };
        wrapper.instance().handleCheckAll();
        expect(props.onGroupsUpdate.calledOnce).toBe(true);
        expect(props.onGroupsUpdate.calledWith(expected)).toBe(true);
    });

    it('handleCheck should call onGroupsUpdate with the target group removed', () => {
        const props = getProps();
        props.selectedGroups = { group_one: 'READ', group_two: 'READ' };
        props.onGroupsUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { group_two: 'READ' };
        wrapper.instance().handleCheck(props.groups[0]);
        expect(props.onGroupsUpdate.calledOnce).toBe(true);
        expect(props.onGroupsUpdate.calledWith(expected)).toBe(true);
    });

    it('handleCheck should call onGroupsUpdate with the target group added', () => {
        const props = getProps();
        props.selectedGroups = {};
        props.onGroupsUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { group_one: 'READ' };
        wrapper.instance().handleCheck(props.groups[0]);
        expect(props.onGroupsUpdate.calledOnce).toBe(true);
        expect(props.onGroupsUpdate.calledWith(expected)).toBe(true);
    });

    it('handleAdminCheck should demote ADMIN to READ and call onGroupsUpdate', () => {
        const props = getProps();
        props.selectedGroups = { group_one: 'ADMIN', group_two: 'ADMIN' };
        props.onGroupsUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { group_one: 'READ', group_two: 'ADMIN' };
        wrapper.instance().handleAdminCheck(props.groups[0]);
        expect(props.onGroupsUpdate.calledOnce).toBe(true);
        expect(props.onGroupsUpdate.calledWith(expected)).toBe(true);
    });

    it('handleAdminCheck should make group an ADMIN and call onGroupsUpdate', () => {
        const props = getProps();
        props.selectedGroups = { group_one: 'READ', group_two: 'READ' };
        props.onGroupsUpdate = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = { group_one: 'ADMIN', group_two: 'READ' };
        wrapper.instance().handleAdminCheck(props.groups[0]);
        expect(props.onGroupsUpdate.calledOnce).toBe(true);
        expect(props.onGroupsUpdate.calledWith(expected)).toBe(true);
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

    it('reverseGroupOrder should update groupOrder and activeOrder', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const v = 'newValue';
        wrapper.instance().reverseGroupOrder(v);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ groupOrder: v, activeOrder: v })).toBe(true);
        stateStub.restore();
    });

    it('reverseShareOrder should update shareOrder and activeOrder', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const v = 'newValue';
        wrapper.instance().reverseSharedOrder(v);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sharedOrder: v, activeOrder: v }));
    });

    it('searchGroups should filter by group names', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [groups[1]];
        const search = 'two';
        const ret = wrapper.instance().searchGroups(groups, search);
        expect(ret).toEqual(expected);
    });

    it('sortByGroup should sort by name A-Z', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [...props.groups];
        const ret = wrapper.instance().sortByGroup(groups, true);
        expect(ret).toEqual(expected);
    });

    it('sortByGroup should sort by name Z-A', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [...props.groups].reverse();
        const ret = wrapper.instance().sortByGroup(groups, false);
        expect(ret).toEqual(expected);
    });

    it('sortByGroup should not change the order', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [
            { group_one: 'READ', name: 'one' },
            { group_two: 'READ', name: 'one' },
            { group_three: 'READ', name: 'one' },
        ];
        const expected = [...groups];
        const ret = wrapper.instance().sortByGroup(groups, false);
        expect(ret).toEqual(expected);

        const ret2 = wrapper.instance().sortByGroup(groups, true);
        expect(ret2).toEqual(expected);
    });

    it('sortByShared should sort by selected', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [...props.groups];
        const selected = { group_one: 'READ' };
        const ret = wrapper.instance().sortByShared(groups, selected, true);
        expect(ret).toEqual(expected);
    });

    it('sortByShared should sort by not selected', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [...props.groups].reverse();
        const selected = { group_one: 'READ' };
        const ret = wrapper.instance().sortByShared(groups, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByShared should not change the order', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [...props.groups];
        const selected = { group_one: 'READ', group_two: 'READ' };
        const ret = wrapper.instance().sortByShared(groups, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should sort by admin status', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [...props.groups];
        const selected = { group_one: 'ADMIN', group_two: 'READ' };
        const ret = wrapper.instance().sortByAdmin(groups, selected, true);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should sort by no admin status', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [...props.groups].reverse();
        const selected = { group_one: 'ADMIN', group_two: 'READ' };
        const ret = wrapper.instance().sortByAdmin(groups, selected, false);
        expect(ret).toEqual(expected);
    });

    it('sortByAdmin should not modify the order', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const groups = [...props.groups];
        const expected = [...props.groups];
        const selected = { group_one: 'ADMIN', group_two: 'ADMIN' };
        const ret = wrapper.instance().sortByAdmin(groups, selected, false);
        expect(ret).toEqual(expected);
    });
});
