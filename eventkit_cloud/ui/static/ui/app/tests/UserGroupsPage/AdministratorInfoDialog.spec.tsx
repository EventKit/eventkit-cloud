import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { AdministratorInfoDialog } from '../../components/UserGroupsPage/Dialogs/AdministratorInfoDialog';
import {render, screen} from '@testing-library/react';

jest.mock("../../components/Dialog/BaseDialog", () => {
    const React = require('react');
    return (props) => (<div id="basedialog">{props.children}</div>);
});

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
