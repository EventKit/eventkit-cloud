import React from 'react';
import {expect} from 'chai';
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
        expect(wrapper.find('.buttonGeneral')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2);
        expect(wrapper.find(ActionSearch)).to.have.length(1);
        expect(wrapper.find(ActionSearch).hasClass('defaultButton')).to.equal(true);
        expect(wrapper.find('.buttonName')).to.have.length(1);
        expect(wrapper.find('.buttonName').text()).to.equal('SEARCH');
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
        expect(wrapper.find('.buttonGeneral')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2);
        expect(wrapper.find(ActionSearch)).to.have.length(1);
        expect(wrapper.find(ActionSearch).hasClass('inactiveButton')).to.equal(true);
        expect(wrapper.find('.buttonName')).to.have.length(1);
        expect(wrapper.find('.buttonName').text()).to.equal('SEARCH');
        expect(wrapper.find('.buttonName').hasClass('buttonNameInactive')).to.equal(true);
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
        expect(wrapper.find('.buttonGeneral')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2);
        expect(wrapper.find(ContentClear)).to.have.length(1);
        expect(wrapper.find(ContentClear).hasClass('selectedButton')).to.equal(true);
        expect(wrapper.find('.buttonName')).to.have.length(1);
        expect(wrapper.find('.buttonName').text()).to.equal('SEARCH');
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
        expect(nextProps.handleCancel.calledOnce).to.be.true;
        expect(nextProps.setAllButtonsDefault.calledOnce).to.be.true;
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
        expect(nextProps.handleCancel.calledOnce).to.be.false;
        expect(nextProps.setAllButtonsDefault.calledOnce).to.be.false;
    });
});
