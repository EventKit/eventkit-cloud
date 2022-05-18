import * as sinon from 'sinon';
import {render, screen} from '@testing-library/react';

jest.doMock("../../components/Dialog/BaseDialog", () => {
    return (props) => (<div id="basedialog">{props.children}</div>);
});

const { MemberInfoDialog } = require('../../components/UserGroupsPage/Dialogs/MemberInfoDialog');

describe('MemberInfoDialog component', () => {

    const props = {
        show: true,
        onClose: sinon.spy(),
        ...(global as any).eventkit_test_props,
    };

    it('should render a MemberInfoDialog with a body', () => {
        render(<MemberInfoDialog {...props} />);
        screen.getByText(/You may leave any group you are a member of. /);
    });

});
