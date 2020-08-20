import * as React from 'react';
import * as sinon from 'sinon';
import {createShallow} from '@material-ui/core/test-utils';
import {Typeahead, Menu} from 'react-bootstrap-typeahead';
import TypeaheadMenuItem from "../../components/MapTools/TypeaheadMenuItem";
import SearchAOIButton from "../../components/MapTools/SearchAOIButton";
import {SearchGroupsToolbar} from "../../components/UserGroupsPage/SearchGroupsToolbar";

describe('SearchAOIToolbar button', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        toolbarIcons: {search: 'DEFAULT'},
        classes: {},
        groups: {
            fetching: false,
            fetched: false,
            geocode: [],
            error: null,
            data: [],
            cancelSource: false,
        },
        getGroups: sinon.spy(),
        getSearchedGroups: sinon.spy(),
        setFetchingGroups: sinon.spy(),
        setQuery: sinon.spy(),
        user: {},
        pageSize: 10,
        page: 1,
        permission_level: 'admin',
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => shallow(<SearchGroupsToolbar {...props}/>);

    it('should render a searchbar and button', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Typeahead)).toHaveLength(1);
        expect(wrapper.find(Menu)).toHaveLength(0);
        expect(wrapper.find(TypeaheadMenuItem)).toHaveLength(0);
        expect(wrapper.find(SearchAOIButton)).toHaveLength(1);
    });

    it('should setup debouncer once toolbar has mounted', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.instance().debouncer).toBeDefined();
        expect(wrapper.instance().debouncer).toBeInstanceOf(Function);
    });

    it('should handle groups passed in', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        const nextProps = getProps();
        nextProps.groups.fetched = true;
        nextProps.groups.data = ['first', 'second', 'third'];
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({suggestions: ['first', 'second', 'third']})).toBe(true);
    });

    it('should clear suggestions when props update', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.spy(wrapper.instance(), 'setState');
        const nextProps = getProps();
        nextProps.groups.error = 'Error due to groups not fetched';
        wrapper.setState({suggestions: ['first', 'second', 'third']});
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({suggestions: []})).toBe(true);
    });

    it('handleInputChange should reset the suggestions', () => {
        const suggestions = ['first', 'second'];
        const props = getProps();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.groups.fetched = true;
        nextProps.groups.data = suggestions;
        wrapper.setProps(nextProps);
        expect(wrapper.state().suggestions).toEqual(suggestions);
        wrapper.instance().handleInputChange('e');
        expect(wrapper.state().suggestions.length).toEqual(0);
    });
});
