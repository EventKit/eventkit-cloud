import * as React from 'react';
import * as enzyme from 'enzyme';
import * as sinon from 'sinon';
import Joyride from 'react-joyride';
import Help from '@material-ui/icons/Help';
import PageHeader from '../../components/common/PageHeader';
import UserInfo from '../../components/AccountPage/UserInfo';
import LicenseInfo from '../../components/AccountPage/LicenseInfo';
import SaveButton from '../../components/AccountPage/SaveButton';
import CustomScrollbar from '../../components/CustomScrollbar';
import { Account, Props } from '../../components/AccountPage/Account';

describe('Account Component', () => {
    const getProps = (): Props => ({
        ...(global as any).eventkit_test_props,
        user: {
            data: {
                user: {
                    username: 'admin',
                    email: 'admin@admin.com',
                    date_joined: '2016-06-15T14:25:19Z',
                    last_login: '2016-06-15T14:25:19Z',
                },
                accepted_licenses: {
                    test1: false,
                    test2: false,
                },
            },
            status: {
                isLoading: false,
                patched: false,
                patching: false,
                error: null,
            },
        },
        licenses: {
            error: null,
            fetched: false,
            fetching: false,
            licenses: [
                { slug: 'test1', name: 'testname1', text: 'testtext1' },
                { slug: 'test2', name: 'testname2', text: 'textext2' },
            ],
        },
        getLicenses: sinon.spy(),
        patchUser: sinon.spy(),
        classes: { root: {} },
    });

    let wrapper;
    let props;
    let instance;
    const setup = (customProps = {}) => {
        props = { ...getProps(), ...customProps };
        wrapper = enzyme.shallow(<Account {...props} />);
        instance = wrapper.instance() as Account;
    };

    beforeEach(setup);

    it('should call joyrideAddSteps when mounted', () => {
        const joyrideSpy = sinon.spy(Account.prototype, 'joyrideAddSteps');
        const mountSpy = sinon.spy(Account.prototype, 'componentDidMount');
        setup();
        expect(mountSpy.calledOnce).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        joyrideSpy.restore();
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [{
            title: 'Welcome to the Account Settings Page',
            text: ' example text',
            selector: '.qa-PageHeader',
            position: 'top',
            style: {},
            isFixed: true,
        }];
        const stateSpy = sinon.stub(instance, 'setState');
        instance.joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ steps }));
        stateSpy.restore();
    });

    it('handleJoyride should set state', () => {
        const stateSpy = sinon.stub(instance, 'setState');
        instance.handleJoyride();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('callback function should stop tour if close is clicked', () => {
        const callbackData = {
            action: 'close',
            index: 2,
            step: {
                position: 'bottom',
                selector: '.qa-Application-MenuItem-create',
                style: {},
                text: 'Or to create your own DataPack.',
                title: 'Navigate Application',
            },
            type: 'step:before',
        };
        instance.joyride = { reset: sinon.spy() };
        const stateSpy = sinon.spy(instance, 'setState');
        instance.callback(callbackData);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('should render an header with save button, and body with license info and user info', () => {
        expect(wrapper.find(PageHeader)).toHaveLength(1);
        expect(wrapper.find(SaveButton)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(LicenseInfo)).toHaveLength(1);
        expect(wrapper.find(UserInfo)).toHaveLength(1);
        expect(wrapper.find(Joyride)).toHaveLength(1);
        expect(wrapper.find(Help)).toHaveLength(1);
    });

    it('should not render license info or or user info', () => {
        const p = getProps();
        p.user.data.user = {} as any;
        p.licenses.licenses = [];
        setup(p);
        wrapper.update();
        expect(wrapper.find(LicenseInfo)).toHaveLength(0);
        expect(wrapper.find(UserInfo)).toHaveLength(0);
    });

    it('should setState and call getLicenses when mounting', () => {
        const mountSpy = sinon.spy(Account.prototype, 'componentWillMount');
        const stateSpy = sinon.spy(Account.prototype, 'setState');
        setup();
        expect(mountSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ acceptedLicenses: props.user.data.accepted_licenses })).toBe(true);
        expect(props.getLicenses.calledOnce).toBe(true);
        mountSpy.restore();
        stateSpy.restore();
    });

    it('should update state and setTimeout when user has been patched', () => {
        jest.useFakeTimers();
        const stateSpy = sinon.spy(instance, 'setState');
        expect(stateSpy.calledWith({ showSavedMessage: true })).toBe(false);
        const nextProps = getProps();
        nextProps.user.status.patched = true;
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({ showSavedMessage: true })).toBe(true);
        expect(stateSpy.calledWith({ showSavedMessage: false })).toBe(false);
        jest.runAllTimers();
        expect(stateSpy.calledWith({ showSavedMessage: false })).toBe(true);
        expect((setTimeout as any).mock.calls.length).toBe(1);
        expect((setTimeout as any).mock.calls[0][1]).toBe(3000);
        stateSpy.restore();
    });

    it('handleCheck should marked the license as checked/unchecked and update state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(wrapper.state().acceptedLicenses).toEqual({ ...props.user.data.accepted_licenses });
        instance.handleCheck('test1', true);
        expect(stateSpy.calledWith({ acceptedLicenses: { ...props.user.data.accepted_licenses, test1: true } }));
        stateSpy.restore();
    });

    it('handleAll should check all as checked/unchecked and update the state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(wrapper.state().acceptedLicenses).toEqual({ ...props.user.data.accepted_licenses });
        instance.handleAll({}, true);
        expect(stateSpy.calledWith({ acceptedLicenses: { test1: true, test2: true } }));
        stateSpy.restore();
    });

    it('handleAll should not uncheck already agreed licenses', () => {
        const p = getProps();
        p.user.data.accepted_licenses.test1 = true;
        setup(p);
        const stateSpy = sinon.spy(instance, 'setState');
        expect(wrapper.state().acceptedLicenses).toEqual({ test1: true, test2: false });
        wrapper.setState({ acceptedLicenses: { test1: true, test2: true } });
        expect(wrapper.state().acceptedLicenses).toEqual({ test1: true, test2: true });
        instance.handleAll({}, false);
        expect(stateSpy.calledWith({ test1: true, test2: false }));
        stateSpy.restore();
    });

    it('handleSubmit should call patchUser', () => {
        expect(props.patchUser.notCalled).toBe(true);
        instance.handleSubmit();
        expect(props.patchUser.calledWith(wrapper.state().acceptedLicenses, props.user.data.user.username)).toBe(true);
    });
});
