import React from 'react';
import { mount } from 'enzyme';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import sinon from "sinon";

describe('BaseDialog component', () => {
    const getProps = () => ({
        onClose: sinon.spy(),
        show: true,
        title: '',
        ...global.eventkit_test_props,
    });

    const getWrapper = props => mount(<BaseDialog {...props} />);

    it('should render a Dialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Dialog)).toHaveLength(1);
        expect(wrapper.find(DialogTitle)).toHaveLength(1);
        expect(wrapper.find(DialogContent)).toHaveLength(1);
        expect(wrapper.find(DialogActions)).toHaveLength(1);
    });

    it('should give the dialog the passed in actions', () => {
        const actions = [
            <Button
                className="qa-BaseDialog-Button"
                style={{ margin: '0px' }}
                onClick={sinon.spy()}
            />,
            <Button
                className="qa-BaseDialog-Button"
                style={{ margin: '0px' }}
                onClick={sinon.spy()}
            />,
        ];
        const props = getProps();
        props.actions = actions;
        const wrapper = getWrapper(props);
        expect(wrapper.find(DialogActions).props().children).toEqual(actions);
    });

    it('should give the dialog the passed in title', () => {
        const title = 'hello';
        const props = getProps();
        props.title = title;
        const wrapper = getWrapper(props);
        expect(wrapper.find(DialogTitle).text()).toEqual(title);
    });
});
