import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import GroupMemberRow from '../../components/DataPackShareDialog/GroupMemberRow';
import GroupRow from '../../components/DataPackShareDialog/GroupRow';

describe('GroupRow component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            group: {
                id: 1,
                name: 'group_one',
                members: ['user_one', 'user_two'],
                administrators: ['user_one'],
            },
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
                },
            ],
            selected: false,
            handleCheck: () => {},
            handleAdminCheck: () => {},
            handleAdminMouseOut: () => {},
            handleAdminMouseOver: () => {},
            showAdmin: false,
            admin: false,
        }
    );

    const getWrapper = props => (
        mount(<GroupRow {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardText)).toHaveLength(0);
        wrapper.setState({ expanded: true });
        wrapper.update();
        expect(wrapper.find(CardText)).toHaveLength(1);
        expect(wrapper.find(GroupMemberRow)).toHaveLength(props.members.length);
    });

    it('onAdminMouseOver should call call handleAdminMouseOver', () => {
        const props = getProps();
        props.selected = true;
        props.handleAdminMouseOver = sinon.spy();
        const wrapper = getWrapper(props);
        const tooltip = { key: 'value' };
        wrapper.instance().tooltip = tooltip;
        wrapper.instance().onAdminMouseOver();
        expect(props.handleAdminMouseOver.calledOnce).toBe(true);
        expect(props.handleAdminMouseOver.calledWith(tooltip, props.admin)).toBe(true);
    });

    it('onAdminMouseOver should not call props.handleAdminMouseOver', () => {
        const props = getProps();
        props.selected = false;
        props.handleAdminMouseOver = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().onAdminMouseOver();
        expect(props.handleAdminMouseOver.called).toBe(false);
    });

    it('onAdminMouseOut should call handleAdminMouseOut', () => {
        const props = getProps();
        props.handleAdminMouseOut = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().onAdminMouseOut();
        expect(props.handleAdminMouseOut.calledOnce).toBe(true);
    });

    it('onKeyDown should call handleAdminCheck', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const checkStub = sinon.stub(wrapper.instance(), 'handleAdminCheck');
        const e = { which: 13 };
        wrapper.instance().onKeyDown(e);
        expect(checkStub.calledOnce).toBe(true);
        const e2 = { keyCode: 13 };
        wrapper.instance().onKeyDown(e2);
        expect(checkStub.calledTwice).toBe(true);
        checkStub.restore();
    });

    it('onKeyDown should not call handleAdminCheck', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const checkStub = sinon.stub(wrapper.instance(), 'handleAdminCheck');
        const e = { which: 12, keyCode: 12 };
        wrapper.instance().onKeyDown(e);
        expect(checkStub.called).toBe(false);
        checkStub.restore();
    });

    it('getGroupMembers should find all members for the group and sort by admin', () => {
        const props = getProps();
        const members = [
            { user: { username: 'user_one' } },
            { user: { username: 'user_two' } },
            { user: { username: 'user_three' } },
            { user: { username: 'user_four' } },
        ];
        const group = {
            id: 1,
            name: 'group_one',
            members: ['user_one', 'user_two', 'user_three', 'user_five'],
            administrators: ['user_two'],
        };
        const wrapper = getWrapper(props);
        const expected = [
            members[1],
            members[0],
            members[2],
        ];
        const ret = wrapper.instance().getGroupMembers(group, members);
        expect(ret).toEqual(expected);
    });

    it('handleAdminCheck should call props.handleAdminCheck', () => {
        const props = getProps();
        props.showAdmin = true;
        props.selected = true;
        props.handleAdminCheck = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleAdminCheck();
        expect(props.handleAdminCheck.calledOnce).toBe(true);
        expect(props.handleAdminCheck.calledWith(props.group)).toBe(true);
    });

    it('handleAdminCheck should not call props.handleAdminCheck', () => {
        const props = getProps();
        props.showAdmin = true;
        props.selected = false;
        props.handleAdminCheck = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleAdminCheck();
        expect(props.handleAdminCheck.called).toBe(false);
    });

    it('toggleExpanded should set expanded to the opposite state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const state = wrapper.state().expanded;
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleExpanded();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ expanded: !state })).toBe(true);
    });
});
