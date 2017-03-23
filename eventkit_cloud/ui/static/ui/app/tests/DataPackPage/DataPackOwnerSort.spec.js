import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
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
        expect(wrapper.find(DropDownMenu)).to.have.length(1);
    });

    it('should render with text "All DataPacks"', () => {
        let props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).to.equal('All DataPacks');
    });

    it('should render with text "My DataPacks"', () => {
        let props = getProps();
        props.value = 2;
        const wrapper = mount(<DataPackOwnerSort {...props}/> , {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.text()).to.equal('My DataPacks');
    });

    it('should display the right default selected value text', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props}/>, {
                context: {muiTheme},
                childContextTypes: {muiTheme: React.PropTypes.object},
            }
        );
        expect(wrapper.find(DropDownMenu)).to.have.length(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, {context: {muiTheme}});
        expect(menu.childAt(0).childAt(0).childAt(0).node).to.equal('All DataPacks');
    });

    it('should have the correct menu item labels', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(DropDownMenu)).to.have.length(1);
        const menu = shallow(wrapper.find(DropDownMenu).node, {context: {muiTheme}});
        expect(menu.childAt(1).childAt(0).childAt(0).node.props.primaryText).to.equal('All DataPacks');
        expect(menu.childAt(1).childAt(0).childAt(1).node.props.primaryText).to.equal('My DataPacks');
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
        expect(menu.state().open).to.equal(false);
        expect(props.handleChange.calledWith(event, 2, 'My DataPacks')).to.equal(true);
    })
});
