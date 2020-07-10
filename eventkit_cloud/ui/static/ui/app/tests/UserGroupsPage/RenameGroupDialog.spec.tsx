import * as React from 'react';
import * as sinon from 'sinon';
import {RenameGroupDialog} from '../../components/UserGroupsPage/Dialogs/RenameGroupDialog';
import {mount} from "enzyme";

import BaseDialog from "../../components/Dialog/BaseDialog";
jest.mock("../../components/Dialog/BaseDialog", () => {
    const React = require('react');
    return (props) => (<div id="basedialog">{props.children}</div>);
});

import CustomTextField from '../../components/common/CustomTextField';
jest.mock("../../components/common/CustomTextField", () => {
    const React = require('react');
    return (props) => (<div className="textfield">{props.children}</div>);
});

describe('LeaveGroupDialog component', () => {
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
        const wrapper = mount(<RenameGroupDialog {...props} />);
        expect(wrapper.first().html()).toContain('basedialog');
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).find(CustomTextField)).toHaveLength(1);
    });

    it('should show name unavailable warning', () => {
        props.valid = false;

        const wrapper = mount(<RenameGroupDialog {...props} />);

        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).text()).toContain('Name unavailable');
    });

    it('should set the save button disabled if no value or its invalid', () => {
        props.valid = true;
        props.value = '';
        const wrapper = mount(<RenameGroupDialog {...props} />);
        expect((wrapper.find(BaseDialog).props().actions[0] as any).props.disabled).toBe(true);
        wrapper.setProps({ valid: false, value: 'something' });
        expect((wrapper.find(BaseDialog).props().actions[0] as any).props.disabled).toBe(true);
    });
});
