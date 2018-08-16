import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import AdministratorInfoDialog from '../../components/UserGroupsPage/Dialogs/AdministratorInfoDialog';

describe('AdministratorInfoDialog component', () => {
    const muiTheme = getMuiTheme();

    const props = {
        show: true,
        onClose: () => {},
    };

    it('should render a BaseDialog with a body', () => {
        const wrapper = mount(<AdministratorInfoDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const body = mount(wrapper.find(BaseDialog).props().children, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(body.find('.qa-AdministratorInfoDialog-body')).toHaveLength(1);
    });
});
