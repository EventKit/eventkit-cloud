import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import { Typeahead, Menu } from 'react-bootstrap-typeahead';
import { SearchAOIToolbar } from '../../components/MapTools/SearchAOIToolbar';
import SearchAOIButton from '../../components/MapTools/SearchAOIButton';
import TypeaheadMenuItem from '../../components/MapTools/TypeaheadMenuItem';

describe('SearchAOIToolbar button', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        toolbarIcons: { search: 'DEFAULT' },
        classes: {},
        geocode: {
            fetching: false,
            fetched: false,
            geocode: [],
            error: null,
        },
        setGeocodeEmpty: () => {},
        getGeocode: () => {},
        handleSearch: () => {},
        handleCancel: () => {},
        setAllButtonsDefault: () => {},
        setSearchAOIButtonSelected: () => {},
        ...(global as any).eventkit_test_props,
    });

    it('should render a searchbar and button', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props} />);
        expect(wrapper.find(Typeahead)).toHaveLength(1);
        expect(wrapper.find(Menu)).toHaveLength(0);
        expect(wrapper.find(TypeaheadMenuItem)).toHaveLength(0);
        expect(wrapper.find(SearchAOIButton)).toHaveLength(1);
    });

    it('should setup debouncer before shallowing', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props} />);
        expect(wrapper.instance().debouncer).toBeDefined();
        expect(wrapper.instance().debouncer).toBeInstanceOf(Function);
    });

    it('should handle geocode passed in', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props} />);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        const nextProps = getProps();
        nextProps.geocode.fetched = true;
        nextProps.geocode.data = ['one', 'two', 'three'];
        wrapper.setProps(nextProps);
        expect(spy.calledWith({ suggestions: ['one', 'two', 'three'] })).toBe(true);
    });

    it('should clear suggestions when props update', () => {
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props} />);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        const nextProps = getProps();
        nextProps.geocode.error = 'Fake error';
        wrapper.setState({ suggestions: ['one', 'two', 'three'] });
        wrapper.setProps(nextProps);
        expect(spy.calledWith({ suggestions: [] })).toBe(true);
    });

    it('handleInputChange should reset the suggestions', () => {
        const suggestions = ['one', 'two'];
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props} />);
        const nextProps = getProps();
        nextProps.geocode.fetched = true;
        nextProps.geocode.data = suggestions;
        wrapper.setProps(nextProps);
        expect(wrapper.state().suggestions).toEqual(suggestions);
        wrapper.instance().handleInputChange('e');
        expect(wrapper.state().suggestions.length).toEqual(0);
    });

    it('handleChange should call getGeocode', () => {
        const props = getProps();
        props.getGeocode = sinon.spy();
        const wrapper = shallow(<SearchAOIToolbar {...props} />);
        wrapper.instance().handleChange('rio');
        expect(props.getGeocode.calledWith('rio')).toEqual(true);
    });

    it('handleEnter should not clear the suggestions', () => {
        const suggestions = ['one', 'two'];
        const props = getProps();
        const wrapper = shallow(<SearchAOIToolbar {...props} />);
        const nextProps = getProps();
        nextProps.geocode.fetched = true;
        nextProps.geocode.data = suggestions;
        wrapper.setProps(nextProps);
        expect(wrapper.state().suggestions).toEqual(suggestions);
        wrapper.instance().handleEnter('');
        expect(wrapper.state().suggestions.length).toEqual(2);
    });
});
