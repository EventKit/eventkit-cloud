import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import DropDownMenu from 'material-ui/DropDownMenu';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackSortDropDown from '../../components/DataPackPage/DataPackSortDropDown';

describe('DataPackSortDropDown component', () => {
    const getProps = () => ({
        handleChange: () => {},
        value: '-started_at',
    });
    const muiTheme = getMuiTheme();

    it('should render a dropdown menu', () => {
        const props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render with text "Newest"', () => {
        const props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.text()).toEqual('Newest');
    });

    it('should render with text "Oldest"', () => {
        const props = getProps();
        props.value = 'started_at';
        const wrapper = mount(<DataPackSortDropDown {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.text()).toEqual('Oldest ');
    });

    it('should render with text "Name (A-Z)"', () => {
        const props = getProps();
        props.value = 'job__name';
        const wrapper = mount(<DataPackSortDropDown {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.text()).toEqual('Name (A-Z)');
    });

    it('should render with text "Name (Z-A)"', () => {
        const props = getProps();
        props.value = '-job__name';
        const wrapper = mount(<DataPackSortDropDown {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.text()).toEqual('Name (Z-A)');
    });

    it('should adjust styles for small screens', () => {
        window.resizeTo(1000, 900);
        expect(window.innerWidth).toBe(1000);
        const props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu).props().labelStyle.fontSize).toEqual('14px');

        window.resizeTo(500, 600);
        expect(window.innerWidth).toBe(500);
        wrapper.instance().forceUpdate();
        wrapper.update();
        expect(wrapper.find(DropDownMenu).props().labelStyle.fontSize).toEqual('12px');
    });
});
