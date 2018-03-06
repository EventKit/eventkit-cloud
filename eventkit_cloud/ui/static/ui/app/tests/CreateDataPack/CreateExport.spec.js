import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import initialState from '../../reducers/initialState';
import {fakeStore} from '../../__mocks__/fakeStore';
import {CreateExport} from '../../components/CreateDataPack/CreateExport';
import {BreadcrumbStepper} from '../../components/CreateDataPack/BreadcrumbStepper';
import AppBar from 'material-ui/AppBar';
import {ConfirmDialog} from '../../components/Dialog/ConfirmDialog';

describe('CreateExport component', () => {
    const muiTheme = getMuiTheme();

    function getProps() {
        return {
            aoiInfo: null,
            exportInfo: null,
            router: {
                push: () => {},
                setRouteLeaveHook: () => {},
            },
            routes: [],
        };
    }

    function getMountedWrapper(props = getProps()) {
        const store = fakeStore(initialState);
        return mount(<CreateExport { ...props }><div id='my-child-element'/></CreateExport>, {
            context: {muiTheme, store},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                store: React.PropTypes.object
            }
        });
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<CreateExport { ...props } />);
    }

    it('should render the elements', () => {
        // dont render the full component tree
        const content = BreadcrumbStepper.prototype.getStepContent;
        BreadcrumbStepper.prototype.getStepContent = () => {return <div/>};

        const wrapper = getMountedWrapper();
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(BreadcrumbStepper)).toHaveLength(1);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
        expect(wrapper.find('#my-child-element')).toHaveLength(1);

        // restore content function
        BreadcrumbStepper.prototype.getStepContent = content;
    });

    it('should set the modified flag when aoiInfo or exportInfo changes', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.state().modified).toBe(false);
        wrapper.setProps({ aoiInfo: {} });
        expect(wrapper.state().modified).toBe(true);
        wrapper.setState({ modified: false });
        wrapper.setProps({ exportInfo: {} });
        expect(wrapper.state().modified).toBe(true);
    });

    it('should set leave route and show leave warning dialog when navigating away with changes', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        wrapper.setState({ modified: true });
        instance.routeLeaveHook({ pathname: '/someRoute' });
        expect(instance.leaveRoute).toBe('/someRoute');
        expect(wrapper.state().showLeaveWarningDialog).toBe(true);
    });

    it('should not show leave warning dialog when finishing new datapack', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        wrapper.setState({ modified: true });
        expect(instance.routeLeaveHook({ pathname: '/status/12345' })).toBe(true);
        expect(instance.leaveRoute).toBe(null);
        expect(wrapper.state().showLeaveWarningDialog).toBe(false);
    });

    it('should hide leave warning dialog when clicking cancel', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        wrapper.setState({ showLeaveWarningDialog: true });
        instance.leaveRoute = '/someRoute';
        instance.handleLeaveWarningDialogCancel();
        expect(wrapper.state().showLeaveWarningDialog).toBe(false);
        expect(instance.leaveRoute).toBe(null);
    });

    it('should push the leave route when clicking confirm in leave warning dialog', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        instance.props.router.push = sinon.spy();
        instance.leaveRoute = '/someRoute';
        instance.handleLeaveWarningDialogConfirm();
        expect(instance.props.router.push.calledOnce).toBe(true);
        expect(instance.props.router.push.getCall(0).args[0]).toBe('/someRoute');
    });
});
