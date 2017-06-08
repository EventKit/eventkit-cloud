import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {fakeStore} from '../../__mocks__/fakeStore';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {LoginPage} from '../../components/auth/LoginPage';
import LoginForm from '../../containers/loginContainer';
import CustomScrollbar from '../../components/CustomScrollbar';
import Paper from 'material-ui/Paper';

describe('LoginPage component', () => {
    const muiTheme = getMuiTheme();
    const store = fakeStore({});

    const getWrapper = () => {
        return mount(<LoginPage/>, {
            context: {muiTheme, store},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                store: React.PropTypes.object
            }
        });
    }

    it('should render just the login paper', () => {
        const wrapper = getWrapper();
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
    });

    it('should render a login paper and disclaimer paper', () => {
        const wrapper = getWrapper();
        const state = {disclaimer: 'This is a disclaimer'};
        wrapper.setState(state);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(2);
        expect(wrapper.find(Paper)).toHaveLength(2);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
        expect(wrapper.find(Paper).last().find('strong').text()).toEqual('ATTENTION');
        expect(wrapper.find(CustomScrollbar).last().childAt(0).childAt(1).text()).toEqual('This is a disclaimer');
    });

    it('should call getDisclaimer and add event listener when mounting', () => {
        const mountSpy = new sinon.spy(LoginPage.prototype, 'componentDidMount');
        const getSpy = new sinon.spy(LoginPage.prototype, 'getDisclaimer');
        const eventSpy = new sinon.spy(window, 'addEventListener');
        const wrapper = getWrapper();
        const screenSizeUpdate = wrapper.instance().screenSizeUpdate;
        expect(mountSpy.calledOnce).toBe(true);
        expect(getSpy.calledOnce).toBe(true);
        expect(eventSpy.calledOnce).toBe(true);
        expect(eventSpy.calledWith('resize', screenSizeUpdate)).toBe(true);
        mountSpy.restore();
        getSpy.restore();
        eventSpy.restore();
    });

    it('should remove event listener on unmount', () => {
        const unmountSpy = new sinon.spy(LoginPage.prototype, 'componentWillUnmount');
        const eventSpy = new sinon.spy(window, 'removeEventListener');
        const wrapper = getWrapper();
        const screenSizeUpdate = wrapper.instance().screenSizeUpdate;
        wrapper.unmount();
        expect(unmountSpy.calledOnce).toBe(true);
        expect(eventSpy.calledOnce).toBe(true);
        expect(eventSpy.calledWith('resize', screenSizeUpdate)).toBe(true);
        unmountSpy.restore();
        eventSpy.restore();
    });

    it('screenSizeUpdate should forceUpdate', () => {
        const spy = new sinon.spy(LoginPage.prototype, 'forceUpdate');
        const wrapper = shallow(<LoginPage/>);
        wrapper.instance().screenSizeUpdate();
        expect(spy.calledOnce).toBe(true);
        spy.restore();
    });

    it('getDisclaimer updates state', async () => {
        const mock = new MockAdapter(axios, {delayResponse: 100});
        mock.onGet('/disclaimer').reply(200, 'disclaimer text');
        const stateSpy = new sinon.spy(LoginPage.prototype, 'setState');
        const wrapper = shallow(<LoginPage/>);
        expect(wrapper.state().disclaimer).toEqual('');
        await wrapper.instance().getDisclaimer();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({disclaimer: 'disclaimer text'})).toBe(true);
        expect(wrapper.state().disclaimer).toEqual('disclaimer text');
        stateSpy.restore();
    });

    it('getDisclaimer will not update state if no response data', async () => {
        const mock = new MockAdapter(axios, {delayResponse: 100});
        mock.onGet('/disclaimer').reply(200, null);
        const stateSpy = new sinon.spy(LoginPage.prototype, 'setState');
        const wrapper = shallow(<LoginPage/>);
        expect(wrapper.state().disclaimer).toEqual('');
        await wrapper.instance().getDisclaimer();
        expect(stateSpy.notCalled).toBe(true);
        expect(wrapper.state().disclaimer).toEqual('');
        stateSpy.restore();
    });
});
