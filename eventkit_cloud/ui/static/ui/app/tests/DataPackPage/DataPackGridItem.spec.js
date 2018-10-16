import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import SocialGroup from '@material-ui/icons/Group';
import Lock from '@material-ui/icons/LockOutlined';
import { DataPackGridItem } from '../../components/DataPackPage/DataPackGridItem';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';

const tasks = [{
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
}];

const providerTasks = [{
    name: 'OpenStreetMap Data (Themes)',
    status: 'COMPLETED',
    display: true,
    slug: 'osm',
    tasks,
    uid: 'e261d619-2a02-4ba5-a58c-be0908f97d04',
    url: 'http://cloud.eventkit.test/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04',
}];

const providers = [{
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
}];

function getRuns() {
    return [
        {
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
        },
        {
            uid: 'c7466114-8c0c-4160-8383-351414b11e37',
            url: 'http://cloud.eventkit.test/api/runs/c7466114-8c0c-4160-8383-351414b11e37',
            started_at: '2017-03-10T15:52:29.311523Z',
            finished_at: '2017-03-10T15:52:33.612Z',
            duration: '0:00:04.301278',
            user: 'notAdmin',
            status: 'COMPLETED',
            job: {
                uid: '5488a864-89f2-4e9c-8370-18291ecdae4a',
                name: 'Test2',
                event: 'Test2 event',
                description: 'Test2 description',
                url: 'http://cloud.eventkit.test/api/jobs/5488a864-89f2-4e9c-8370-18291ecdae4a',
                extent: {},
                permissions: {
                    value: 'PUBLIC',
                    groups: {},
                    members: {},
                },
            },
            provider_tasks: providerTasks,
            zipfile_url: 'http://cloud.eventkit.test/downloads/c7/TestGPKG-WMS-TestProject-eventkit-20170310.zip',
            expiration: '2017-03-24T15:52:29.311458Z',
        },
        {
            uid: '282816a6-7d16-4f59-a1a9-18764c6339d6',
            url: 'http://cloud.eventkit.test/api/runs/282816a6-7d16-4f59-a1a9-18764c6339d6',
            started_at: '2017-03-10T15:52:18.796929Z',
            finished_at: '2017-03-10T15:52:27.500Z',
            duration: '0:00:08.703092',
            user: 'admin',
            status: 'COMPLETED',
            job: {
                uid: '78bbd59a-4066-4e30-8460-c7b0093a0d7a',
                name: 'Test3',
                event: 'Test3 event',
                description: 'Test3 description',
                url: 'http://cloud.eventkit.test/api/jobs/78bbd59a-4066-4e30-8460-c7b0093a0d7a',
                extent: {},
                permissions: {
                    value: 'PUBLIC',
                    groups: {},
                    members: {},
                },
            },
            provider_tasks: providerTasks,
            zipfile_url: 'http://cloud.eventkit.test/downloads/28/TestGPKG-OSM-CLIP-TestProject-eventkit-20170310.zip',
            expiration: '2017-03-24T15:52:18.796854Z',
        },
    ];
}

beforeAll(() => {
    sinon.stub(DataPackGridItem.prototype, 'initMap');
});

afterAll(() => {
    DataPackGridItem.prototype.initMap.restore();
});

const getWrapper = props => (
    shallow(<DataPackGridItem {...props} />)
);

