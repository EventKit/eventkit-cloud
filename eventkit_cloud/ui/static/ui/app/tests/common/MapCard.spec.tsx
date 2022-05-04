import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Collapse from '@mui/material/Collapse';
import { MapCard } from '../../components/common/MapCard';

describe('MapCard component', () => {
    let wrapper;
    let instance;

    const defaultProps = () => (
        {
            children: <span>Hello</span>,
            ...(global as any).eventkit_test_props,
        }
    );

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<MapCard {...props} />, {
            context: { config: { BASEMAP_URL: '', BASEMAP_COPYRIGHT: '' } },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('handleExpand should negate the open state', () => {
        const expected = !instance.state.open;
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleExpand();
        expect(stateSpy.calledOnce).toBe(true);
        expect(instance.state.open).toBe(expected);
        stateSpy.restore();
    });

});
