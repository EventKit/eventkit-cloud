import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Dialog from 'material-ui/Dialog';
import BaseDialog from '../../components/Dialog/BaseDialog';
import DeleteDataPackDialog from '../../components/Dialog/DeleteDataPackDialog';
import ConfirmDialog from '../../components/Dialog/ConfirmDialog';

describe('DeleteDataPackDialog component', () => {
    const getProps = () => ({
        show: true,
        onCancel: () => {},
        onDelete: () => {},
    });
    const muiTheme = getMuiTheme();

    const getWrapper = props => mount(<DeleteDataPackDialog {...props} />, {
        context: { muiTheme },
        childContextTypes: {
            muiTheme: PropTypes.object,
        },
    });

    it('should render a Dialog inside a BaseDialog inside a ConfirmDialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(Dialog)).toHaveLength(1);
    });

    it('should give the parent dialogs the delete actions and cancel function', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(ConfirmDialog).props().onCancel).toEqual(props.onCancel);
        expect(wrapper.find(ConfirmDialog).props().onConfirm).toEqual(props.onDelete);
        expect(wrapper.find(BaseDialog).props().actions).toHaveLength(2);
        expect(wrapper.find(BaseDialog).props().actions[0].props.label).toEqual('Cancel');
        expect(wrapper.find(BaseDialog).props().actions[1].props.label).toEqual('Delete');
        expect(wrapper.find(BaseDialog).props().onClose).toEqual(props.onCancel);
    });
});
