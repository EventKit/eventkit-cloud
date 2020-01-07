import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import { DeleteDataPackDialog } from '../../components/Dialog/DeleteDataPackDialog';
import ConfirmDialog from '../../components/Dialog/ConfirmDialog';

describe('DeleteDataPackDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        onCancel: sinon.spy(),
        onDelete: sinon.spy(),
        show: true,
        ...global.eventkit_test_props,
    });

    const getWrapper = props => shallow(<DeleteDataPackDialog {...props} />);

    it('should render a Dialog inside a BaseDialog inside a ConfirmDialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
    });

    it('should give the parent dialogs the delete actions and cancel function', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(ConfirmDialog).props().onCancel).toEqual(props.onCancel);
        expect(wrapper.find(ConfirmDialog).props().onConfirm).toEqual(props.onDelete);
    });
});
