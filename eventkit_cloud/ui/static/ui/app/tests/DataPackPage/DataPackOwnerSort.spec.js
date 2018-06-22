import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import DropDownMenu from 'material-ui/DropDownMenu';
import Menu from 'material-ui/Menu';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackOwnerSort from '../../components/DataPackPage/DataPackOwnerSort';

describe('DataPackOwnerSort component', () => {
    const getProps = () => ({
        value: '',
        handleChange: () => {},
        owner: 'test_user',
    });
    const muiTheme = getMuiTheme();

    it('should render a dropdown menu', () => {
        const props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render with text "All DataPacks"', () => {
        const props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
        expect(wrapper.text()).toEqual('All DataPacks');
    });

    it('should render with text "My DataPacks"', () => {
        const props = getProps();
        props.value = 'test_user';
        const wrapper = mount(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
        expect(wrapper.text()).toEqual('My DataPacks');
    });

    it('should display the right default selected value text', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, { context: { muiTheme } });
        expect(menu.childAt(0).childAt(0).childAt(0).node).toEqual('All DataPacks');
    });

    it('should have the correct menu item labels', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, { context: { muiTheme } });
        expect(menu.childAt(1).childAt(0).childAt(0).node.props.primaryText).toEqual('All DataPacks');
        expect(menu.childAt(1).childAt(0).childAt(1).node.props.primaryText).toEqual('My DataPacks');
    });

    it('should call onChange when an item is selected', () => {
        const props = getProps();
        props.handleChange = sinon.spy();
        const wrapper = shallow(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
        });
        const menu = shallow(wrapper.find(DropDownMenu).node, { context: { muiTheme } });
        menu.setState({
            open: true,
        });
        const event = { persist: () => {} };
        menu.find(Menu).props().onItemTouchTap(
            event,
            {
                props: {
                    value: 'My DataPacks',
                },
            },
            2,
        );
        expect(menu.state().open).toEqual(false);
        expect(props.handleChange.calledWith(event, 2, 'My DataPacks')).toEqual(true);
    });

    it('should render differently for small screens', () => {
        window.resizeTo(1000, 700);
        expect(window.innerWidth).toBe(1000);

        const props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
        expect(wrapper.find(DropDownMenu).props().labelStyle.fontSize).toEqual('14px');

        window.resizeTo(400, 500);
        wrapper.update();
        expect(window.innerWidth).toBe(400);
        expect(wrapper.find(DropDownMenu).props().labelStyle.fontSize).toEqual('12px');
    });
});
