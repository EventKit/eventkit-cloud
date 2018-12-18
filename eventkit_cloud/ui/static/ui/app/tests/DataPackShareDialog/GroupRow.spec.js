import React from 'react';
import sinon from 'sinon';
import axios from 'axios';
import { shallow } from 'enzyme';
import MockAdapter from 'axios-mock-adapter';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import GroupMemberRow from '../../components/DataPackShareDialog/GroupMemberRow';
import { GroupRow } from '../../components/DataPackShareDialog/GroupRow';

describe('GroupRow component', () => {
    const getProps = () => (
        {
            group: {
                id: 1,
                name: 'group_one',
                members: ['user_one', 'user_two'],
                administrators: ['user_one'],
            },
            selected: false,
            handleCheck: () => {},
            handleAdminCheck: () => {},
            handleAdminMouseOut: () => {},
            handleAdminMouseOver: () => {},
            showAdmin: false,
            admin: false,
            classes: {},
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<GroupRow {...props} />)
    );

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardContent)).toHaveLength(1);
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

    it('getMembers should make api request and return members', async () => {
        const props = getProps();
        const members = [{ name: 'john doe' }];
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet(`/api/groups/${props.group.id}/users`).reply(200, {
            members,
            name: 'mock group',
        });
        const wrapper = getWrapper(props);
        const m = await wrapper.instance().getMembers();
        expect(m).toEqual(members);
    });

    it('getMembers should handle a request error', async () => {
        const props = getProps();
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet(`/api/groups/${props.group.id}/users`).reply(400);
        const wrapper = getWrapper(props);
        const m = await wrapper.instance().getMembers();
        expect(m).toEqual([]);
    });

    it('loadMembers should set correct state', async () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const getStub = sinon.stub(wrapper.instance(), 'getMembers').returns(new Promise(resolve => resolve([])));
        await wrapper.instance().loadMembers();
        expect(stateStub.calledTwice).toBe(true);
        expect(stateStub.calledWith({ loadingMembers: true })).toBe(true);
        expect(stateStub.calledWith({ loadingMembers: false, membersFetched: true, members: [] })).toBe(true);
        expect(getStub.calledOnce).toBe(true);
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

    it('toggleExpaned should call loadMembers and reverse expanded state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const loadStub = sinon.stub(wrapper.instance(), 'loadMembers');
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleExpanded();
        expect(loadStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
    });

    it('toggleExpanded should set expanded to the opposite state and not call loadmembers', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ membersFetched: true });
        const state = wrapper.state().expanded;
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().toggleExpanded();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ expanded: !state })).toBe(true);
    });
});
