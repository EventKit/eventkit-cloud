import { createShallow } from '@material-ui/core/test-utils';
import ZoomLevelLabel from '../../components/MapTools/ZoomLevelLabel';

describe('ZoomLevelLabel component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        zoomLevel: 2,
        ...global.eventkit_test_props,
    });

    const getShallowWrapper = (props = getProps()) => shallow(<ZoomLevelLabel {...props} />);

    it('should display zoom level', () => {
        const wrapper = getShallowWrapper();
        wrapper.setProps({ zoomLevel: 5 });
        expect(wrapper.find('div').text()).toBe('Zoom Level: 5');
    });
});
