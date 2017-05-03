import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {SearchAOIButton} from '../components/SearchAOIButton';
import {fakeStore} from '../__mocks__/fakeStore'
import { Provider } from 'react-redux';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ActionSearch from 'material-ui/svg-icons/action/search';
import ContentClear from 'material-ui/svg-icons/content/clear';

describe('SearchAOIButton component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            toolbarIcons: {search: 'DEFAULT'},
            handleCancel: () => {},
            setSearchAOIButtonSelected: () => {},
            setAllButtonsDefault: () => {},
        }
    }
    it('should render its default state', () => {
        const props = getProps();
        const wrapper = mount(<SearchAOIButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('.buttonGeneral')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ActionSearch)).toHaveLength(1);
        expect(wrapper.find(ActionSearch).hasClass('defaultButton')).toEqual(true);
        expect(wrapper.find('.buttonName')).toHaveLength(1);
        expect(wrapper.find('.buttonName').text()).toEqual('SEARCH');
    });

    it('should render its inactive state', () => {
        const props = getProps();
        const wrapper = mount(<SearchAOIButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.toolbarIcons.search = 'INACTIVE';
        wrapper.setProps(nextProps);
        expect(wrapper.find('.buttonGeneral')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ActionSearch)).toHaveLength(1);
        expect(wrapper.find(ActionSearch).hasClass('inactiveButton')).toEqual(true);
        expect(wrapper.find('.buttonName')).toHaveLength(1);
        expect(wrapper.find('.buttonName').text()).toEqual('SEARCH');
        expect(wrapper.find('.buttonName').hasClass('buttonNameInactive')).toEqual(true);
    });

    it('should render its active state', () => {
        const props = getProps();
        const wrapper = mount(<SearchAOIButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.toolbarIcons.search = 'SELECTED';
        wrapper.setProps(nextProps);
        expect(wrapper.find('.buttonGeneral')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ContentClear)).toHaveLength(1);
        expect(wrapper.find(ContentClear).hasClass('selectedButton')).toEqual(true);
        expect(wrapper.find('.buttonName')).toHaveLength(1);
        expect(wrapper.find('.buttonName').text()).toEqual('SEARCH');
    });

    it('should handle onClick', () => {
        const props = getProps();
        const wrapper = mount(<SearchAOIButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.toolbarIcons.search = 'SELECTED';
        nextProps.handleCancel = sinon.spy();
        nextProps.setAllButtonsDefault = sinon.spy();
        wrapper.setProps(nextProps);
        wrapper.find('button').simulate('click');
        expect(nextProps.handleCancel.calledOnce).toBe(true);
        expect(nextProps.setAllButtonsDefault.calledOnce).toBe(true);
    });

    it('should do nothing onClick when inactive', () => {
        const props = getProps();
        const wrapper = mount(<SearchAOIButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.toolbarIcons.search = 'INACTIVE';
        nextProps.handleCancel = sinon.spy();
        nextProps.setAllButtonsDefault = sinon.spy();
        wrapper.setProps(nextProps);
        wrapper.find('button').simulate('click');
        expect(nextProps.handleCancel.calledOnce).toBe(false);
        expect(nextProps.setAllButtonsDefault.calledOnce).toBe(false);
    });
});
