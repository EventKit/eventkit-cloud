import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Divider from '@material-ui/core/Divider';
import Warning from '@material-ui/icons/Warning';
import { TaskError } from '../../components/StatusDownloadPage/TaskError';
import BaseDialog from '../../components/Dialog/BaseDialog';

describe('TaskError component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        task: {
            uid: '1975da4d-9580-4fa8-8a4b-c1ef6e2f7553',
            url: 'http://cloud.eventkit.test/api/tasks/1975da4d-9580-4fa8-8a4b-c1ef6e2f7553',
            name: 'OSM Data (.gpkg)',
            status: 'CANCELED',
            progress: 0,
            estimated_finish: null,
            started_at: null,
            finished_at: null,
            duration: null,
            result: null,
            errors: [
                {
                    exception: 'OpenStreetMap Data (Themes) was canceled by admin.',
                },
            ],
            display: true,
        },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}, options = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<TaskError {...props} />, {
            ...options,
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render UI elements', () => {
        expect(wrapper.find('.qa-TaskError-error-text').text()).toEqual('ERROR');
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
    });

    it('handleTaskErrorOpen should set task error dialog to open', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleTaskErrorOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ taskErrorDialogOpen: true })).toBe(true);
        expect(wrapper.find(Warning)).toHaveLength(1);
        expect(wrapper.find(Divider)).toHaveLength(1);
        expect(wrapper.find('.qa-TaskError-div-errorData').childAt(1).text()).toEqual(props.task.errors[0].exception);
        stateSpy.restore();
        stateSpy.restore();
    });

    it('handleTaskErrorClose should set task error dialog to close', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleTaskErrorClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ taskErrorDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });

    it('should call handleTaskErrorOpen when the error link is clicked. ', () => {
        const errorSpy = sinon.stub(TaskError.prototype, 'handleTaskErrorOpen');
        setup();
        expect(errorSpy.notCalled).toBe(true);
        wrapper.find('.qa-TaskError-error-text').simulate('click');
        expect(errorSpy.calledOnce).toBe(true);
        errorSpy.restore();
    });
});
