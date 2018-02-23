import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import Menu from 'material-ui/Menu';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackSortDropDown from '../../components/DataPackPage/DataPackSortDropDown';

describe('DataPackSortDropDown component', () => {
    const getProps = () => {
        return {
            handleChange: () => {},
            value: '-started_at'
        }
    }
    const muiTheme = getMuiTheme();

    it('should render a dropdown menu', () => {
        let props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render with text "Newest"', () => {
        let props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).toEqual('Newest');
    });

    it('should render with text "Oldest"', () => {
        let props = getProps();
        props.value = 'started_at';
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).toEqual('Oldest ');
    });

    it('should render with text "Name (A-Z)"', () => {
        let props = getProps();
        props.value = 'job__name';
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).toEqual('Name (A-Z)');
    });

    it('should render with text "Name (Z-A)"', () => {
        let props = getProps();
        props.value = '-job__name';
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).toEqual('Name (Z-A)');
    });

    it('should have the correct menu item labels', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackSortDropDown {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, {context: {muiTheme}});
        expect(menu.childAt(1).childAt(0).childAt(0).node.props.primaryText).toEqual('Featured');        
        expect(menu.childAt(1).childAt(0).childAt(1).node.props.primaryText).toEqual('Newest');
        expect(menu.childAt(1).childAt(0).childAt(2).node.props.primaryText).toEqual('Oldest ');
        expect(menu.childAt(1).childAt(0).childAt(3).node.props.primaryText).toEqual('Name (A-Z)');
        expect(menu.childAt(1).childAt(0).childAt(4).node.props.primaryText).toEqual('Name (Z-A)');
    });
    
    it('should call onChange when an item is selected', () => {
        let props = getProps();
        props.handleChange = new sinon.spy();
        const wrapper = shallow(<DataPackSortDropDown {...props}/>, {
            context: {muiTheme}
        });
        const menu = shallow(wrapper.find(DropDownMenu).node, {context: {muiTheme}});
        menu.setState({
            open: true,
        });
        const event = {persist: () => {},};
        menu.find(Menu).props().onItemTouchTap(
            event,
            {
                props: {
                    value: 'started_at',
                },
            },
            2
        );
        expect(menu.state().open).toEqual(false);
        expect(props.handleChange.calledWith(event, 2, 'started_at')).toEqual(true);
    });

    it('should adjust styles for small screens', () => {
        window.resizeTo(1000, 900);        
        expect(window.innerWidth).toBe(1000);
        const props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(DropDownMenu).props().labelStyle.fontSize).toEqual('14px');

        window.resizeTo(500, 600);
        expect(window.innerWidth).toBe(500);
        wrapper.update();
        expect(wrapper.find(DropDownMenu).props().labelStyle.fontSize).toEqual('12px');
    });
});
