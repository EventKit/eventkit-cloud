import { mount } from 'enzyme';
import CircularProgress from '@material-ui/core/CircularProgress';
import { PageLoading } from '../../components/common/PageLoading';

describe('Loading component', () => {
    it('should render basic elemets', () => {
        const wrapper = mount(PageLoading({ ...global.eventkit_test_props }));
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });
});
