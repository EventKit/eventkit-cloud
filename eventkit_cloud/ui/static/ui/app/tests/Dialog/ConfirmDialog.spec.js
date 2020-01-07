import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { ConfirmDialog } from '../../components/Dialog/ConfirmDialog';

describe('ConfirmDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        onCancel: sinon.spy(),
        onConfirm: sinon.spy(),
        show: true,
        title: 'test',
        ...global.eventkit_test_props,
    });

    const getWrapper = props => shallow(<ConfirmDialog {...props} />);

    it('should render a Dialog inside a BaseDialog inside a ConfirmDialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
    });

    it('should give the parent dialogs the close function', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog).props().onClose).toEqual(props.onCancel);
    });

    it('should render waring color for destructive action', () => {
        const props = getProps();
        props.isDestructive = true;
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog).props().actions[0].props.style.color).toEqual('#ce4427');
    });
});
