import React from 'react';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import CustomTextField from '../components/CustomTextField';
import {TextField} from 'material-ui';

describe('CustomTextField component', () => {
    const muiTheme = getMuiTheme();

    it('should render a material-ui TextField component', () => {
        const wrapper = mount(<CustomTextField/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(TextField)).toHaveLength(1);
    });

    it('should show remaining characters when maxLength is present and input is focused', () => {
        const wrapper = mount(<CustomTextField maxLength={100}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const input = wrapper.find('input');
        const charsRemaining = wrapper.find(TextField).parent().last('div');

        input.simulate('focus');
        expect(charsRemaining.text()).toEqual('100');
        input.simulate('change', {target: {value: 'abc'}});
        expect(charsRemaining.text()).toEqual('97');
        input.simulate('blur');
        expect(charsRemaining.text()).toEqual('');
    });

    it('should not show remaining characters when showRemaining is false', () => {
        const wrapper = mount(<CustomTextField maxLength={100} showRemaining={false}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const input = wrapper.find('input');
        const charsRemaining = wrapper.find(TextField).parent().last('div');

        input.simulate('focus');
        expect(charsRemaining.text()).toEqual('');
    });
});
