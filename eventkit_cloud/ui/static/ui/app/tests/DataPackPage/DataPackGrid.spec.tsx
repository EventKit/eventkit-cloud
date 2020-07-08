import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import GridList from '@material-ui/core/GridList';
import { DataPackGrid } from '../../components/DataPackPage/DataPackGrid';
import DataPackGridItem from '../../components/DataPackPage/DataPackGridItem';

describe('DataPackGrid component', () => {
    const getProps = () => ({
        runIds: ['123', '456', '789'],
        providers: [],
        user: { data: { user: { username: 'admin' } } },
        users: [],
        groups: [],
        onRunDelete: sinon.spy(),
        onRunShare: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;

    const setup = (override = {}) => {
        props = { ...getProps(), ...override };
        wrapper = shallow(<DataPackGrid {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render a DataPackGridItem for each runId', () => {
        const getColumnSpy = sinon.spy(DataPackGrid.prototype, 'getColumns');
        setup();
        expect(wrapper.find(GridList)).toHaveLength(1);
        expect(wrapper.find(DataPackGridItem)).toHaveLength(3);
        expect(getColumnSpy.calledOnce).toBe(true);
        getColumnSpy.restore();
    });

    it('getColumns should return 2, 3, or 4 depending on screensize', () => {
        wrapper.setProps({ width: 'sm' });
        let cols = instance.getColumns();
        expect(cols).toEqual(2);

        wrapper.setProps({ width: 'lg' });
        cols = instance.getColumns();
        expect(cols).toEqual(3);

        wrapper.setProps({ width: 'xl' });
        cols = instance.getColumns();
        expect(cols).toEqual(4);
    });
});
