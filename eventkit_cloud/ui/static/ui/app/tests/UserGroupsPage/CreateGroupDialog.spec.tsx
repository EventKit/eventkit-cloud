import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import { CreateGroupDialog } from '../../components/UserGroupsPage/Dialogs/CreateGroupDialog';

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

describe('CreateGroupDialog component', () => {
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
        ...(global as any).eventkit_test_props,
    };

    it('should render a BaseDialog with a textfield', () => {
        const wrapper = shallow(<CreateGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).dive().find(CustomTextField)).toHaveLength(1);
    });
});