describe('DataPackGridItem component', () => {
    const getProps = () => (
        {
            run: getRuns()[0],
            userData: { user: { username: 'admin' } },
            users: [],
            groups: [],
            providers,
            onRunDelete: () => {},
            onRunShare: sinon.spy(),
            classes: {},
            ...global.eventkit_test_props,
        }
    );

    it('should display general run information', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardContent)).toHaveLength(2);
        expect(wrapper.find(CardContent).first().html()).toContain('Test1 description');
        expect(wrapper.find(CardActions)).toHaveLength(1);
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(1);
    });

    it('should call initMap when component has mounted', () => {
        const props = getProps();
        const mountSpy = sinon.spy(DataPackGridItem.prototype, 'componentDidMount');
        DataPackGridItem.prototype.initMap.reset();
        getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(DataPackGridItem.prototype.initMap.calledOnce).toBe(true);
        mountSpy.restore();
    });

    it('should display information specific to a unpublished & owned run', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Lock)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').html()).toContain('My DataPack');
    });

    it('should display information specific to a published & owned run', () => {
        const props = getProps();
        [, , props.run] = getRuns();
        const wrapper = getWrapper(props);
        expect(wrapper.find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').html()).toContain('My DataPack');
    });

    it('should display information specific to a published & not owned run', () => {
        const props = getProps();
        [, props.run] = getRuns();
        const wrapper = getWrapper(props);
        expect(wrapper.find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').html()).toContain('notAdmin');
    });


    it('should not display a map when the card is not expanded', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const targetSpy = sinon.spy();
        wrapper.instance().map = { setTarget: targetSpy };
        const updateSpy = sinon.spy(DataPackGridItem.prototype, 'componentDidUpdate');
        wrapper.instance().initMap = sinon.spy();
        wrapper.setState({ expanded: false });
        expect(updateSpy.called).toBe(true);
        expect(targetSpy.calledOnce).toBe(true);
        expect(wrapper.instance().map).toBe(null);
        expect(wrapper.instance().initMap.called).toBe(false);
        updateSpy.restore();
    });

    it('toggleExpanded should set expanded state to its negatation', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.state().expanded).toBe(true);
        const stateSpy = sinon.spy(DataPackGridItem.prototype, 'setState');
        wrapper.instance().toggleExpanded();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ expanded: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const props = getProps();
        const stateSpy = sinon.spy(DataPackGridItem.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ providerDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleProviderOpen should close menu and set provider dialog to open', () => {
        const props = getProps();
        props.providers = providers;
        const stateSpy = sinon.spy(DataPackGridItem.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderOpen(props.run.provider_tasks);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWithExactly({
            providerDescs: {
                'OpenStreetMap Data (Themes)': 'OpenStreetMap vector data.',
            },
            providerDialogOpen: true,
        })).toBe(true);
        stateSpy.restore();
    });

    it('showDeleteDialog should close menu and set deleteDialogOpen to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.spy(DataPackGridItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().showDeleteDialog();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWithExactly({
            deleteDialogOpen: true,
        }));
        stateSpy.restore();
    });

    it('hideDeleteDialog should set deleteDialogOpen to false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.spy(DataPackGridItem.prototype, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().hideDeleteDialog();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ deleteDialogOpen: false }));
        stateSpy.restore();
    });

    it('handleDelete should call hideDelete and onRunDelete', () => {
        const props = getProps();
        props.onRunDelete = sinon.spy();
        const hideSpy = sinon.spy(DataPackGridItem.prototype, 'hideDeleteDialog');
        const wrapper = getWrapper(props);
        expect(props.onRunDelete.called).toBe(false);
        expect(hideSpy.called).toBe(false);
        wrapper.instance().handleDelete();
        expect(hideSpy.calledOnce).toBe(true);
        expect(props.onRunDelete.calledOnce).toBe(true);
        expect(props.onRunDelete.calledWith(props.run.uid)).toBe(true);
    });

    it('handleShareOpen should close menu and open share dialog', () => {
        const wrapper = getWrapper(getProps());
        const stateSpy = sinon.spy(DataPackGridItem.prototype, 'setState');
        wrapper.instance().handleShareOpen();
        expect(stateSpy.callCount).toBe(1);
        expect(stateSpy.calledWithExactly({
            shareDialogOpen: true,
        }));
        stateSpy.restore();
    });

    it('handleShareClose should close share dialog', () => {
        const wrapper = getWrapper(getProps());
        const stateSpy = sinon.spy(DataPackGridItem.prototype, 'setState');
        wrapper.instance().handleShareClose();
        expect(stateSpy.callCount).toBe(1);
        expect(stateSpy.calledWithExactly({ shareDialogOpen: false }));
        stateSpy.restore();
    });

    it('handleShareSave should close share dialog and call onRunShare with job id and permissions', () => {
        const wrapper = getWrapper(getProps());
        const instance = wrapper.instance();
        instance.handleShareClose = sinon.spy();
        const permissions = { some: 'permissions' };
        instance.handleShareSave(permissions);
        expect(instance.handleShareClose.callCount).toBe(1);
        expect(instance.props.onRunShare.callCount).toBe(1);
        expect(instance.props.onRunShare.calledWithExactly(instance.props.run.job.uid, permissions));
    });

    it('should set share dialog open prop with shareDialogOpen value', () => {
        const wrapper = getWrapper(getProps());
        expect(wrapper.state().shareDialogOpen).toBe(false);
        expect(wrapper.find(DataPackShareDialog).props().show).toBe(false);
        wrapper.setState({ shareDialogOpen: true });
        expect(wrapper.find(DataPackShareDialog).props().show).toBe(true);
    });
});
