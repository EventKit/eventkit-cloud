import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';
import FlatButton from 'material-ui/FlatButton';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowDropUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackFilterButton from '../../components/DataPackPage/DataPackFilterButton';

describe('DataPackFilterButton component', () => {
    const getProps = () => {
        return {
            open: false,
            handleToggle: () => {}
        }
    };
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();

    it('should render a flat button with proper lable and icon', () => {
        const props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(FlatButton)).to.have.length(1);
        expect(wrapper.find(NavigationArrowDropUp)).to.have.length(1);
        expect(wrapper.text()).to.equal('Filter');
    });

    it('should call handleToggle', () => {
        let props = getProps();
        props.handleToggle = new sinon.spy();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find('button').simulate('click');
        expect(props.handleToggle.calledOnce).to.equal(true);
    });

    it('should render a different icon when open is true', () => {
        let props = getProps();
        const wrapper = mount(<DataPackFilterButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(NavigationArrowDropUp)).to.have.length(1);
        props.open = true;
        wrapper.setProps(props);
        expect(wrapper.find(NavigationArrowDropDown)).to.have.length(1);
    });
});
