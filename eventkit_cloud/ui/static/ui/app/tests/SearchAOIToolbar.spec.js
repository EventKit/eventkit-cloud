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

    it('should handle geonames passed in', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        let nextProps = getProps();
        nextProps.geonames.fetched = true;
        nextProps.geonames.geonames = ['one', 'two', 'three'];
        wrapper.setProps(nextProps);
        expect(spy.calledWith({suggestions: ['one', 'two', 'three']})).toBe(true);
    });

    it('should clear suggestions when props update', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        let nextProps = getProps();
        nextProps.geonames.error = 'Fake error';
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

    it('handleChange should call getGeonames', () => {
        let props = getProps();
        props.getGeonames = sinon.spy();
        const wrapper = shallow(<SearchAOIToolbar {...props}/>);
        wrapper.instance().handleChange('rio');
        expect(props.getGeonames.calledWith('rio')).toEqual(true);
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
