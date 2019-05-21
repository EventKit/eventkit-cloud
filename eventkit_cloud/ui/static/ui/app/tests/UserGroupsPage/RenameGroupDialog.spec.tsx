import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import CustomTextField from '../../components/CustomTextField';
import { RenameGroupDialog } from '../../components/UserGroupsPage/Dialogs/RenameGroupDialog';

describe('LeaveGroupDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const props = {
        show: true,
        onInputChange: sinon.spy(),
        onClose: sinon.spy(),
        onSave: sinon.spy(),
        value: '',
        valid: true,
        ...(global as any).eventkit_test_props,
    };

    it('should render a BaseDialog with text field', () => {
        const wrapper = shallow(<RenameGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).dive().find(CustomTextField)).toHaveLength(1);
    });

    it('should show name unavailable warning', () => {
        props.valid = false;
        const wrapper = shallow(<RenameGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const child = shallow(wrapper.find(BaseDialog).props().children[0]);
        expect(child.text()).toEqual('Name unavailable');
    });

    it('should set the save button disabled if no value or its invalid', () => {
        props.valid = true;
        props.value = '';
        const wrapper = shallow(<RenameGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog).props().actions[0].props.disabled).toBe(true);
        wrapper.setProps({ valid: false, value: 'something' });
        expect(wrapper.find(BaseDialog).props().actions[0].props.disabled).toBe(true);
    });
});
