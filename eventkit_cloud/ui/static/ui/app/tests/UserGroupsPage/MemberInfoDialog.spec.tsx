import * as React from 'react';
import * as sinon from 'sinon';
import { MemberInfoDialog } from '../../components/UserGroupsPage/Dialogs/MemberInfoDialog';
import {render, screen} from '@testing-library/react';


jest.mock("../../components/Dialog/BaseDialog", () => {
    const React = require('react');
    return (props) => (<div id="basedialog">{props.children}</div>);
});

describe('MemberInfoDialog component', () => {

    const props = {
        show: true,
        onClose: sinon.spy(),
        ...(global as any).eventkit_test_props,
    };

    it('should render a BaseDialog with a body', () => {
        render(<MemberInfoDialog {...props} />);
        screen.getByText(/You may leave any group you are a member of. /);
    });

});
