import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { shallow, mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Link } from 'react-router';
import { TableRow, TableRowColumn } from 'material-ui/Table';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import AlertError from '@material-ui/icons/Error';
import Lock from '@material-ui/icons/LockOutlined';
import SocialGroup from '@material-ui/icons/Group';
import NavigationMoreVert from '@material-ui/icons/MoreVert';
import NavigationCheck from '@material-ui/icons/Check';
import NotificationSync from '@material-ui/icons/Sync';
import DataPackTableItem from '../../components/DataPackPage/DataPackTableItem';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';

describe('DataPackTableItem component', () => {
    const providers = [
        {
            id: 2,
            model_url: 'http://cloud.eventkit.test/api/providers/osm',
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            preview_url: '',
            service_copyright: '',
            service_description: 'OpenStreetMap vector data.',
            layer: null,
            level_from: 0,
            level_to: 10,
            zip: false,
            display: true,
            export_provider_type: 2,
        },
    ];

    const tasks = [
        {
            duration: '0:00:15.317672',
            errors: [],
            estimated_finish: '',
            finished_at: '2017-05-15T15:29:04.356182Z',
            name: 'OverpassQuery',
            progress: 100,
            started_at: '2017-05-15T15:28:49.038510Z',
            status: 'SUCCESS',
            uid: 'fcfcd526-8949-4c26-a669-a2cf6bae1e34',
            result: {
                size: '1.234 MB',
                url: 'http://cloud.eventkit.test/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34',
            },
            display: true,
        },
    ];

    const providerTasks = [{
        name: 'OpenStreetMap Data (Themes)',
        status: 'COMPLETED',
        display: true,
        slug: 'osm',
        tasks,
        uid: 'e261d619-2a02-4ba5-a58c-be0908f97d04',
        url: 'http://cloud.eventkit.test/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04',
    }];
    const run = {
        uid: '6870234f-d876-467c-a332-65fdf0399a0d',
        url: 'http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d',
        started_at: '2017-03-10T15:52:35.637331Z',
        finished_at: '2017-03-10T15:52:39.837Z',
        duration: '0:00:04.199825',
        user: 'admin',
        status: 'COMPLETED',
        job: {
            uid: '7643f806-1484-4446-b498-7ddaa65d011a',
            name: 'Test1',
            event: 'Test1 event',
            description: 'Test1 description',
            url: 'http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a',
            extent: {},
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
        },
        provider_tasks: providerTasks,
        zipfile_url: 'http://cloud.eventkit.test/downloads/68/TestGPKG-WMTS-TestProject-eventkit-20170310.zip',
        expiration: '2017-03-24T15:52:35.637258Z',
    };

    const muiTheme = getMuiTheme();
    const getProps = () => ({
        run,
        user: { data: { user: { username: 'admin' } } },
        users: [],
        groups: [],
        onRunDelete: () => {},
        onRunShare: sinon.spy(),
        providers,
        adminPermissions: true,
    });

    const getWrapperMount = (props) => {
        const wrapper = mount(<DataPackTableItem {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        wrapper.instance().iconMenu = { setState: sinon.spy() };
        return wrapper;
    };

    const getWrapperShallow = (props) => {
        const wrapper = shallow(<DataPackTableItem {...props} />);
        wrapper.instance().iconMenu = { setState: sinon.spy() };
        return wrapper;
    };

    it('should render a table row with the correct table columns', () => {
        const props = getProps();
        const wrapper = getWrapperMount(props);
        expect(wrapper.find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn)).toHaveLength(8);
        expect(wrapper.find(Link)).toHaveLength(1);
        expect(wrapper.find(Link).props().to).toEqual(`/status/${run.job.uid}`);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(NavigationMoreVert)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(0).text()).toEqual(run.job.name);
        expect(wrapper.find(TableRowColumn).at(1).text()).toEqual(run.job.event);
        expect(wrapper.find(TableRowColumn).at(2).text()).toEqual('3/10/17');
        expect(wrapper.find(TableRowColumn).at(3).find(NavigationCheck)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(4).find(Lock)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(5).text()).toEqual('My DataPack');
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(1);
    });

    it('should render differently when props change', () => {
        const props = getProps();
        const wrapper = getWrapperMount(props);
        props.run.user = 'Not Admin';
        props.run.job.permissions.value = 'PUBLIC';
        props.run.status = 'INCOMPLETE';
        wrapper.setProps(props);
        expect(wrapper.find(TableRowColumn).at(3).find(AlertError)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(4).find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn).at(5).text()).toEqual('Not Admin');
        props.run.status = 'SUBMITTED';
        wrapper.setProps(props);
        expect(wrapper.find(TableRowColumn).at(3).find(NotificationSync)).toHaveLength(1);
    });

    it('getOwnerText should return "My DataPack" if run user and logged in user match, else return run user', () => {
        const props = getProps();
        props.run.user = 'admin';
        const wrapper = getWrapperShallow(props);
        let text = wrapper.instance().getOwnerText(run, 'not the admin user');
        expect(text).toEqual('admin');
        text = wrapper.instance().getOwnerText(run, 'admin');
        expect(text).toEqual('My DataPack');
    });

    it('getPermissionsIcon should return either Group or Person', () => {
        const props = getProps();
        const wrapper = getWrapperShallow(props);
        let icon = wrapper.instance().getPermissionsIcon('SHARED');
        expect(icon).toEqual(<SocialGroup className="qa-DataPackTableItem-SocialGroup" style={{ color: 'bcdfbb' }} />);
        icon = wrapper.instance().getPermissionsIcon('PRIVATE');
        expect(icon).toEqual(<Lock className="qa-DataPackTableItem-Lock" style={{ color: 'grey' }} />);
    });

    it('getStatusIcon should return either a Sync, Error, or Check icon depending on job status', () => {
        const props = getProps();
        const wrapper = getWrapperShallow(props);
        let icon = wrapper.instance().getStatusIcon('SUBMITTED');
        expect(icon).toEqual(<NotificationSync className="qa-DataPackTableItem-NotificationSync" style={{ color: '#f4d225' }} />);
        icon = wrapper.instance().getStatusIcon('INCOMPLETE');
        expect(icon).toEqual((
            <AlertError
                className="qa-DataPackTableItem-AlertError"
                style={{ color: '#ce4427', opacity: '0.6', height: '22px' }}
            />
        ));
        icon = wrapper.instance().getStatusIcon('COMPLETED');
        expect(icon).toEqual((
            <NavigationCheck
                className="qa-DataPackTableItem-NavigationCheck"
                style={{ color: '#bcdfbb', height: '22px' }}
            />
        ));
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const props = getProps();
        const wrapper = getWrapperShallow(props);
        const stateSpy = sinon.spy(DataPackTableItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleProviderOpen should close menu then set provider dialog to open', () => {
        const props = getProps();
        const wrapper = getWrapperShallow(props);
        const stateSpy = sinon.spy(DataPackTableItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderOpen(props.run.provider_tasks);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWithExactly({
            menuOpen: false,
            providerDescs: {
                'OpenStreetMap Data (Themes)': 'OpenStreetMap vector data.',
            },
            providerDialogOpen: true,
        })).toBe(true);
        stateSpy.restore();
    });

    it('showDeleteDialog should close menu then set deleteDialogOpen to true', () => {
        const props = getProps();
        const wrapper = getWrapperShallow(props);
        const stateSpy = sinon.spy(DataPackTableItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().showDeleteDialog();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWithExactly({
            menuOpen: false,
            deleteDialogOpen: true,
        }));
        stateSpy.restore();
    });

    it('hideDeleteDialog should set deleteDialogOpen to false', () => {
        const props = getProps();
        const wrapper = getWrapperShallow(props);
        const stateSpy = sinon.spy(DataPackTableItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().hideDeleteDialog();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ deleteDialogOpen: false }));
        stateSpy.restore();
    });

    it('handleDelete should call hideDelete and onRunDelete', () => {
        const props = getProps();
        props.onRunDelete = sinon.spy();
        const hideSpy = sinon.spy(DataPackTableItem.prototype, 'hideDeleteDialog');
        const wrapper = getWrapperShallow(props);
        expect(props.onRunDelete.called).toBe(false);
        expect(hideSpy.called).toBe(false);
        wrapper.instance().handleDelete();
        expect(hideSpy.calledOnce).toBe(true);
        expect(props.onRunDelete.calledOnce).toBe(true);
        expect(props.onRunDelete.calledWith(props.run.uid)).toBe(true);
    });

    it('handleShareOpen should close menu and open share dialog', () => {
        const wrapper = getWrapperShallow(getProps());
        const stateSpy = sinon.spy(DataPackTableItem.prototype, 'setState');
        wrapper.instance().handleShareOpen();
        expect(stateSpy.callCount).toBe(1);
        expect(stateSpy.calledWithExactly({
            menuOpen: false,
            shareDialogOpen: true,
        }));
        stateSpy.restore();
    });

    it('handleShareClose should close share dialog', () => {
        const wrapper = getWrapperShallow(getProps());
        const stateSpy = sinon.spy(DataPackTableItem.prototype, 'setState');
        wrapper.instance().handleShareClose();
        expect(stateSpy.callCount).toBe(1);
        expect(stateSpy.calledWithExactly({ shareDialogOpen: false }));
        stateSpy.restore();
    });

    it('handleShareSave should close share dialog and call onRunShare with job id and permissions', () => {
        const wrapper = getWrapperShallow(getProps());
        const instance = wrapper.instance();
        instance.handleShareClose = sinon.spy();
        const permissions = { some: 'permissions' };
        instance.handleShareSave(permissions);
        expect(instance.handleShareClose.callCount).toBe(1);
        expect(instance.props.onRunShare.callCount).toBe(1);
        expect(instance.props.onRunShare.calledWithExactly(instance.props.run.job.uid, permissions));
    });

    it('should set menu open prop with menuOpen value', () => {
        const wrapper = getWrapperMount(getProps());
        expect(wrapper.state().menuOpen).toBe(false);
        expect(wrapper.find(IconMenu).props().open).toBe(false);
        wrapper.setState({ menuOpen: true });
        expect(wrapper.find(IconMenu).props().open).toBe(true);
    });

    it('should set share dialog open prop with shareDialogOpen value', () => {
        const wrapper = getWrapperMount(getProps());
        expect(wrapper.state().shareDialogOpen).toBe(false);
        expect(wrapper.find(DataPackShareDialog).props().show).toBe(false);
        wrapper.setState({ shareDialogOpen: true });
        expect(wrapper.find(DataPackShareDialog).props().show).toBe(true);
    });
});
