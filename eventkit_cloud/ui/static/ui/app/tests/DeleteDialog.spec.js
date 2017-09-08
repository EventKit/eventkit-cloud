import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import BaseDialog from '../components/BaseDialog';
import DeleteDialog from '../components/DeleteDialog';
import injectTapEventPlugin from 'react-tap-event-plugin';

describe('DeleteDialog component', () => {
    const getProps = () => {
        return {
            show: true,
            handleCancel: () => {},
            handleDelete: () => {},
        }
    };
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();

    const getWrapper = (props) => {
        return mount(<DeleteDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    };

    it('should render a Dialog inside a BaseDialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(Dialog)).toHaveLength(1);
    });

    it('should give the base dialog the delete actions and handle cancel function', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog).props().actions).toHaveLength(2);
        expect(wrapper.find(BaseDialog).props().actions[0].props.label).toEqual('Cancel');
        expect(wrapper.find(BaseDialog).props().actions[1].props.label).toEqual('Delete');
        expect(wrapper.find(BaseDialog).props().onClose).toEqual(props.handleCancel);
    });
});
