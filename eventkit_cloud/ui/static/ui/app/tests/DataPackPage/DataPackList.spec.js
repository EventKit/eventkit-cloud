import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { shallow, mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Table, TableBody, TableHeader, TableHeaderColumn } from 'material-ui/Table';
import { GridList } from 'material-ui/GridList';
import NavigationArrowDropDown from '@material-ui/icons/ArrowDropDown';
import NavigationArrowDropUp from '@material-ui/icons/ArrowDropUp';
import DataPackList from '../../components/DataPackPage/DataPackList';
import DataPackListItem from '../../components/DataPackPage/DataPackListItem';
import DataPackTableItem from '../../components/DataPackPage/DataPackTableItem';
import CustomScrollbar from '../../components/CustomScrollbar';

describe('DataPackList component', () => {
    const muiTheme = getMuiTheme();
    const providers = [
        {
            id: 2,
            model_url: 'http://cloud.eventkit.test/api/providers/osm',
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            preview_url: '',
            service_copyright: '',
            service_description: 'OpenStreetMap vector data.',
            layer: null,
            level_from: 0,
            level_to: 10,
            zip: false,
            display: true,
            export_provider_type: 2,
        },
    ];

    function getRuns() {
        return [
            {
                uid: '6870234f-d876-467c-a332-65fdf0399a0d',
                url: 'http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d',
                started_at: '2017-03-10T15:52:35.637331Z',
                finished_at: '2017-03-10T15:52:39.837Z',
                user: 'admin',
                status: 'COMPLETED',
                job: {
                    uid: '7643f806-1484-4446-b498-7ddaa65d011a',
                    name: 'Test1',
                    event: 'Test1 event',
                    description: 'Test1 description',
                    url: 'http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a',
                    extent: {},
                    permissions: {
                        value: 'PRIVATE',
                        groups: {},
                        members: {},
                    },
                },
                provider_tasks: [],
                expiration: '2017-03-24T15:52:35.637258Z',
            },
            {
                uid: 'c7466114-8c0c-4160-8383-351414b11e37',
                url: 'http://cloud.eventkit.test/api/runs/c7466114-8c0c-4160-8383-351414b11e37',
                started_at: '2017-03-10T15:52:29.311523Z',
                finished_at: '2017-03-10T15:52:33.612Z',
                user: 'notAdmin',
                status: 'COMPLETED',
                job: {
                    uid: '5488a864-89f2-4e9c-8370-18291ecdae4a',
                    name: 'Test2',
                    event: 'Test2 event',
                    description: 'Test2 description',
                    url: 'http://cloud.eventkit.test/api/jobs/5488a864-89f2-4e9c-8370-18291ecdae4a',
                    extent: {},
                    permissions: {
                        value: 'PRIVATE',
                        groups: {},
                        members: {},
                    },
                },
                provider_tasks: [],
                expiration: '2017-03-24T15:52:29.311458Z',
            },
            {
                uid: '282816a6-7d16-4f59-a1a9-18764c6339d6',
                url: 'http://cloud.eventkit.test/api/runs/282816a6-7d16-4f59-a1a9-18764c6339d6',
                started_at: '2017-03-10T15:52:18.796929Z',
                finished_at: '2017-03-10T15:52:27.500Z',
                user: 'admin',
                status: 'COMPLETED',
                job: {
                    uid: '78bbd59a-4066-4e30-8460-c7b0093a0d7a',
                    name: 'Test3',
                    event: 'Test3 event',
                    description: 'Test3 description',
                    url: 'http://cloud.eventkit.test/api/jobs/78bbd59a-4066-4e30-8460-c7b0093a0d7a',
                    extent: {},
                    permissions: {
                        value: 'PRIVATE',
                        groups: {},
                        members: {},
                    },
                },
                provider_tasks: [],
                expiration: '2017-03-24T15:52:18.796854Z',
            },
        ];
    }

    const getProps = () => ({
        runs: getRuns(),
        user: { data: { user: { username: 'admin' } } },
        onRunDelete: () => {},
        onRunShare: () => {},
        onSort: () => {},
        order: '-started_at',
        users: [],
        groups: [],
        providers,
    });

    const getWrapper = props => mount(<DataPackList {...props} />, {
        context: { muiTheme },
        childContextTypes: { muiTheme: PropTypes.object },
    });

    it('should render list items as part of the mobile view', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        // ensure the screen is small
        window.resizeTo(556, 600);
        expect(window.innerWidth).toEqual(556);
        wrapper.instance().forceUpdate();
        wrapper.update();

        expect(wrapper.find(GridList)).toHaveLength(1);
        expect(wrapper.find(DataPackListItem)).toHaveLength(3);
        expect(wrapper.find(Table)).toHaveLength(0);
    });

    it('should render table items as part of the desktop view', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        // ensure the screen is large
        window.resizeTo(1250, 800);
        expect(window.innerWidth).toEqual(1250);
        wrapper.instance().forceUpdate();
        wrapper.update();

        expect(wrapper.find(GridList)).toHaveLength(0);
        expect(wrapper.find(Table)).toHaveLength(2);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(TableHeader)).toHaveLength(1);
        expect(wrapper.find(TableHeaderColumn)).toHaveLength(8);
        const headerColumns = wrapper.find(TableHeaderColumn);
        expect(headerColumns.at(0).text()).toEqual('Name');
        expect(headerColumns.at(0).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(1).text()).toEqual('Event');
        expect(headerColumns.at(1).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(2).text()).toEqual('Date Added');
        expect(headerColumns.at(2).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(3).text()).toEqual('Status');
        expect(headerColumns.at(3).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(4).text()).toEqual('Permissions');
        expect(headerColumns.at(4).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(5).text()).toEqual('Owner');
        expect(headerColumns.at(5).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(6).text()).toEqual('Featured');
        expect(headerColumns.at(6).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(7).text()).toEqual('');
        expect(wrapper.find(TableBody)).toHaveLength(1);
        expect(wrapper.find(DataPackTableItem)).toHaveLength(3);
    });

    it('name column header should call handleOrder onclick', () => {
        const props = getProps();
        const orderSpy = sinon.spy(DataPackList.prototype, 'handleOrder');
        const wrapper = getWrapper(props);
        expect(orderSpy.called).toBe(false);
        wrapper.find(TableHeaderColumn).at(0).find('div').simulate('click');
        expect(orderSpy.called).toBe(true);
        expect(orderSpy.calledWith('job__name')).toBe(true);
        orderSpy.restore();
    });

    it('event column header should call handleOrder onclick', () => {
        const props = getProps();
        const orderSpy = sinon.spy(DataPackList.prototype, 'handleOrder');
        const wrapper = getWrapper(props);
        expect(orderSpy.called).toBe(false);
        wrapper.find(TableHeaderColumn).at(1).find('div').simulate('click');
        expect(orderSpy.called).toBe(true);
        expect(orderSpy.calledWith('job__event')).toBe(true);
        orderSpy.restore();
    });

    it('date column header should call handleOrder onclick', () => {
        const props = getProps();
        const orderSpy = sinon.spy(DataPackList.prototype, 'handleOrder');
        const wrapper = getWrapper(props);
        expect(orderSpy.called).toBe(false);
        wrapper.find(TableHeaderColumn).at(2).find('div').simulate('click');
        expect(orderSpy.called).toBe(true);
        expect(orderSpy.calledWith('-started_at')).toBe(true);
        orderSpy.restore();
    });

    it('status column header should call handleOrder onclick', () => {
        const props = getProps();
        const orderSpy = sinon.spy(DataPackList.prototype, 'handleOrder');
        const wrapper = getWrapper(props);
        expect(orderSpy.called).toBe(false);
        wrapper.find(TableHeaderColumn).at(3).find('div').simulate('click');
        expect(orderSpy.called).toBe(true);
        expect(orderSpy.calledWith('status')).toBe(true);
        orderSpy.restore();
    });

    it('permissions column header should call handleOrder onclick', () => {
        const props = getProps();
        const orderSpy = sinon.spy(DataPackList.prototype, 'handleOrder');
        const wrapper = getWrapper(props);
        expect(orderSpy.called).toBe(false);
        wrapper.find(TableHeaderColumn).at(4).find('div').simulate('click');
        expect(orderSpy.called).toBe(true);
        expect(orderSpy.calledWith('job__published')).toBe(true);
        orderSpy.restore();
    });

    it('owner column header should call handleOrder onclick', () => {
        const props = getProps();
        const orderSpy = sinon.spy(DataPackList.prototype, 'handleOrder');
        const wrapper = getWrapper(props);
        expect(orderSpy.called).toBe(false);
        wrapper.find(TableHeaderColumn).at(5).find('div').simulate('click');
        expect(orderSpy.called).toBe(true);
        expect(orderSpy.calledWith('user__username')).toBe(true);
        orderSpy.restore();
    });

    it('featured colum header should call handleOrder onClick', () => {
        const props = getProps();
        const orderSpy = sinon.spy(DataPackList.prototype, 'handleOrder');
        const wrapper = getWrapper(props);
        expect(orderSpy.called).toBe(false);
        wrapper.find(TableHeaderColumn).at(6).find('div').simulate('click');
        expect(orderSpy.called).toBe(true);
        expect(orderSpy.calledWith('-job__featured')).toBe(true);
    });

    it('handleOrder should call isSameOrderType and props.onSort', () => {
        const props = getProps();
        props.onSort = sinon.spy();
        const isSameSpy = sinon.spy(DataPackList.prototype, 'isSameOrderType');
        const wrapper = getWrapper(props);

        let newOrder = 'job__name';
        wrapper.instance().handleOrder(newOrder);
        expect(isSameSpy.calledWith('-started_at', 'job__name')).toBe(true);
        expect(props.onSort.calledOnce).toBe(true);
        expect(props.onSort.calledWith(newOrder)).toBe(true);

        newOrder = 'started_at';
        wrapper.instance().handleOrder(newOrder);
        expect(isSameSpy.calledWith('-started_at', 'started_at')).toBe(true);
        expect(props.onSort.calledTwice).toBe(true);
        expect(props.onSort.calledWith(newOrder)).toBe(true);

        const nextProps = getProps();
        nextProps.order = 'started_at';
        nextProps.onSort = props.onSort;
        wrapper.setProps(nextProps);
        newOrder = '-started_at';
        wrapper.instance().handleOrder(newOrder);
        expect(isSameSpy.calledWith('started_at', '-started_at')).toBe(true);
        expect(props.onSort.calledThrice).toBe(true);
        expect(props.onSort.calledWith(newOrder)).toBe(true);

        isSameSpy.restore();
    });

    it('isSameOrderType should return true or false', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props} />);
        expect(wrapper.instance().isSameOrderType('-started_at', 'started_at')).toBe(true);
        expect(wrapper.instance().isSameOrderType('job__name', 'started_at')).toBe(false);
    });

    it('getIcon should return up arrow if activeSort is equal to passed in sort, else it return down arrow', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props} />);
        let icon = wrapper.instance().getIcon('started_at');
        expect(icon).toEqual((
            <NavigationArrowDropDown
                className="qa-DataPackList-NavigationArrowDropDown"
                style={{ verticalAlign: 'middle', marginBottom: '2px', fill: '#4498c0' }}
            />
        ));
        icon = wrapper.instance().getIcon('-started_at');
        expect(icon).toEqual((
            <NavigationArrowDropUp
                className="qa-DataPackList-NavigationArrowDropUp"
                style={{ verticalAlign: 'middle', marginBottom: '2px', fill: '#4498c0' }}
            />
        ));
    });

    it('getHeaderStyle should return bold black style if true or inherit style if false', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackList {...props} />);
        let style = wrapper.instance().getHeaderStyle(true);
        expect(style).toEqual({ color: '#000', fontWeight: 'bold' });
        style = wrapper.instance().getHeaderStyle(false);
        expect(style).toEqual({ color: 'inherit' });
    });
});
