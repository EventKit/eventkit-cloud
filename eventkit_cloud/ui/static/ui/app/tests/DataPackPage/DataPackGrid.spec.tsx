import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import ImageList from '@material-ui/core/ImageList';
import { DataPackGrid } from '../../components/DataPackPage/DataPackGrid';

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

    it('getColumns should return 2, 3, or 4 depending on screensize', () => {
        wrapper.setProps({ width: 'sm' });
        expect(wrapper.find(ImageList).props().cols).toEqual(2);

        wrapper.setProps({ width: 'lg' });
        expect(wrapper.find(ImageList).props().cols).toEqual(3);

        wrapper.setProps({ width: 'xl' });
        expect(wrapper.find(ImageList).props().cols).toEqual(4);
    });
});
