import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Button from '@material-ui/core/Button';
import BaseDialog from '../../components/Dialog/BaseDialog';
import DeleteDataPackDialog from '../../components/Dialog/DeleteDataPackDialog';
import { DataPackOptions } from '../../components/StatusDownloadPage/DataPackOptions';

describe('DataPackOptions component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => (
        {
            rerunDisabled: false,
            onRerun: () => {},
            onClone: () => {},
            onDelete: () => {},
            dataPack: {
                uid: '12345',
                job: {
                    uid: '67890',
                },
                provider_tasks: [
                    { slug: 'test1', display: true },
                    { slug: 'test2', display: false },
                ],
            },
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<DataPackOptions {...props} />)
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Button)).toHaveLength(3);
        expect(wrapper.find(BaseDialog)).toHaveLength(2);
        expect(wrapper.find(DeleteDataPackDialog)).toHaveLength(1);
    });

    it('handleDeleteOpen should set the delete dialog to open', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateStub.called).toBe(false);
        wrapper.instance().handleDeleteOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showDeleteDialog: true })).toBe(true);
        stateStub.restore();
    });

    it('handleDeleteClose should set the delete dialog to closed', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateStub.called).toBe(false);
        wrapper.instance().handleDeleteClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showDeleteDialog: false })).toBe(true);
        stateStub.restore();
    });

    it('handleRerunOpen should set rerun dialog to open', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateStub.called).toBe(false);
        wrapper.instance().handleRerunOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showRerunDialog: true })).toBe(true);
        stateStub.restore();
    });

    it('handleRerunClose should set the rerun dialog to closed', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateStub.called).toBe(false);
        wrapper.instance().handleRerunClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showRerunDialog: false })).toBe(true);
        stateStub.restore();
    });

    it('handleCloneOpen should set clone dialog to open', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateStub.called).toBe(false);
        wrapper.instance().handleCloneOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showCloneDialog: true })).toBe(true);
        stateStub.restore();
    });

    it('handleCloneClose should set the clone dialog to closed', () => {
        const props = getProps();
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateStub.called).toBe(false);
        wrapper.instance().handleCloneClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showCloneDialog: false })).toBe(true);
        stateStub.restore();
    });

    it('handleDelete should delete a job', () => {
        const props = getProps();
        props.onDelete = sinon.stub();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        wrapper.instance().handleDelete();
        expect(props.onDelete.calledOnce).toBe(true);
        expect(props.onDelete.calledWith(props.dataPack.uid)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showDeleteDialog: false })).toBe(true);
        stateStub.restore();
    });

    it('handleRerun should re-run a run with the correct data', () => {
        const props = getProps();
        props.onRerun = sinon.stub();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        wrapper.instance().handleRerun();
        expect(props.onRerun.calledOnce).toBe(true);
        expect(props.onRerun.calledWith(props.dataPack.job.uid)).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showRerunDialog: false })).toBe(true);
        stateStub.restore();
    });

    it('handleClone should clone a job with the correct data', () => {
        const props = getProps();
        props.onClone = sinon.stub();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(DataPackOptions.prototype, 'setState');
        wrapper.instance().handleClone();
        expect(props.onClone.calledOnce).toBe(true);
        expect(props.onClone.calledWith(props.dataPack, [props.dataPack.provider_tasks[0]])).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showCloneDialog: false })).toBe(true);
        stateStub.restore();
    });
});
