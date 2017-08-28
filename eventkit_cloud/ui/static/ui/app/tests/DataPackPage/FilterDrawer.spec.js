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

describe('FilterDrawer component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            onFilterApply: () => {},
            onFilterClear: () => {},
            open: true
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

