import {TypeaheadMenuItem} from '../components/TypeaheadMenuItem';
import React from 'react';
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
        expect(wrapper.find(TypeaheadMenuItem)).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(3);
        expect(wrapper.find('.menuItem')).toHaveLength(1);
        expect(wrapper.find('.menuItemIconDiv')).toHaveLength(1);
        expect(wrapper.find(ActionRoom)).toHaveLength(1);
        expect(wrapper.find('.menuItemText')).toHaveLength(2);
        expect(wrapper.find('.menuItemText').first().text()).toEqual('');
    });

    it('createDescription should return the proper description', () => {
        const result = {name: 'test name', province: 'admin name1', region: 'admin name2', countryName: 'country name'}
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
        expect(description).toEqual('admin name2, admin name1, country name');
    });

    it('should have the proper text and icon', () => {
        let props = getProps();
        let context = getContext();
        props.result.bbox = {'east': '180'};
        props.result.name = 'test name';
        props.result.province = 'admin name1';
        props.result.region = 'admin name2';
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
        expect(wrapper.find(ImageCropDin)).toHaveLength(1);
        expect(wrapper.find('.menuItemText').first().text()).toEqual('test name');
        expect(wrapper.find('.menuItemText').last().text()).toEqual('admin name2, admin name1, country name');
    });
});
