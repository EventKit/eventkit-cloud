import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import LinearProgress from '@material-ui/core/LinearProgress';
import ArrowDown from '@material-ui/icons/KeyboardArrowDown';
import Warning from '@material-ui/icons/Warning';
import Check from '@material-ui/icons/Check';
import CloudDownload from '@material-ui/icons/CloudDownload';
import IconMenu from '../../components/common/IconMenu';
import ProviderError from '../../components/StatusDownloadPage/ProviderError';
import TaskError from '../../components/StatusDownloadPage/TaskError';
import BaseDialog from '../../components/Dialog/BaseDialog';
import LicenseRow from '../../components/StatusDownloadPage/LicenseRow';
import { ProviderRow } from '../../components/StatusDownloadPage/ProviderRow';

describe('ProviderRow component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const selectedProviders = {
        123: true,
        456: false,
    };

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
            uid: '123',
            result: {
                file: 'osm.pkg',
                size: '1.234 MB',
                url: 'http://cloud.eventkit.test/api/tasks/123',
            },
            display: true,
        },
    ];

    const providers = [
        {
            id: 2,
            model_url: 'http://cloud.eventkit.test/api/providers/osm',
            type: 'osm',
            license: {
                slug: 'osm',
                name: 'Open Database License (ODbL) v1.0',
                text: 'ODC Open Database License (ODbL).',
            },
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            preview_url: '',
            service_copyright: '',
            service_description: 'provider description',
            layer: null,
            level_from: 0,
            level_to: 10,
            zip: false,
            display: true,
            export_provider_type: 2,
        },
    ];

    const getProps = () => ({
        provider: {
            name: 'OpenStreetMap Data (Themes)',
            status: 'COMPLETED',
            tasks,
            uid: '123',
            url: 'http://cloud.eventkit.test/api/provider_tasks/123',
            display: true,
            slug: 'osm',
        },
        selectedProviders,
        providers,
        backgroundColor: 'white',
        onSelectionToggle: sinon.spy(),
        onProviderCancel: sinon.spy(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => (
        shallow(<ProviderRow {...props} />)
    );

    it('should render elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Table)).toHaveLength(1);
        expect(wrapper.find(TableHead)).toHaveLength(1);
        expect(wrapper.find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableCell)).toHaveLength(5);
        expect(wrapper.find(ArrowDown)).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(IconButton).find(ArrowDown)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(2);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
    });

    it('should render the cancel menu item if the task is pending/running and the cancel menu item should call onProviderCancel', () => {
        const props = { ...getProps() };
        props.provider.status = 'PENDING';
        props.onProviderCancel = sinon.spy();
        const wrapper = getWrapper(props);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
    });

    it('should render the task rows when the table is open', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ openTable: true });
        expect(wrapper.find(Table)).toHaveLength(2);
        expect(wrapper.find(TableHead)).toHaveLength(1);
        expect(wrapper.find(TableRow)).toHaveLength(2);
        expect(wrapper.find(TableCell)).toHaveLength(11);
        expect(wrapper.find(TableBody)).toHaveLength(1);
        expect(wrapper.find(LicenseRow)).toHaveLength(1);
    });

    it('Cancel MenuItem should call onProviderCancel with uid', () => {
        const props = getProps();
        props.onProviderCancel = sinon.spy();
        const wrapper = shallow(<ProviderRow {...props} />);
        wrapper.find(IconMenu).childAt(0).simulate('click');
        expect(props.onProviderCancel.calledOnce).toBe(true);
        expect(props.onProviderCancel.calledWith(props.provider.uid)).toBe(true);
    });

    it('View source MenuItem should call handleProviderOpen', () => {
        const props = getProps();
        const handleStub = sinon.stub(ProviderRow.prototype, 'handleProviderOpen');
        const wrapper = shallow(<ProviderRow {...props} />);
        wrapper.find(IconMenu).childAt(1).simulate('click');
        expect(handleStub.calledOnce).toBe(true);
        handleStub.restore();
    });

    it('getTaskDownloadIcon should return an icon that calls handleSingleDownload', () => {
        const props = getProps();
        const downloadStub = sinon.stub(ProviderRow.prototype, 'handleSingleDownload');
        const wrapper = getWrapper(props);
        wrapper.setState({ openTable: true });
        wrapper.find(CloudDownload).simulate('click');
        expect(downloadStub.calledOnce).toBe(true);
        downloadStub.restore();
    });

    it('componentWillMount should set selectedRows', () => {
        const props = getProps();
        const stateSpy = sinon.spy(ProviderRow.prototype, 'setState');
        getWrapper(props);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ selectedRows: { 123: false } })).toBe(true);
        stateSpy.restore();
    });

    it('componentDidUpdate should handle summing up the file sizes', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.provider.status = 'some new status';
        const fileSize = 1.234;
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({ fileSize: fileSize.toFixed(3) })).toBe(true);
        stateSpy.restore();
    });

    it('getFileSize should return null if no file size', () => {
        const wrapper = getWrapper(getProps());
        const ts = [{ result: null }, { result: null }];
        expect(wrapper.instance().getFileSize(ts)).toBe(null);
    });

    it('getTaskStatus should be called with the correct status from a given task', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        props.provider.tasks[0].status = 'SUCCESS';
        expect(wrapper.instance().getTaskStatus(props.provider.tasks[0])).toEqual((
            <Check
                className="qa-ProviderRow-Check-taskStatus"
                style={{ fill: '#55ba63', verticalAlign: 'middle', marginBottom: '2px' }}
            />
        ));
        props.provider.tasks[0].status = 'FAILED';
        expect(wrapper.instance().getTaskStatus(props.provider.tasks[0])).toEqual((
            <TaskError task={props.provider.tasks[0]} />
        ));
        props.provider.tasks[0].status = 'PENDING';
        expect(wrapper.instance().getTaskStatus(props.provider.tasks[0])).toEqual('WAITING');
        props.provider.tasks[0].status = 'RUNNING';
        expect(wrapper.instance().getTaskStatus({ status: 'RUNNING', progress: 100 })).toEqual((
            <span className="qa-ProviderRow-span-taskStatus">
                <LinearProgress variant="determinate" value={100} />
                {''}
            </span>
        ));
        expect(wrapper.instance().getTaskStatus({ status: 'CANCELED' })).toEqual((
            <Warning
                className="qa-ProviderRow-Warning-taskStatus"
                style={{
                    marginLeft: '10px',
                    fill: '#f4d225',
                    verticalAlign: 'bottom',
                }}
            />
        ));
        expect(wrapper.instance().getTaskStatus({ status: '' })).toEqual('');
    });

    it('getProviderStatus should be called with the correct icon from a given provider status', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        props.provider.status = 'COMPLETED';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual((
            <Check
                className="qa-ProviderRow-Check-providerStatus"
                style={{ fill: '#55ba63', verticalAlign: 'middle', marginBottom: '2px' }}
            />
        ));
        props.provider.status = 'INCOMPLETE';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual((
            <ProviderError provider={props.provider} key={props.provider.uid} />
        ));
        props.provider.status = 'PENDING';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual('WAITING');
        props.provider.status = 'RUNNING';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual('IN PROGRESS');
        props.provider.status = 'CANCELED';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual((
            <span
                className="qa-ProviderRow-span-providerStatus"
                style={{
                    fontWeight: 'bold',
                    borderTopWidth: '10px',
                    borderBottomWidth: '10px',
                    borderLeftWidth: '10px',
                    color: '#f4d225',
                }}
            >
                CANCELED
                <Warning
                    className="qa-ProviderRow-Warning-providerStatus"
                    style={{
                        marginLeft: '10px',
                        fill: '#f4d225',
                        verticalAlign: 'bottom',
                    }}
                />
            </span>
        ));
        expect(wrapper.instance().getProviderStatus('')).toEqual('');
    });

    it('getTaskLink should return a "span" element', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const task = { result: {}, name: 'test name' };
        const link = wrapper.instance().getTaskLink(task);
        const elem = shallow(link);
        expect(elem.is('span')).toBe(true);
        expect(elem.text()).toEqual('test name');
    });

    it('getTaskLink should return a "span" element with click handler', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const task = { result: { url: 'test-url.io' }, name: 'test name' };
        const link = wrapper.instance().getTaskLink(task);
        wrapper.instance().handleSingleDownload = sinon.spy();
        const elem = shallow(link);
        expect(elem.is('span')).toBe(true);
        expect(elem.text()).toEqual('test name');
        elem.simulate('click');
        expect(wrapper.instance().handleSingleDownload.calledOnce).toBe(true);
        expect(wrapper.instance().handleSingleDownload.calledWith('test-url.io')).toBe(true);
    });

    it('getTaskDownloadIcon should return a disabled icon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const task = { result: {} };
        const icon = wrapper.instance().getTaskDownloadIcon(task);
        expect(icon.props.onClick).toBe(undefined);
    });

    it('getTaskDownloadIcon should return a icon with click handler', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const task = { result: { url: 'test-url.io' } };
        const icon = wrapper.instance().getTaskDownloadIcon(task);
        expect(icon.props.onClick).not.toBe(undefined);
    });

    it('handleProviderOpen should set provider dialog to open', () => {
        const props = getProps();
        const wrapper = shallow(<ProviderRow {...props} />);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().handleProviderOpen();
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({ providerDesc: 'provider description', providerDialogOpen: true })).toBe(true);
        wrapper.update();
        expect(wrapper.find(BaseDialog).childAt(0).text()).toEqual('provider description');
        stateSpy.restore();
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const props = getProps();
        const wrapper = shallow(<ProviderRow {...props} />);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().handleProviderClose();
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({ providerDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleToggle should open/close Table', () => {
        const props = getProps();
        const stateSpy = sinon.spy(ProviderRow.prototype, 'setState');
        const handleSpy = sinon.spy(ProviderRow.prototype, 'handleToggle');
        const wrapper = getWrapper(props);
        wrapper.setState({ openTable: false });
        wrapper.instance().handleToggle();
        expect(handleSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ openTable: true })).toBe(true);
        handleSpy.restore();
        stateSpy.restore();
    });

    it('handleSingleDownload should open a url in a different window', () => {
        const openSpy = sinon.spy();
        window.open = openSpy;
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().handleSingleDownload();
        expect(openSpy.calledOnce).toBe(true);
    });
});
