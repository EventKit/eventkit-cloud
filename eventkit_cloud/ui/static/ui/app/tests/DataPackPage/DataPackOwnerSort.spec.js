import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import DropDownMenu from 'material-ui/DropDownMenu';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackOwnerSort from '../../components/DataPackPage/DataPackOwnerSort';

describe('DataPackOwnerSort component', () => {
    const getProps = () => ({
        value: 'all',
        handleChange: () => {},
        owner: 'test_user',
    });
    const muiTheme = getMuiTheme();

    it('should render a dropdown menu', () => {
        const props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render with text "All DataPacks"', () => {
        const props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.text()).toEqual('All DataPacks');
    });

    it('should render with text "My DataPacks"', () => {
        const props = getProps();
        props.value = 'test_user';
        const wrapper = mount(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.text()).toEqual('My DataPacks');
    });

    it('should render differently for small screens', () => {
        window.resizeTo(1000, 700);
        expect(window.innerWidth).toBe(1000);

        const props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu).props().labelStyle.fontSize).toEqual('14px');

        window.resizeTo(400, 500);
        wrapper.instance().forceUpdate();
        wrapper.update();
        expect(window.innerWidth).toBe(400);
        expect(wrapper.find(DropDownMenu).props().labelStyle.fontSize).toEqual('12px');
    });
});
