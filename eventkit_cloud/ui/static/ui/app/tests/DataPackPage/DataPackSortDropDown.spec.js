import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
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
        expect(wrapper.find(DropDownMenu)).to.have.length(1);
    });

    it('should render with text "Newest"', () => {
        let props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).to.equal('Newest');
    });

    it('should render with text "Oldest"', () => {
        let props = getProps();
        props.value = utils.orderOldest;
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).to.equal('Oldest ');
    });

    it('should render with text "Name (A-Z)"', () => {
        let props = getProps();
        props.value = utils.orderAZ;
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).to.equal('Name (A-Z)');
    });

    it('should render with text "Name (Z-A)"', () => {
        let props = getProps();
        props.value = utils.orderZA;
        const wrapper = mount(<DataPackSortDropDown {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).to.equal('Name (Z-A)');
    });

    it('should have the correct menu item labels', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackSortDropDown {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(DropDownMenu)).to.have.length(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, {context: {muiTheme}});
        expect(menu.childAt(1).childAt(0).childAt(0).node.props.primaryText).to.equal('Newest');
        expect(menu.childAt(1).childAt(0).childAt(1).node.props.primaryText).to.equal('Oldest ');
        expect(menu.childAt(1).childAt(0).childAt(2).node.props.primaryText).to.equal('Name (A-Z)');
        expect(menu.childAt(1).childAt(0).childAt(3).node.props.primaryText).to.equal('Name (Z-A)');
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
        expect(menu.state().open).to.equal(false);
        expect(props.handleChange.calledWith(event, 2, utils.orderOldest)).to.equal(true);
    });
});
