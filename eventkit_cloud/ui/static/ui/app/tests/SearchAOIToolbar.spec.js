import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {SearchAOIToolbar} from '../components/SearchAOIToolbar';
import {SearchAOIButton} from '../components/SearchAOIButton';
import {Typeahead, Menu} from 'react-bootstrap-typeahead';
import {TypeaheadMenuItem} from '../components/TypeaheadMenuItem';
import {fakeStore} from '../__mocks__/fakeStore'
import { Provider } from 'react-redux';


describe('SearchAOIToolbar button', () => {
    const getProps = () => {
        return {
            toolbarIcons: {search: 'DEFAULT'},
            geonames: {
                fetching: false,
                fetched: false,
                geonames: [],
                error: null,
            },
            getGeonames: () => {},
            handleSearch: () => {},
            handleCancel: () => {},
            setAllButtonsDefault: () => {},
            setSearchAOIButtonSelected: () => {},
        }
    }

    it('should render a searchbar and button', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><SearchAOIToolbar {...props}/></Provider>);
        expect(wrapper.find('.searchbarDiv')).to.have.length(1);
        expect(wrapper.find(Typeahead)).to.have.length(1);
        expect(wrapper.find(Menu)).to.have.length(0);
        expect(wrapper.find(TypeaheadMenuItem)).to.have.length(0);
        expect(wrapper.find('.searchAOIButtonContainer')).to.have.length(1);
        expect(wrapper.find(SearchAOIButton)).to.have.length(1);
    });

    it('should setup debouncer before mounting', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        expect(wrapper.instance().debouncer).to.exist;
        expect(wrapper.instance().debouncer).to.be.a('function');
    });

    it('should handle geonames passed in', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        let nextProps = getProps();
        nextProps.geonames.fetched = true;
        nextProps.geonames.geonames = ['one', 'two', 'three'];
        wrapper.setProps(nextProps);
        expect(spy.calledWith({suggestions: ['one', 'two', 'three']})).to.be.true;
    });

    it('should clear suggestions when props update', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        let nextProps = getProps();
        nextProps.geonames.error = 'Fake error';
        wrapper.setState({suggestions: ['one', 'two', 'three']})
        wrapper.setProps(nextProps);
        expect(spy.calledWith({suggestions: []})).to.be.true;
    });

    it('handleChange should reset the suggestions', () => {
        const suggestions = ['one', 'two'];
        let props = getProps();
        const wrapper = shallow(<SearchAOIToolbar  {...props}/>);
        wrapper.setState({suggestions: suggestions});
        expect(wrapper.state().suggestions).to.equal(suggestions);
        wrapper.instance().handleChange('e');
        expect(wrapper.state().suggestions.length).to.equal(0);

    });

    it('handleChange should call getGeonames', () => {
        let props = getProps();
        props.getGeonames = sinon.spy();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        wrapper.instance().handleChange('rio');
        expect(props.getGeonames.calledWith('rio')).to.equal(true);
    });

    it('handleEnter should only clear the suggestions', () => {
        const suggestions = ['one', 'two'];
        let props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        wrapper.setState({suggestions: suggestions});
        expect(wrapper.state().suggestions).to.equal(suggestions);
        wrapper.instance().handleEnter('');
        expect(wrapper.state().suggestions.length).to.equal(0);
    });
});
