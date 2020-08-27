import * as React from 'react';
import * as sinon from 'sinon';
import {LeaveGroupDialog} from '../../components/UserGroupsPage/Dialogs/LeaveGroupDialog';
import {render, screen} from '@testing-library/react';

jest.mock("../../components/Dialog/BaseDialog", () => {
    const React = require('react');
    return (props) => (<div id="basedialog">{props.children}</div>);
});

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
