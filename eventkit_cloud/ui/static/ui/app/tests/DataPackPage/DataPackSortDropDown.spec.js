import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import Menu from 'material-ui/Menu';
import * as utils from '../../utils/sortUtils';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackSortDropDown from '../../components/DataPackPage/DataPackSortDropDown';

describe('DataPackSortDropDown component', () => {
    const getProps = () => {
        return {
            handleChange: () => {},
            value: utils.orderNewest
        }
    }
    injectTapEventPlugin();
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
        props.value = utils.orderOldest;
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).toEqual('Oldest ');
    });

    it('should render with text "Name (A-Z)"', () => {
        let props = getProps();
        props.value = utils.orderAZ;
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).toEqual('Name (A-Z)');
    });

    it('should render with text "Name (Z-A)"', () => {
        let props = getProps();
        props.value = utils.orderZA;
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
        expect(menu.childAt(1).childAt(0).childAt(0).node.props.primaryText).toEqual('Newest');
        expect(menu.childAt(1).childAt(0).childAt(1).node.props.primaryText).toEqual('Oldest ');
        expect(menu.childAt(1).childAt(0).childAt(2).node.props.primaryText).toEqual('Name (A-Z)');
        expect(menu.childAt(1).childAt(0).childAt(3).node.props.primaryText).toEqual('Name (Z-A)');
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
                    value: utils.orderOldest,
                },
            },
            2
        );
        expect(menu.state().open).toEqual(false);
        expect(props.handleChange.calledWith(event, 2, utils.orderOldest)).toEqual(true);
    });

    it('getPx should return the size string for the specified item based on window width', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackSortDropDown {...props}/>);

        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getPx('labelFontSize')).toEqual('12px');
        expect(wrapper.instance().getPx('itemFontSize')).toEqual('10px');
        expect(wrapper.instance().getPx('labelRightPadding')).toEqual('24px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getPx('labelFontSize')).toEqual('13px');
        expect(wrapper.instance().getPx('itemFontSize')).toEqual('11px');
        expect(wrapper.instance().getPx('labelRightPadding')).toEqual('24px');

        window.resizeTo(900, 1000);
        expect(window.innerWidth).toEqual(900);
        expect(wrapper.instance().getPx('labelFontSize')).toEqual('14px');
        expect(wrapper.instance().getPx('itemFontSize')).toEqual('12px');
        expect(wrapper.instance().getPx('labelRightPadding')).toEqual('26px');

        window.resizeTo(1000, 1100);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getPx('labelFontSize')).toEqual('15px');
        expect(wrapper.instance().getPx('itemFontSize')).toEqual('13px');
        expect(wrapper.instance().getPx('labelRightPadding')).toEqual('28px');

        window.resizeTo(1200, 1300);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getPx('labelFontSize')).toEqual('16px');
        expect(wrapper.instance().getPx('itemFontSize')).toEqual('14px');
        expect(wrapper.instance().getPx('labelRightPadding')).toEqual('30px');
    });
});
