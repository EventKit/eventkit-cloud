import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import GridList from '@material-ui/core/GridList';
import NavigationArrowDropDown from '@material-ui/icons/ArrowDropDown';
import NavigationArrowDropUp from '@material-ui/icons/ArrowDropUp';
import { DataPackList } from '../../components/DataPackPage/DataPackList';
import DataPackListItem from '../../components/DataPackPage/DataPackListItem';
import DataPackTableItem from '../../components/DataPackPage/DataPackTableItem';
import CustomScrollbar from '../../components/CustomScrollbar';

describe('DataPackList component', () => {
    const getProps = () => ({
        runIds: ['123', '456', '789'],
        user: { data: { user: { username: 'admin' } } },
        onRunDelete: sinon.spy(),
        onRunShare: sinon.spy(),
        onSort: sinon.spy(),
        order: '-started_at',
        users: [],
        groups: [],
        providers: [],
        width: 'md',
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;

    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataPackList {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render list items as part of the mobile view', () => {
        wrapper.setProps({ width: 'xs' });
        expect(wrapper.find(GridList)).toHaveLength(1);
        expect(wrapper.find(DataPackListItem)).toHaveLength(3);
        expect(wrapper.find(Table)).toHaveLength(0);
    });

    it('should render table items as part of the desktop view', () => {
        wrapper.setProps({ width: 'lg' });
        expect(wrapper.find(GridList)).toHaveLength(0);
        expect(wrapper.find(Table)).toHaveLength(2);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(Table).first().find(TableRow)).toHaveLength(1);
        expect(wrapper.find(Table).first().find(TableCell)).toHaveLength(8);
        const headerColumns = wrapper.find(Table).first().find(TableCell);
        expect(headerColumns.at(0).html()).toContain('Name');
        expect(headerColumns.at(0).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(1).html()).toContain('Event');
        expect(headerColumns.at(1).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(2).html()).toContain('Date Added');
        expect(headerColumns.at(2).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(3).html()).toContain('Status');
        expect(headerColumns.at(3).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(4).html()).toContain('Permissions');
        expect(headerColumns.at(4).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(5).html()).toContain('Owner');
        expect(headerColumns.at(5).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(6).html()).toContain('Featured');
        expect(headerColumns.at(6).find(NavigationArrowDropDown)).toHaveLength(1);
        expect(headerColumns.at(7).html()).toContain('');
        expect(wrapper.find(Table).first().find(TableBody)).toHaveLength(1);
        expect(wrapper.find(DataPackTableItem)).toHaveLength(3);
    });

    it('name column header should call handleOrder onclick', () => {
        const orderStub = sinon.stub(instance, 'handleOrder');
        expect(orderStub.called).toBe(false);
        wrapper.find(TableCell).at(0).find('div').simulate('click');
        expect(orderStub.called).toBe(true);
        expect(orderStub.calledWith('job__name')).toBe(true);
        orderStub.restore();
    });

    it('event column header should call handleOrder onclick', () => {
        const orderStub = sinon.stub(instance, 'handleOrder');
        expect(orderStub.called).toBe(false);
        wrapper.find(TableCell).at(1).find('div').simulate('click');
        expect(orderStub.called).toBe(true);
        expect(orderStub.calledWith('job__event')).toBe(true);
        orderStub.restore();
    });

    it('date column header should call handleOrder onclick', () => {
        const orderStub = sinon.stub(instance, 'handleOrder');
        expect(orderStub.called).toBe(false);
        wrapper.find(TableCell).at(2).find('div').simulate('click');
        expect(orderStub.called).toBe(true);
        expect(orderStub.calledWith('-started_at')).toBe(true);
        orderStub.restore();
    });

    it('status column header should call handleOrder onclick', () => {
        const orderStub = sinon.stub(instance, 'handleOrder');
        expect(orderStub.called).toBe(false);
        wrapper.find(TableCell).at(3).find('div').simulate('click');
        expect(orderStub.called).toBe(true);
        expect(orderStub.calledWith('status')).toBe(true);
        orderStub.restore();
    });

    it('permissions column header should call handleOrder onclick', () => {
        const orderStub = sinon.stub(instance, 'handleOrder');
        expect(orderStub.called).toBe(false);
        wrapper.find(TableCell).at(4).find('div').simulate('click');
        expect(orderStub.called).toBe(true);
        expect(orderStub.calledWith('job__published')).toBe(true);
        orderStub.restore();
    });

    it('owner column header should call handleOrder onclick', () => {
        const orderStub = sinon.stub(instance, 'handleOrder');
        expect(orderStub.called).toBe(false);
        wrapper.find(TableCell).at(5).find('div').simulate('click');
        expect(orderStub.called).toBe(true);
        expect(orderStub.calledWith('user__username')).toBe(true);
        orderStub.restore();
    });

    it('featured colum header should call handleOrder onClick', () => {
        const orderStub = sinon.stub(instance, 'handleOrder');
        expect(orderStub.called).toBe(false);
        wrapper.find(TableCell).at(6).find('div').simulate('click');
        expect(orderStub.called).toBe(true);
        expect(orderStub.calledWith('-job__featured')).toBe(true);
    });

    it('handleOrder should call isSameOrderType and props.onSort', () => {
        const isSameSpy = sinon.spy(instance, 'isSameOrderType');

        let newOrder = 'job__name';
        instance.handleOrder(newOrder);
        expect(isSameSpy.calledWith('-started_at', 'job__name')).toBe(true);
        expect(props.onSort.calledOnce).toBe(true);
        expect(props.onSort.calledWith(newOrder)).toBe(true);

        newOrder = 'started_at';
        instance.handleOrder(newOrder);
        expect(isSameSpy.calledWith('-started_at', 'started_at')).toBe(true);
        expect(props.onSort.calledTwice).toBe(true);
        expect(props.onSort.calledWith(newOrder)).toBe(true);

        const nextProps = getProps();
        nextProps.order = 'started_at';
        nextProps.onSort = props.onSort;
        wrapper.setProps(nextProps);
        newOrder = '-started_at';
        instance.handleOrder(newOrder);
        expect(isSameSpy.calledWith('started_at', '-started_at')).toBe(true);
        expect(props.onSort.calledThrice).toBe(true);
        expect(props.onSort.calledWith(newOrder)).toBe(true);

        isSameSpy.restore();
    });

    it('isSameOrderType should return true or false', () => {
        expect(instance.isSameOrderType('-started_at', 'started_at')).toBe(true);
        expect(instance.isSameOrderType('job__name', 'started_at')).toBe(false);
    });

    it('getIcon should return up arrow if activeSort is equal to passed in sort, else it return down arrow', () => {
        let icon = instance.getIcon('started_at');
        expect(icon).toEqual((
            <NavigationArrowDropDown
                className="qa-DataPackList-NavigationArrowDropDown"
                style={{ verticalAlign: 'middle', marginBottom: '2px', fill: '#4598bf' }}
            />
        ));
        icon = instance.getIcon('-started_at');
        expect(icon).toEqual((
            <NavigationArrowDropUp
                className="qa-DataPackList-NavigationArrowDropUp"
                style={{ verticalAlign: 'middle', marginBottom: '2px', fill: '#4598bf' }}
            />
        ));
    });

    it('getHeaderStyle should return bold black style if true or inherit style if false', () => {
        let style = instance.getHeaderStyle(true);
        expect(style).toEqual({ color: '#000', fontWeight: 'bold' });
        style = instance.getHeaderStyle(false);
        expect(style).toEqual({ color: 'inherit' });
    });
});
