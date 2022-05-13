import * as sinon from 'sinon';
import {render, screen} from '@testing-library/react';

jest.doMock("../../components/Dialog/BaseDialog", () => {
    return (props) => (<div id="basedialog" data-testid="base-dialog">{props.children}</div>);
});

jest.doMock("../../components/common/CustomTextField", () => {
    return (props) => (<div className="textfield" data-testid="custom-text-field">{props.children}</div>);
});

const { CreateGroupDialog } = require('../../components/UserGroupsPage/Dialogs/CreateGroupDialog');

describe('CreateGroupDialog component', () => {

    const props = {
        show: true,
        onInputChange: sinon.spy(),
        onClose: sinon.spy(),
        onSave: sinon.spy(),
        value: '',
        ...(global as any).eventkit_test_props,
    };

    it('should render a BaseDialog with a textfield', () => {
        render(<CreateGroupDialog {...props} />);
        screen.getByTestId('base-dialog');
        screen.getByTestId('custom-text-field');
    });
});
