import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import AppBar from 'material-ui/AppBar';
import UserInfo from '../../components/AccountPage/UserInfo';
import Warning from '../../components/AccountPage/Warning';
import LicenseInfo from '../../components/AccountPage/LicenseInfo';
import SaveButton from '../../components/AccountPage/SaveButton';
import CustomScrollbar from '../../components/CustomScrollbar';
import {Account} from '../../components/AccountPage/Account';

import isEqual from 'lodash/isEqual';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('Account Component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    const getProps = () => {
        return {
            user: {
                data: {
                    user: {
                        username: 'admin', 
                        email: 'admin@admin.com', 
                        date_joined: '2016-06-15T14:25:19Z', 
                        last_login: '2016-06-15T14:25:19Z'
                    },
                    accepted_licenses: {
                        test1: false, 
                        test2: false
                    }
                },
                isLoading: false,
                patched: false,
                patching: false,
                error: null
            },
            licenses: {
                error: null,
                fetched: false,
                fetching: false,
                licenses: [
                    {slug: 'test1', name: 'testname1', text: 'testtext1'},
                    {slug: 'test2', name: 'testname2', text: 'textext2'}
                ]
            },
            getLicenses: () => {},
            patchUser: () => {},
        }
    };

    const getMountedWrapper = (props) => {
        return mount(<Account {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    };

    it('should render an appbar with save button, and body with license info and user info', () => {
        let props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(AppBar).text()).toEqual('AccountSave Changes');
        expect(wrapper.find(SaveButton)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(LicenseInfo)).toHaveLength(1);
        expect(wrapper.find(UserInfo)).toHaveLength(1);
    });

    it('should not render license info or or user info', () => {
        let props = getProps();
        props.user.data.user = {};
        props.licenses.licenses = [];
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(LicenseInfo)).toHaveLength(0);
        expect(wrapper.find(UserInfo)).toHaveLength(0);
    });

    it('should setState and call getLicenses when mounting', () => {
        let props = getProps();
        props.getLicenses = new sinon.spy();
        const mountSpy = new sinon.spy(Account.prototype, 'componentWillMount');
        const stateSpy = new sinon.spy(Account.prototype, 'setState');
        const wrapper = getMountedWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({acceptedLicenses: props.user.data.accepted_licenses})).toBe(true);
        expect(props.getLicenses.calledOnce).toBe(true);
        mountSpy.restore();
        stateSpy.restore();
    });

    it('should update state and setTimeout when user has been patched', () => {
        jest.useFakeTimers();
        let props = getProps();
        const stateSpy = new sinon.spy(Account.prototype, 'setState');
        const wrapper = getMountedWrapper(props);
        expect(stateSpy.calledWith({showSavedMessage: true})).toBe(false);
        let nextProps = getProps();
        nextProps.user.patched = true;
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({showSavedMessage: true})).toBe(true);
        expect(stateSpy.calledWith({showSavedMessage: false})).toBe(false);
        jest.runAllTimers();
        expect(stateSpy.calledWith({showSavedMessage: false})).toBe(true);
        expect(setTimeout.mock.calls.length).toBe(1);
        expect(setTimeout.mock.calls[0][1]).toBe(3000);
        stateSpy.restore();
    });

    it('handleCheck should marked the license as checked/unchecked and update state', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(Account.prototype, 'setState');
        const wrapper = getMountedWrapper(props);
        expect(wrapper.state().acceptedLicenses).toEqual({...props.user.data.accepted_licenses});
        wrapper.instance().handleCheck('test1', true);
        expect(stateSpy.calledWith({acceptedLicenses: {...props.user.data.accepted_licenses, test1: true}}));
        stateSpy.restore();
    });

    it('handleAll should check all as checked/unchecked and update the state', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(Account.prototype, 'setState');
        const wrapper = getMountedWrapper(props);
        expect(wrapper.state().acceptedLicenses).toEqual({...props.user.data.accepted_licenses});
        wrapper.instance().handleAll({}, true);
        expect(stateSpy.calledWith({acceptedLicenses: {test1: true, test2: true}}));
        stateSpy.restore();
    });

    it('handleAll should not uncheck already agreed licenses', () => {
        let props = getProps();
        props.user.data.accepted_licenses.test1 = true;
        const stateSpy = new sinon.spy(Account.prototype, 'setState');
        const wrapper = getMountedWrapper(props);
        expect(wrapper.state().acceptedLicenses).toEqual({test1: true, test2: false});
        wrapper.setState({acceptedLicenses: {test1: true, test2: true}});
        expect(wrapper.state().acceptedLicenses).toEqual({test1: true, test2: true});
        wrapper.instance().handleAll({}, false);
        expect(stateSpy.calledWith({test1: true, test2: false}));
        stateSpy.restore();
    });

    it('handleSubmit should call patchUser', () => {
        let props = getProps();
        props.patchUser = new sinon.spy();
        const wrapper = getMountedWrapper(props);
        expect(props.patchUser.notCalled).toBe(true);
        wrapper.instance().handleSubmit();
        expect(props.patchUser.calledWith(wrapper.state().acceptedLicenses, props.user.data.user.username)).toBe(true);
    });
});
