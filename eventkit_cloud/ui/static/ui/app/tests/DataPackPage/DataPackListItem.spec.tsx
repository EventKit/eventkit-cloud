import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Card from '@material-ui/core/Card';
import { DataPackListItem } from '../../components/DataPackPage/DataPackListItem';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';

describe('DataPackListItem component', () => {
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
        provider_tasks: [],
        zipfile_url: 'http://cloud.eventkit.test/downloads/68/TestGPKG-WMTS-TestProject-eventkit-20170310.zip',
        expiration: '2017-03-24T15:52:35.637258Z',
    };

    const getProps = () => ({
        run,
        user: { data: { user: { username: 'admin' } } },
        users: [],
        groups: [],
        onRunDelete: sinon.spy(),
        onRunShare: sinon.spy(),
        providers: [],
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataPackListItem {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render a list item with complete and private icons and owner text', () => {
        expect(wrapper.find(Card)).toHaveLength(1);
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleProviderClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ providerDialogOpen: false })).toBe(true);
        stateStub.restore();
    });

    it('handleProviderOpen should close menu then set provider dialog to open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleProviderOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWithExactly({
            providerDialogOpen: true,
        })).toBe(true);
        stateStub.restore();
    });

    it('showDeleteDialog should close menu then set deleteDialogOpen to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.showDeleteDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWithExactly({
            deleteDialogOpen: true,
        }));
        stateStub.restore();
    });

    it('hideDeleteDialog should set deleteDialogOpen to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.hideDeleteDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ deleteDialogOpen: false }));
        stateStub.restore();
    });

    it('handleDelete should call hideDelete and onRunDelete', () => {
        const hideStub = sinon.stub(instance, 'hideDeleteDialog');
        expect(props.onRunDelete.called).toBe(false);
        expect(hideStub.called).toBe(false);
        instance.handleDelete();
        expect(hideStub.calledOnce).toBe(true);
        expect(props.onRunDelete.calledOnce).toBe(true);
        expect(props.onRunDelete.calledWith(props.run.uid)).toBe(true);
    });

    it('handleShareOpen should close menu and open share dialog', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleShareOpen();
        expect(stateStub.callCount).toBe(1);
        expect(stateStub.calledWithExactly({
            shareDialogOpen: true,
        }));
        stateStub.restore();
    });

    it('handleShareClose should close share dialog', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleShareClose();
        expect(stateStub.callCount).toBe(1);
        expect(stateStub.calledWithExactly({ shareDialogOpen: false }));
        stateStub.restore();
    });

    it('handleShareSave should close share dialog and call onRunShare with job id and permissions', () => {
        instance.handleShareClose = sinon.spy();
        const permissions = { some: 'permissions' };
        instance.handleShareSave(permissions);
        expect(instance.handleShareClose.callCount).toBe(1);
        expect(instance.props.onRunShare.callCount).toBe(1);
        expect(instance.props.onRunShare.calledWithExactly(instance.props.run.job.uid, permissions));
    });

    it('should set share dialog open prop with shareDialogOpen value', () => {
        expect(wrapper.state().shareDialogOpen).toBe(false);
        expect(wrapper.find(DataPackShareDialog).props().show).toBe(false);
        wrapper.setState({ shareDialogOpen: true });
        expect(wrapper.find(DataPackShareDialog).props().show).toBe(true);
    });
});
