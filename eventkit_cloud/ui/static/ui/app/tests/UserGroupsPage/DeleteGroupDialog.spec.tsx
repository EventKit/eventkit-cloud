import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { DeleteGroupDialog } from '../../components/UserGroupsPage/Dialogs/DeleteGroupDialog';

describe('LeaveGroupDialog component', () => {

    const props = {
        show: true,
        onClose: sinon.spy(),
        onDelete: sinon.spy(),
        groupName: 'Test Group',
        ...(global as any).eventkit_test_props,
    };

    it('should render a BaseDialog with message', () => {
        const wrapper = shallow(<DeleteGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).text())
            .toEqual("Are you sure you'd like to delete 'Test Group'?");
    });
});
