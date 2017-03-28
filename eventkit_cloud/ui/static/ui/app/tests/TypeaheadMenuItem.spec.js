import {TypeaheadMenuItem} from '../components/TypeaheadMenuItem';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {MenuItem} from 'react-bootstrap-typeahead';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ImageCropDin from 'material-ui/svg-icons/image/crop-din';
import ActionRoom from 'material-ui/svg-icons/action/room';

describe('TypeaheadMenuItem component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            result: {},
            index: 1,
        }
    }

    const getContext = () => {
        return {
            activeIndex: -1,
            onActiveItemChange: () => {},
            onInitialItemChange: () => {},
            onMenuItemClick: () => {},
            muiTheme
        }
    }

    it('should renter a MenuItem with proper child components', () => {
        const props = getProps();
        const context = getContext();
        const wrapper = mount(
            <TypeaheadMenuItem {...props}/>, {
                context: context,
                childContextTypes: {
                    activeIndex: React.PropTypes.number.isRequired,
                    onActiveItemChange: React.PropTypes.func.isRequired,
                    onInitialItemChange: React.PropTypes.func.isRequired,
                    onMenuItemClick: React.PropTypes.func.isRequired,
                    muiTheme: React.PropTypes.object
                }
            }
        );
        expect(wrapper.find(TypeaheadMenuItem)).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(3);
        expect(wrapper.find('.menuItem')).to.have.length(1);
        expect(wrapper.find('.menuItemIconDiv')).to.have.length(1);
        expect(wrapper.find(ActionRoom)).to.have.length(1);
        expect(wrapper.find('.menuItemText')).to.have.length(2);
        expect(wrapper.find('.menuItemText').first().text()).to.equal('');
    });

    it('createDescription should return the proper description', () => {
        const result = {name: 'test name', adminName1: 'admin name1', adminName2: 'admin name2', countryName: 'country name'}
        let props = getProps();
        let context = getContext();
        const wrapper = mount(
            <TypeaheadMenuItem {...props}/>, {
                context: context,
                childContextTypes: {
                    activeIndex: React.PropTypes.number.isRequired,
                    onActiveItemChange: React.PropTypes.func.isRequired,
                    onInitialItemChange: React.PropTypes.func.isRequired,
                    onMenuItemClick: React.PropTypes.func.isRequired,
                    muiTheme: React.PropTypes.object
                }
            }
        );
        let description = wrapper.instance().createDescription(result)
        expect(description).to.equal('admin name2, admin name1, country name');
    });

    it('should have the proper text and icon', () => {
        let props = getProps();
        let context = getContext();
        props.result.bbox = {'east': '180'};
        props.result.name = 'test name';
        props.result.adminName1 = 'admin name1';
        props.result.adminName2 = 'admin name2';
        props.result.countryName = 'country name';
        const wrapper = mount(
            <TypeaheadMenuItem {...props}/>, {
                context: context,
                childContextTypes: {
                    activeIndex: React.PropTypes.number.isRequired,
                    onActiveItemChange: React.PropTypes.func.isRequired,
                    onInitialItemChange: React.PropTypes.func.isRequired,
                    onMenuItemClick: React.PropTypes.func.isRequired,
                    muiTheme: React.PropTypes.object
                }
            }
        );
        expect(wrapper.find(ImageCropDin)).to.have.length(1);
        expect(wrapper.find('.menuItemText').first().text()).to.equal('test name');
        expect(wrapper.find('.menuItemText').last().text()).to.equal('admin name2, admin name1, country name');
    });
});
