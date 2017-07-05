import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {SearchAOIToolbar} from '../components/SearchAOIToolbar';
import {SearchAOIButton} from '../components/SearchAOIButton';
import {Typeahead, Menu} from 'react-bootstrap-typeahead';
import {TypeaheadMenuItem} from '../components/TypeaheadMenuItem';
import {fakeStore} from '../__mocks__/fakeStore'
import { Provider } from 'react-redux';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('SearchAOIToolbar button', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            toolbarIcons: {search: 'DEFAULT'},
            geocode: {
                fetching: false,
                fetched: false,
                geocode: [],
                error: null,
            },
            getGeocode: () => {},
            handleSearch: () => {},
            handleCancel: () => {},
            setAllButtonsDefault: () => {},
            setSearchAOIButtonSelected: () => {},
        }
    }

    it('should render a searchbar and button', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><SearchAOIToolbar {...props}/></Provider>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('.searchbarDiv')).toHaveLength(1);
        expect(wrapper.find(Typeahead)).toHaveLength(1);
        expect(wrapper.find(Menu)).toHaveLength(0);
        expect(wrapper.find(TypeaheadMenuItem)).toHaveLength(0);
        expect(wrapper.find('.searchAOIButtonContainer')).toHaveLength(1);
        expect(wrapper.find(SearchAOIButton)).toHaveLength(1);
    });

    it('should setup debouncer before mounting', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        expect(wrapper.instance().debouncer).toBeDefined();
        expect(wrapper.instance().debouncer).toBeInstanceOf(Function);
    });

    it('should handle geocode passed in', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        let nextProps = getProps();
        nextProps.geocode.fetched = true;
        nextProps.geocode.data = ['one', 'two', 'three'];
        wrapper.setProps(nextProps);
        expect(spy.calledWith({suggestions: ['one', 'two', 'three']})).toBe(true);
    });

    it('should clear suggestions when props update', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        let nextProps = getProps();
        nextProps.geocode.error = 'Fake error';
        wrapper.setState({suggestions: ['one', 'two', 'three']})
        wrapper.setProps(nextProps);
        expect(spy.calledWith({suggestions: []})).toBe(true);
    });

    it('handleChange should reset the suggestions', () => {
        const suggestions = ['one', 'two'];
        let props = getProps();
        const wrapper = shallow(<SearchAOIToolbar  {...props}/>);
        wrapper.setState({suggestions: suggestions});
        expect(wrapper.state().suggestions).toEqual(suggestions);
        wrapper.instance().handleChange('e');
        expect(wrapper.state().suggestions.length).toEqual(0);

    });

    it('handleChange should call getGeocode', () => {
        let props = getProps();
        props.getGeocode = sinon.spy();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        wrapper.instance().handleChange('rio');
        expect(props.getGeocode.calledWith('rio')).toEqual(true);
    });

    it('handleEnter should only clear the suggestions', () => {
        const suggestions = ['one', 'two'];
        let props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        wrapper.setState({suggestions: suggestions});
        expect(wrapper.state().suggestions).toEqual(suggestions);
        wrapper.instance().handleEnter('');
        expect(wrapper.state().suggestions.length).toEqual(0);
    });
});
