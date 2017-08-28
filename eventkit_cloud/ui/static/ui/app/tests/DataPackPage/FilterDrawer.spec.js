import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Drawer from 'material-ui/Drawer';
import FilterDrawer from '../../components/DataPackPage/FilterDrawer';
import PermissionFilter from '../../components/DataPackPage/PermissionsFilter';
import StatusFilter from '../../components/DataPackPage/StatusFilter';
import DateFilter from '../../components/DataPackPage/DateFilter';
import FilterHeader from '../../components/DataPackPage/FilterHeader';
import CustomScrollbar from '../../components/CustomScrollbar';
import ProvidersFilter from "../../components/DataPackPage/ProvidersFilter";

describe('FilterDrawer component', () => {
    injectTapEventPlugin();
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
    const getProps = () => {
        return {
            onFilterApply: () => {},
            onFilterClear: () => {},
            open: true,
            providers: providers,
        }
    };

    const getWrapper = (props) => {
        return mount(<FilterDrawer {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    }

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

    it('handleFilterApply should just call props.onFilterApply with current state', () => {
        let props = getProps();
        props.onFilterApply = new sinon.spy();
        const wrapper = getWrapper(props);
        const state = wrapper.state();
        wrapper.instance().handleFilterApply();
        expect(props.onFilterApply.calledOnce).toBe(true);
        expect(props.onFilterApply.calledWith(state)).toBe(true);
    });

    it('handleFilterClear should reset the state and call props.onFilterClear', () => {
        let props = getProps();
        props.onFilterClear = new sinon.spy();
        const initialState = {published: 'True', minDate: new Date(), maxDate: new Date(), status: {completed: true, incomplete: true, submitted: false}, providers: {osm: true}};
        const wrapper = getWrapper(props);
        wrapper.setState(initialState);
        const stateSpy = new sinon.spy(FilterDrawer.prototype, 'setState');
        const expectedState = {
            published: null,
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            providers: {},
        }
        expect(wrapper.state()).toEqual(initialState);
        wrapper.instance().handleFilterClear();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith(expectedState)).toBe(true);
        expect(props.onFilterClear.calledOnce).toBe(true);
        stateSpy.restore();
    })

    it('handlePermissionsChange should set state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(FilterDrawer.prototype, 'setState');
        wrapper.instance().handlePermissionsChange(null, 'value');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({published: 'value'}));
        stateSpy.restore();
    });

    it('handleStatusChange should set state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(FilterDrawer.prototype, 'setState');
        wrapper.instance().handleStatusChange({completed: true});
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({status: {completed: true, incomplete: false, submitted: false}})).toBe(true);
        stateSpy.restore();
    });

    it('handleProvidersChange should set state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(FilterDrawer.prototype, 'setState');
        wrapper.instance().handleProvidersChange(providers[0].slug, true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providers: {[providers[0].slug]: true}})).toBe(true);
        stateSpy.restore();
    });

    it('handleMinDate should set state', () => {
        const props = getProps();
        const date = new Date(2017,2,30);
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(FilterDrawer.prototype, 'setState');
        wrapper.instance().handleMinDate(null, date);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({minDate: date}));
        stateSpy.restore();
    });

    it('handleMaxDate should set state', () => {
        const props = getProps();
        const date = new Date(2017,2,30);
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(FilterDrawer.prototype, 'setState');
        wrapper.instance().handleMaxDate(null, date);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({maxDate: date}));
        stateSpy.restore();
    });
});

