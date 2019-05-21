import * as React from 'react';
import * as sinon from 'sinon';
import axios from 'axios';
import { shallow } from 'enzyme';
import * as MockAdapter from 'axios-mock-adapter';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import { GroupRow } from '../../components/DataPackShareDialog/GroupRow';

describe('GroupRow component', () => {
    const getProps = () => ({
        group: {
            id: 1,
            name: 'group_one',
            members: ['user_one', 'user_two'],
            administrators: ['user_one'],
        },
        selected: false,
        handleCheck: sinon.spy(),
        handleAdminCheck: sinon.spy(),
        handleAdminMouseOut: sinon.spy(),
        handleAdminMouseOver: sinon.spy(),
        showAdmin: false,
        admin: false,
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;

    const setup = (params = {}, options = {}) => {
        props = { ...getProps(), ...params };
        wrapper = shallow(<GroupRow {...props} />, options);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic elements', () => {
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardContent)).toHaveLength(1);
    });

    it('onAdminMouseOver should call call handleAdminMouseOver', () => {
        wrapper.setProps({ selected: true });
        const tooltip = { key: 'value' };
        instance.tooltip = tooltip;
        instance.onAdminMouseOver();
        expect(props.handleAdminMouseOver.calledOnce).toBe(true);
        expect(props.handleAdminMouseOver.calledWith(tooltip, props.admin)).toBe(true);
    });

    it('onAdminMouseOver should not call props.handleAdminMouseOver', () => {
        wrapper.setProps({ selected: false });
        instance.onAdminMouseOver();
        expect(props.handleAdminMouseOver.called).toBe(false);
    });

    it('onAdminMouseOut should call handleAdminMouseOut', () => {
        instance.onAdminMouseOut();
        expect(props.handleAdminMouseOut.calledOnce).toBe(true);
    });

    it('onKeyDown should call handleAdminCheck', () => {
        const checkStub = sinon.stub(instance, 'handleAdminCheck');
        const e = { which: 13 };
        instance.onKeyDown(e);
        expect(checkStub.calledOnce).toBe(true);
        const e2 = { keyCode: 13 };
        instance.onKeyDown(e2);
        expect(checkStub.calledTwice).toBe(true);
        checkStub.restore();
    });

    it('onKeyDown should not call handleAdminCheck', () => {
        const checkStub = sinon.stub(instance, 'handleAdminCheck');
        const e = { which: 12, keyCode: 12 };
        instance.onKeyDown(e);
        expect(checkStub.called).toBe(false);
        checkStub.restore();
    });

    it('getMembers should make api request and return members', async () => {
        const members = [{ name: 'john doe' }];
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet(`/api/groups/${props.group.id}/users`).reply(200, {
            members,
            name: 'mock group',
        });
        const m = await instance.getMembers();
        expect(m).toEqual(members);
    });

    it('getMembers should handle a request error', async () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet(`/api/groups/${props.group.id}/users`).reply(400);
        const m = await instance.getMembers();
        expect(m).toEqual([]);
    });

    it('loadMembers should set correct state', async () => {
        const stateStub = sinon.stub(instance, 'setState');
        const getStub = sinon.stub(instance, 'getMembers').returns(new Promise(resolve => resolve([])));
        await instance.loadMembers();
        expect(stateStub.calledTwice).toBe(true);
        expect(stateStub.calledWith({ loadingMembers: true })).toBe(true);
        expect(stateStub.calledWith({ loadingMembers: false, membersFetched: true, members: [] })).toBe(true);
        expect(getStub.calledOnce).toBe(true);
    });

    it('handleAdminCheck should call props.handleAdminCheck', () => {
        wrapper.setProps({ showAdmin: true, selected: true });
        instance.handleAdminCheck();
        expect(props.handleAdminCheck.calledOnce).toBe(true);
        expect(props.handleAdminCheck.calledWith(props.group)).toBe(true);
    });

    it('handleAdminCheck should not call props.handleAdminCheck', () => {
        wrapper.setProps({ showAdmin: true, selected: false });
        instance.handleAdminCheck();
        expect(props.handleAdminCheck.called).toBe(false);
    });

    it('toggleExpaned should call loadMembers and reverse expanded state', () => {
        const loadStub = sinon.stub(instance, 'loadMembers');
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleExpanded();
        expect(loadStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
    });

    it('toggleExpanded should set expanded to the opposite state and not call loadmembers', () => {
        wrapper.setState({ membersFetched: true });
        const state = wrapper.state().expanded;
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleExpanded();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ expanded: !state })).toBe(true);
    });
});
