import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import MenuItem from '@material-ui/core/MenuItem';
import { Link, IndexLink } from 'react-router';
import Dashboard from '@material-ui/icons/Dashboard';
import AVLibraryBooks from '@material-ui/icons/LibraryBooks';
import ContentAddBox from '@material-ui/icons/AddBox';
import ActionInfoOutline from '@material-ui/icons/InfoOutlined';
import SocialPerson from '@material-ui/icons/Person';
import SocialGroup from '@material-ui/icons/Group';
import ActionExitToApp from '@material-ui/icons/ExitToApp';
import { Drawer } from '../components/Drawer';
import ConfirmDialog from '../components/Dialog/ConfirmDialog';

describe('Drawer component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        open: true,
        handleLogout: sinon.stub(),
        handleMenuItemClick: sinon.stub(),
        contactUrl: '',
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => shallow(<Drawer {...props} />);

    it('should render the basic elements', () => {
        const props = getProps();
        const drawer = getWrapper(props);
        expect(drawer.find(MenuItem)).toHaveLength(7);
        expect(drawer.find(MenuItem).at(0).html()).toContain('Dashboard');
        expect(drawer.find(MenuItem).at(0).find(Dashboard)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(0).find(IndexLink)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(1).html()).toContain('DataPack Library');
        expect(drawer.find(MenuItem).at(1).find(AVLibraryBooks)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(1).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(2).html()).toContain('Create DataPack');
        expect(drawer.find(MenuItem).at(2).find(ContentAddBox)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(2).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(3).html()).toContain('Members and Groups');
        expect(drawer.find(MenuItem).at(3).find(SocialGroup)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(3).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(4).html()).toContain('About EventKit');
        expect(drawer.find(MenuItem).at(4).find(ActionInfoOutline)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(4).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(5).html()).toContain('Account Settings');
        expect(drawer.find(MenuItem).at(5).find(SocialPerson)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(5).find(Link)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(6).html()).toContain('Log Out');
        expect(drawer.find(MenuItem).at(6).find(ActionExitToApp)).toHaveLength(1);
        expect(drawer.find(MenuItem).at(6).find(Link)).toHaveLength(1);
        expect(drawer.find(ConfirmDialog)).toHaveLength(1);
    });

    it('should render the contact url', () => {
        const props = getProps();
        props.contactUrl = 'test';
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-Drawer-contact')).toHaveLength(1);
    });

    it('handleLogoutClick should set showLogoutDialog to true', () => {
        const wrapper = getWrapper(getProps());
        expect(wrapper.state().showLogoutDialog).toBe(false);
        wrapper.instance().handleLogoutClick();
        expect(wrapper.state().showLogoutDialog).toBe(true);
    });

    it('handleLogoutDialogCancel should set showLogoutDialog to false', () => {
        const wrapper = getWrapper(getProps());
        wrapper.setState({
            showLogoutDialog: true,
        });
        wrapper.instance().handleLogoutDialogCancel();
        expect(wrapper.state().showLogoutDialog).toBe(false);
    });

    it('handleLogoutDialogConfirm() should set showLogoutDialog to false and call handleLogout', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({
            showLogoutDialog: true,
        });
        wrapper.instance().handleLogoutDialogConfirm();
        expect(wrapper.state().showLogoutDialog).toBe(false);
        expect(props.handleLogout.calledOnce).toBe(true);
    });
});
