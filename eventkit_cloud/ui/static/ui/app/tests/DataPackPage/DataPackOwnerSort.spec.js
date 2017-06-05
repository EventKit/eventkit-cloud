import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import DropDownMenu from 'material-ui/DropDownMenu';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackOwnerSort from '../../components/DataPackPage/DataPackOwnerSort';

describe('DataPackOwnerSort component', () => {
    const getProps = () => {
        return {
            value: 1,
            handleChange: () => {}
        }
    }
    injectTapEventPlugin();
    const muiTheme =  getMuiTheme();

    it('should render a dropdown menu', () => {
        let props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render with text "All DataPacks"', () => {
        let props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).toEqual('All DataPacks');
    });

    it('should render with text "My DataPacks"', () => {
        let props = getProps();
        props.value = 2;
        const wrapper = mount(<DataPackOwnerSort {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).toEqual('My DataPacks');
    });

    it('should display the right default selected value text', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props}/>, {
                context: {muiTheme},
                childContextTypes: {muiTheme: React.PropTypes.object},
            }
        );
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, {context: {muiTheme}});
        expect(menu.childAt(0).childAt(0).childAt(0).node).toEqual('All DataPacks');
    });

    it('should have the correct menu item labels', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, {context: {muiTheme}});
        expect(menu.childAt(1).childAt(0).childAt(0).node.props.primaryText).toEqual('All DataPacks');
        expect(menu.childAt(1).childAt(0).childAt(1).node.props.primaryText).toEqual('My DataPacks');
    });
    
    it('should call onChange when an item is selected', () => {
        let props = getProps();
        props.handleChange = new sinon.spy();
        const wrapper = shallow(<DataPackOwnerSort {...props}/>, {
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
                    value: 'My DataPacks',
                },
            },
            2
        );
        expect(menu.state().open).toEqual(false);
        expect(props.handleChange.calledWith(event, 2, 'My DataPacks')).toEqual(true);
    });

    it('getLabelFontSize should return the font string based on window width', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props}/>);

        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getLabelFontSize()).toEqual('12px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getLabelFontSize()).toEqual('13px');

        window.resizeTo(900, 1000);
        expect(window.innerWidth).toEqual(900);
        expect(wrapper.instance().getLabelFontSize()).toEqual('14px');

        window.resizeTo(1000, 1100);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getLabelFontSize()).toEqual('15px');

        window.resizeTo(1200, 1300);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getLabelFontSize()).toEqual('16px');
    });

    it('getItemFontSize should return the font string based on window width', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props}/>);

        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getItemFontSize()).toEqual('10px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getItemFontSize()).toEqual('11px');

        window.resizeTo(900, 1000);
        expect(window.innerWidth).toEqual(900);
        expect(wrapper.instance().getItemFontSize()).toEqual('12px');

        window.resizeTo(1000, 1100);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getItemFontSize()).toEqual('13px');

        window.resizeTo(1200, 1300);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getItemFontSize()).toEqual('14px');
    });
});
