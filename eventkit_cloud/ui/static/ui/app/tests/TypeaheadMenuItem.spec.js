import {TypeaheadMenuItem} from '../components/TypeaheadMenuItem';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {MenuItem} from 'react-bootstrap-typeahead';

describe('TypeaheadMenuItem component', () => {
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
                }
            }
        );
        expect(wrapper.find(TypeaheadMenuItem)).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(3);
        expect(wrapper.find('.menuItem')).to.have.length(1);
        expect(wrapper.find('.menuItemIconDiv')).to.have.length(1);
        expect(wrapper.find('i')).to.have.length(1);
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
                }
            }
        );
        expect(wrapper.find('i').text()).to.equal('crop_din');
        expect(wrapper.find('.menuItemText').first().text()).to.equal('test name');
        expect(wrapper.find('.menuItemText').last().text()).to.equal('admin name2, admin name1, country name');
    });
});
