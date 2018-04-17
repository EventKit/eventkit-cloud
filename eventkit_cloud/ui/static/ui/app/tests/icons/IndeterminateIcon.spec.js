import React, { PropTypes } from 'react';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { mount } from 'enzyme';
import SvgIcon from 'material-ui/SvgIcon';
import IndeterminateIcon from '../../components/icons/IndeterminateIcon';

describe('Indeterminate Icon component', () => {
    const muiTheme = getMuiTheme();
    const wrapper = mount(<IndeterminateIcon />, {
        context: { muiTheme },
        childContextTypes: { muiTheme: PropTypes.object },
    });

    it('should render', () => {
        expect(wrapper.find(SvgIcon)).toHaveLength(1);
    });
});
