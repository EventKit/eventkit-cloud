import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import CustomTextField from '../../components/CustomTextField';
import { CreateGroupDialog } from '../../components/UserGroupsPage/Dialogs/CreateGroupDialog';

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
