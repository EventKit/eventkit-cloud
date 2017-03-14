import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount} from 'enzyme';
import AutoComplete from 'material-ui/AutoComplete';
import DataPackSearchbar from '../components/DataPackSearchbar';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

describe('DataPackSearchbar component', () => {
    const getProps = () => {
        return {
            onSearchChange: () => {},
            onSearchSubmit: () => {},
            searchbarWidth: '100px',
        }
    }
    it('should render the Material-ui autocomplete component', () => {
        const props = getProps();
        const wrapper = mount(<MuiThemeProvider><DataPackSearchbar {...props}/></MuiThemeProvider>);
        expect(wrapper.find(AutoComplete)).to.have.length(1);
        expect(wrapper.find('.autoComplete')).to.have.length(1);
        expect(wrapper.find('.autoComplete').children().first().text()).to.equal('Search DataPacks');
    });

    it('should call onSearchChange', () => {
        let props = getProps();
        props.onSearchChange = new sinon.spy();
        const wrapper = mount(<MuiThemeProvider><DataPackSearchbar {...props}/></MuiThemeProvider>);
        wrapper.find('input').simulate('change', {target: {value: 'SearchText'}});
        expect(props.onSearchChange.calledWith('SearchText')).to.be.true;
    });

    it('should call onSearchSubmit', () => {
        let props = getProps();
        props.onSearchSubmit = new sinon.spy();
        const wrapper = mount(<MuiThemeProvider><DataPackSearchbar {...props}/></MuiThemeProvider>);
        wrapper.find('input').simulate('change', {target: {value: 'SearchText'}});
        wrapper.find('input').simulate('keyDown', {keyCode: 13, which: 13, key: 'enter'});
        expect(props.onSearchSubmit.calledWith('SearchText')).to.be.true;
    });
});
