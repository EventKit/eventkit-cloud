import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Drawer from 'material-ui/Drawer';
import FilterDrawer from '../../components/DataPackPage/FilterDrawer';
import PermissionFilter from '../../components/DataPackPage/PermissionsFilter';
import StatusFilter from '../../components/DataPackPage/StatusFilter';
import DateFilter from '../../components/DataPackPage/DateFilter';
import FilterHeader from '../../components/DataPackPage/FilterHeader';
import CustomScrollbar from '../../components/CustomScrollbar';
import ProvidersFilter from '../../components/DataPackPage/ProvidersFilter';

describe('FilterDrawer component', () => {
    const muiTheme = getMuiTheme();
    const providers = [
        {
            "id": 2,
            "model_url": "http://cloud.eventkit.dev/api/providers/osm",
            "type": "osm",
            "license": null,
            "created_at": "2017-08-15T19:25:10.844911Z",
            "updated_at": "2017-08-15T19:25:10.844919Z",
            "uid": "bc9a834a-727a-4779-8679-2500880a8526",
            "name": "OpenStreetMap Data (Themes)",
            "slug": "osm",
            "preview_url": "",
            "service_copyright": "",
            "service_description": "OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).",
            "layer": null,
            "level_from": 0,
            "level_to": 10,
            "zip": false,
            "display": true,
            "export_provider_type": 2
        },
    ];
    const getProps = () => (
        {
            onFilterApply: () => {},
            onFilterClear: () => {},
            open: true,
            providers,
            groups: [
                { id: 'group1', name: 'group1', members: ['user1', 'user2', 'user3'] },
                { id: 'group2', name: 'group2', members: ['user1', 'user2'] },
                { id: 'group3', name: 'group3', members: ['user1'] },
            ],
        }
    );

    const getWrapper = props => (
        mount(<FilterDrawer {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        })
    );

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Drawer)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(FilterHeader)).toHaveLength(1);
        expect(wrapper.find(PermissionFilter)).toHaveLength(1);
        expect(wrapper.find(StatusFilter)).toHaveLength(1);
        expect(wrapper.find(DateFilter)).toHaveLength(1);
        expect(wrapper.find(ProvidersFilter)).toHaveLength(1);
    });

    it('componentWillReceiveProps should the first groups into state', () => {
        const props = getProps();
        const groups = [...props.groups];
        props.groups = [];
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.groups = groups;
        wrapper.setProps(nextProps);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({
            selectedGroups: nextProps.groups.map(group => group.id),
        })).toBe(true);
        stateStub.restore();
    });

    it('handleFilterApply should just call props.onFilterApply with current state', () => {
        const props = getProps();
        props.onFilterApply = sinon.spy();
        const wrapper = getWrapper(props);
        const state = wrapper.state();
        wrapper.instance().handleFilterApply();
        expect(props.onFilterApply.calledOnce).toBe(true);
        expect(props.onFilterApply.calledWith(state)).toBe(true);
    });

    it('handleFilterClear should reset the state and call props.onFilterClear', () => {
        const props = getProps();
        props.onFilterClear = sinon.spy();
        const initialState = {
            permissions: 'group',
            minDate: new Date(),
            maxDate: new Date(),
            status: {
                completed: true,
                incomplete: true,
                submitted: false,
            },
            providers: { osm: true },
            selectedGroups: props.groups.map(group => group.id),
        };
        const wrapper = getWrapper(props);
        wrapper.setState(initialState);
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        const expectedState = {
            permissions: 'public',
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            providers: {},
            selectedGroups: props.groups.map(group => group.id),
        };
        expect(wrapper.state()).toEqual(initialState);
        wrapper.instance().handleFilterClear();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith(expectedState)).toBe(true);
        expect(props.onFilterClear.calledOnce).toBe(true);
        stateStub.restore();
    });

    it('handlePermissionsChange should set state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        wrapper.instance().handlePermissionsChange(null, 'value');
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ published: 'value' }));
        stateStub.restore();
    });

    it('handleStatusChange should set state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        wrapper.instance().handleStatusChange({ completed: true });
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({
            status: { completed: true, incomplete: false, submitted: false },
        })).toBe(true);
        stateStub.restore();
    });

    it('handleProvidersChange should add the provider to state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        wrapper.instance().handleProvidersChange(providers[0].slug, true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ providers: { [providers[0].slug]: true } })).toBe(true);
        stateStub.restore();
    });

    it('handleProvidersChange should remove the provider from state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const initialValue = {};
        initialValue[providers[0].slug] = true;
        wrapper.setState({ providers: initialValue });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const expectedValue = {};
        expect(wrapper.state().providers).toEqual(initialValue);
        wrapper.instance().handleProvidersChange(providers[0].slug, false);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ providers: expectedValue })).toBe(true);
    });

    it('handleMinDate should set state', () => {
        const props = getProps();
        const date = new Date(2017, 2, 30);
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        wrapper.instance().handleMinDate(null, date);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ minDate: date }));
        stateStub.restore();
    });

    it('handleMaxDate should set state', () => {
        const props = getProps();
        const date = new Date(2017, 2, 30);
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        wrapper.instance().handleMaxDate(null, date);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ maxDate: date }));
        stateStub.restore();
    });

    it('handleGroupSelect should remove a group from the state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.state().selectedGroups).toEqual(props.groups.map(group => group.id));
        wrapper.setState({ selectedGroups: [props.groups[0].id] });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleGroupSelect(props.groups[0]);
        expect(stateStub.calledOnce).toBe(true);
        const expectedGroups = [];
        expect(stateStub.calledWith({ selectedGroups: expectedGroups })).toBe(true);
        stateStub.restore();
    });

    it('handleGroupSelect should add a group to the state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.state().selectedGroups).toEqual(props.groups.map(group => group.id));
        wrapper.setState({ selectedGroups: [props.groups[0].id] });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const newGroup = { id: 'groupX', name: 'groupX' };
        wrapper.instance().handleGroupSelect(newGroup);
        expect(stateStub.calledOnce).toBe(true);
        const expectedGroups = [props.groups[0].id, newGroup.id];
        expect(stateStub.calledWith({ selectedGroups: expectedGroups })).toBe(true);
        stateStub.restore();
    });

    it('handleGroupSelect should clear groups and add only one if all are selected', () => {
        const props = getProps();
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(wrapper.state().selectedGroups).toEqual(props.groups.map(group => group.id));
        wrapper.instance().handleGroupSelect(props.groups[0]);
        expect(stateStub.calledOnce).toBe(true);
        const expectedGroups = [props.groups[0].id];
        expect(stateStub.calledWith({ selectedGroups: expectedGroups })).toBe(true);
        stateStub.restore();
    });

    it('handleAllGroupSelect should set state to empty array', () => {
        const props = getProps();
        const stateStub = sinon.stub(FilterDrawer.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleAllGroupSelect();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedGroups: [] })).toBe(true);
        stateStub.restore();
    });

    it('handleAllGroupSelect should set state to all groups', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ selectedGroups: [] });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleAllGroupSelect();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({
            selectedGroups: props.groups.map(group => group.id),
        })).toBe(true);
        stateStub.restore();
    });
});

