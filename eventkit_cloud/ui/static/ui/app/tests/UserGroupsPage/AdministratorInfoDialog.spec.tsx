import * as sinon from 'sinon';
import {render, screen} from '@testing-library/react';

jest.doMock("../../components/Dialog/BaseDialog", () => {
    return (props) => (<div id="basedialog">{props.children}</div>);
});

const {AdministratorInfoDialog} = require('../../components/UserGroupsPage/Dialogs/AdministratorInfoDialog');

describe('AdministratorInfoDialog component', () => {

    const props = {
        show: true,
        onClose: sinon.spy(),
        ...(global as any).eventkit_test_props,
    };

    it('should render a BaseDialog with a body', () => {
        render(<AdministratorInfoDialog {...props} />);
        screen.getByText(/You may leave any administrator group./);
    });
});
