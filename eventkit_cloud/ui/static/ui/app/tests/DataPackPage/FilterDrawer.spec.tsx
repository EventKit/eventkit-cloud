import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Drawer from '@material-ui/core/Drawer';
import { FilterDrawer } from '../../components/DataPackPage/FilterDrawer';
import PermissionFilter from '../../components/DataPackPage/PermissionsFilter';
import StatusFilter from '../../components/DataPackPage/StatusFilter';
import DateFilter from '../../components/DataPackPage/DateFilter';
import FilterHeader from '../../components/DataPackPage/FilterHeader';
import CustomScrollbar from '../../components/CustomScrollbar';
import ProvidersFilter from '../../components/DataPackPage/ProvidersFilter';

describe('FilterDrawer component', () => {
    const providers = [
        {
            id: 2,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            service_description: 'OpenStreetMap vector data.',
            display: true,
            export_provider_type: 2,
        },
    ];
    const getProps = () => ({
        onFilterApply: sinon.spy(),
        onFilterClear: sinon.spy(),
        open: true,
        providers,
        groups: [
            { id: 'group1', name: 'group1', members: ['user1', 'user2', 'user3'] },
            { id: 'group2', name: 'group2', members: ['user1', 'user2'] },
            { id: 'group3', name: 'group3', members: ['user1'] },
        ],
        members: [],
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<FilterDrawer {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render all the basic components', () => {
        expect(wrapper.find(Drawer)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(FilterHeader)).toHaveLength(1);
        expect(wrapper.find(PermissionFilter)).toHaveLength(1);
        expect(wrapper.find(StatusFilter)).toHaveLength(1);
        expect(wrapper.find(DateFilter)).toHaveLength(1);
        expect(wrapper.find(ProvidersFilter)).toHaveLength(1);
    });

    it('handleFilterApply should just call props.onFilterApply with current state', () => {
        const state = wrapper.state();
        instance.handleFilterApply();
        expect(props.onFilterApply.calledOnce).toBe(true);
        expect(props.onFilterApply.calledWith(state)).toBe(true);
    });

    it('handleFilterClear should reset the state and call props.onFilterClear', () => {
        const initialState = {
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
            minDate: new Date(),
            maxDate: new Date(),
            status: {
                completed: true,
                incomplete: true,
                submitted: false,
            },
            providers: { osm: true },
        };
        wrapper.setState(initialState);
        const stateStub = sinon.stub(instance, 'setState');
        const expectedState = {
            permissions: {
                value: '',
                groups: {},
                members: {},
            },
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            providers: {},
        };
        expect(wrapper.state()).toEqual(initialState);
        instance.handleFilterClear();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith(expectedState)).toBe(true);
        expect(props.onFilterClear.calledOnce).toBe(true);
        stateStub.restore();
    });

    it('handlePermissionsChange should set state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const permissions = {
            value: 'SHARED',
            groups: { group_one: 'READ' },
            members: {},
        };
        instance.handlePermissionsChange(permissions);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions }));
        stateStub.restore();
    });

    it('handleStatusChange should set state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleStatusChange({ completed: true });
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({
            status: { completed: true, incomplete: false, submitted: false },
        })).toBe(true);
        stateStub.restore();
    });

    it('handleProvidersChange should add the provider to state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleProvidersChange(providers[0].slug, true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ providers: { [providers[0].slug]: true } })).toBe(true);
        stateStub.restore();
    });

    it('handleProvidersChange should remove the provider from state', () => {
        const initialValue = {};
        initialValue[providers[0].slug] = true;
        wrapper.setState({ providers: initialValue });
        const stateStub = sinon.stub(instance, 'setState');
        const expectedValue = {};
        expect(wrapper.state().providers).toEqual(initialValue);
        instance.handleProvidersChange(providers[0].slug, false);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ providers: expectedValue })).toBe(true);
    });

    it('handleMinDate should set state', () => {
        const date = new Date(2017, 2, 30);
        const e = { target: { value: date } };
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleMinDate(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ minDate: date }));
        stateStub.restore();
    });

    it('handleMaxDate should set state', () => {
        const date = new Date(2017, 2, 30);
        const e = { target: { value: date } };
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleMaxDate(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ maxDate: date }));
        stateStub.restore();
    });
});
