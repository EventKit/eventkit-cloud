import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import SocialGroup from '@material-ui/icons/Group';
import Lock from '@material-ui/icons/LockOutlined';
import { DataPackGridItem } from '../../components/DataPackPage/DataPackGridItem';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';

function getRuns() {
    return [
        {
            uid: '6870234f-d876-467c-a332-65fdf0399a0d',
            user: 'admin',
            status: 'COMPLETED',
            job: {
                uid: '7643f806-1484-4446-b498-7ddaa65d011a',
                name: 'Test1',
                event: 'Test1 event',
                description: 'Test1 description',
                extent: {},
                permissions: {
                    value: 'PRIVATE',
                    groups: {},
                    members: {},
                },
            },
            provider_tasks: [],
            expiration: '2017-03-24T15:52:35.637258Z',
        },
        {
            uid: 'c7466114-8c0c-4160-8383-351414b11e37',
            user: 'notAdmin',
            status: 'COMPLETED',
            job: {
                uid: '5488a864-89f2-4e9c-8370-18291ecdae4a',
                name: 'Test2',
                event: 'Test2 event',
                description: 'Test2 description',
                extent: {},
                permissions: {
                    value: 'PUBLIC',
                    groups: {},
                    members: {},
                },
            },
            provider_tasks: [],
            expiration: '2017-03-24T15:52:29.311458Z',
        },
        {
            uid: '282816a6-7d16-4f59-a1a9-18764c6339d6',
            user: 'admin',
            status: 'COMPLETED',
            job: {
                uid: '78bbd59a-4066-4e30-8460-c7b0093a0d7a',
                name: 'Test3',
                event: 'Test3 event',
                description: 'Test3 description',
                extent: {},
                permissions: {
                    value: 'PUBLIC',
                    groups: {},
                    members: {},
                },
            },
            provider_tasks: [],
            expiration: '2017-03-24T15:52:18.796854Z',
        },
    ];
}

describe('DataPackGridItem component', () => {
    const getProps = () => ({
            run: getRuns()[0],
            userData: { user: { username: 'admin' } },
            users: [],
            groups: [],
            providers: [],
            onRunDelete: sinon.spy(),
            onRunShare: sinon.spy(),
            classes: {},
            ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    let initMap;

    const setup = (override = {}, options = {}) => {
        props = { ...getProps(), ...override };
        wrapper = shallow(<DataPackGridItem {...props} />, {
            context: {
                config: { BASEMAP_URL: '' },
            },
            disableLifecycleMethods: false,
            ...options
        });
        instance = wrapper.instance();
    };

    beforeAll(() => {
        initMap = sinon.stub(DataPackGridItem.prototype, 'initMap');
    });

    beforeEach(setup);

    it('should display general run information', () => {
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardContent)).toHaveLength(2);
        expect(wrapper.find(CardContent).first().html()).toContain('Test1 description');
        expect(wrapper.find(CardActions)).toHaveLength(1);
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(1);
    });

    it('should call initMap when component has mounted', () => {
        initMap.reset();
        instance.componentDidMount();
        expect(initMap.calledOnce).toBe(true);
    });

    it('should display information specific to a unpublished & owned run', () => {
        expect(wrapper.find(Lock)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').html()).toContain('My DataPack');
    });

    it('should display information specific to a published & owned run', () => {
        wrapper.setProps({ run: getRuns()[2] });
        expect(wrapper.find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').html()).toContain('My DataPack');
    });

    it('should display information specific to a published & not owned run', () => {
        wrapper.setProps({ run: getRuns()[1] });
        expect(wrapper.find(SocialGroup)).toHaveLength(1);
        expect(wrapper.find(CardActions).find('p').html()).toContain('notAdmin');
    });

    it('should not display a map when the card is not expanded', () => {
        const targetSpy = sinon.spy();
        instance.map = { setTarget: targetSpy };
        const updateSpy = sinon.spy(instance, 'componentDidUpdate');
        instance.initMap = sinon.spy();
        wrapper.setState({ expanded: false });
        expect(updateSpy.called).toBe(true);
        expect(targetSpy.calledOnce).toBe(true);
        expect(instance.map).toBe(null);
        expect(instance.initMap.called).toBe(false);
        updateSpy.restore();
    });

    it('toggleExpanded should set expanded state to its negatation', () => {
        expect(wrapper.state().expanded).toBe(true);
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleExpanded();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ expanded: false })).toBe(true);
        stateStub.restore();
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleProviderClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ providerDialogOpen: false })).toBe(true);
    });

    it('handleProviderOpen should close menu and set provider dialog to open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleProviderOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWithExactly({
            providerDialogOpen: true,
        })).toBe(true);
    });

    it('showDeleteDialog should close menu and set deleteDialogOpen to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.showDeleteDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWithExactly({
            deleteDialogOpen: true,
        }));
    });

    it('hideDeleteDialog should set deleteDialogOpen to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.hideDeleteDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ deleteDialogOpen: false }));
    });

    it('handleDelete should call hideDelete and onRunDelete', () => {
        const hideSpy = sinon.stub(instance, 'hideDeleteDialog');
        expect(props.onRunDelete.called).toBe(false);
        expect(hideSpy.called).toBe(false);
        instance.handleDelete();
        expect(hideSpy.calledOnce).toBe(true);
        expect(props.onRunDelete.calledOnce).toBe(true);
        expect(props.onRunDelete.calledWith(props.run.uid)).toBe(true);
    });

    it('handleShareOpen should close menu and open share dialog', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleShareOpen();
        expect(stateSpy.callCount).toBe(1);
        expect(stateSpy.calledWithExactly({
            shareDialogOpen: true,
        }));
        stateSpy.restore();
    });

    it('handleShareClose should close share dialog', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleShareClose();
        expect(stateSpy.callCount).toBe(1);
        expect(stateSpy.calledWithExactly({ shareDialogOpen: false }));
        stateSpy.restore();
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
