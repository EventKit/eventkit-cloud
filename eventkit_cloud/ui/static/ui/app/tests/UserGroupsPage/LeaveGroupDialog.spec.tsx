import * as sinon from 'sinon';
import {render, screen} from '@testing-library/react';

jest.doMock("../../components/Dialog/BaseDialog", () => {
    return (props) => (<div id="basedialog">{props.children}</div>);
});

const {LeaveGroupDialog} = require('../../components/UserGroupsPage/Dialogs/LeaveGroupDialog');

describe('LeaveGroupDialog component', () => {

    const props = {
        show: true,
        onClose: sinon.spy(),
        onLeave: sinon.spy(),
        groupName: 'Test Group',
        ...(global as any).eventkit_test_props,
    };

    it('should render the appropriate message', () => {
        render(<LeaveGroupDialog {...props}/>);
        screen.getByText("I'd like to opt out of all shared rights for the 'Test Group' group.");
    });
});
