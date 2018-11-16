import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { DeleteNotificationsDialog } from '../../components/Dialog/DeleteNotificationsDialog';

describe('DeleteDataPackDialog component', () => {
    let shallow: any;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        show: true,
        onCancel: sinon.stub(),
        onDelete: sinon.stub(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => shallow(<DeleteNotificationsDialog {...props} />);

    it('should render a Dialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
    });

    it('should give the parent dialogs the delete actions and cancel function', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog).props().onClose).toEqual(props.onCancel);
        expect(wrapper.find(BaseDialog).props().actions).toHaveLength(2);
    });
});
