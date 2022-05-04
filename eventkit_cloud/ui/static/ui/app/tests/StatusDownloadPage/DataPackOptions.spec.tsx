import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Button from '@mui/material/Button';
import BaseDialog from '../../components/Dialog/BaseDialog';
import DeleteDataPackDialog from '../../components/Dialog/DeleteDataPackDialog';
import {DataPackOptions} from '../../components/StatusDownloadPage/DataPackOptions';

describe('DataPackOptions component', () => {

    const providers = [{
        uid: '123',
        slug: 'test1',
        name: 'test1',
        display: true,
        max_selection: '10000',
        type: 'wmts',
        service_description: 'test description',
        license: {
            text: 'test license text',
            name: 'test license',
        },
        level_from: 0,
        level_to: 10,
        supported_formats: [{
            uid: '135',
            name: 'tested_name',
            slug: 'gpkg',
            description: 'tested_description'
        }]
    }];

    const getProps = () => ({
        rerunDisabled: false,
        onRerun: sinon.spy(),
        onClone: sinon.spy(),
        onDelete: sinon.spy(),
        dataPack: {
            uid: '12345',
            job: {
                uid: '67890',
            },
            provider_tasks: [
                {slug: 'test1', name: 'test1', display: true, provider: providers[0]},
                {
                    slug: 'test2',
                    name: 'test2',
                    display: false,
                    provider: {
                        ...providers[0], slug: 'test2',
                    },
                },
            ],
        },
        job: {
            uid: '67890',
            name: 'test',
            event: 'test',
            description: 'test',
            url: 'http://cloud.eventkit.test/api/jobs/67890',
            formats: [
                'gpkg',
            ],
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
            provider_tasks: [{
                provider: 'test1',
                formats: [
                    'gpkg',
                ],
                min_zoom: 0,
                max_zoom: 3,
            }]
        },
        providers,
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = {...getProps(), ...overrides};
        wrapper = shallow(<DataPackOptions {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);
    it('should render the basic components', () => {
        expect(wrapper.find(Button)).toHaveLength(3);
        expect(wrapper.find(BaseDialog)).toHaveLength(2);
        expect(wrapper.find(DeleteDataPackDialog)).toHaveLength(1);
    });

    it('handleDeleteOpen should set the delete dialog to open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleDeleteOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showDeleteDialog: true})).toBe(true);
        stateStub.restore();
    });

    it('handleDeleteClose should set the delete dialog to closed', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleDeleteClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showDeleteDialog: false})).toBe(true);
        stateStub.restore();
    });

    it('handleRerunOpen should set rerun dialog to open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleRerunOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showRerunDialog: true})).toBe(true);
        stateStub.restore();
    });

    it('handleRerunClose should set the rerun dialog to closed', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleRerunClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showRerunDialog: false})).toBe(true);
        stateStub.restore();
    });

    it('handleCloneOpen should set clone dialog to open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleCloneOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showCloneDialog: true})).toBe(true);
        stateStub.restore();
    });

    it('handleCloneClose should set the clone dialog to closed', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(stateStub.called).toBe(false);
        instance.handleCloneClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showCloneDialog: false})).toBe(true);
        stateStub.restore();
    });

    it('handleDelete should delete a job', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleDelete();
        expect(props.onDelete.calledOnce).toBe(true);
        expect(props.onDelete.calledWith(props.dataPack.uid)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showDeleteDialog: false})).toBe(true);
        stateStub.restore();
    });

    it('handleRerun should re-run a run with the correct data', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleRerun();
        expect(props.onRerun.calledOnce).toBe(true);
        expect(props.onRerun.calledWith(props.dataPack.job.uid)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showRerunDialog: false})).toBe(true);
        stateStub.restore();
    });

    it('handleClone should clone a job with the correct data', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const exportInfo = {
            'test1': {
                minZoom: 0,
                maxZoom: 3,
                formats: ['gpkg'],
            }
        };

        instance.handleClone();
        expect(props.onClone.calledOnce).toBe(true);
        expect(props.onClone.calledWith(props.dataPack, [props.providers[0]], exportInfo)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({showCloneDialog: false})).toBe(true);
        stateStub.restore();
    });
});