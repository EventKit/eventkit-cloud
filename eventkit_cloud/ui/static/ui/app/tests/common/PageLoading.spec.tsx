import * as React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import CircularProgress from '@material-ui/core/CircularProgress';
import { PageLoading } from '../../components/common/PageLoading';

describe('Loading component', () => {
    const shallow = createShallow();
    const props = {
        classes: {
            full: 'full',
            partial: 'partial',
            progress: 'progress',
        },
        background: '',
        partial: false,
        ...(global as any).eventkit_test_props,
    };

    it('should render the progress component', () => {
        const wrapper = shallow(<PageLoading {...props} />);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('should use the partial className', () => {
        props.partial = true;
        const wrapper = shallow(<PageLoading {...props} />);
        expect(wrapper.find('.partial')).toHaveLength(1);
    });

    it('should use the full className', () => {
        props.partial = false;
        const wrapper = shallow(<PageLoading {...props} />);
        expect(wrapper.find('.full')).toHaveLength(1);
    });

    it('should have no background', () => {
        props.background = '';
        const wrapper = shallow(<PageLoading {...props} />);
        expect(wrapper.find('div').props().style.backgroundColor).toBe(undefined);
        expect(wrapper.find('div').props().style.backgroundImage).toBe(undefined);
    });

    it('should use solid background', () => {
        props.background = 'solid';
        const wrapper = shallow(<PageLoading {...props} />);
        expect(wrapper.find('div').props().style.backgroundColor)
            .toEqual((global as any).eventkit_test_props.theme.eventkit.colors.background);
    });

    it('should use transparent background', () => {
        props.background = 'transparent';
        const wrapper = shallow(<PageLoading {...props} />);
        expect(wrapper.find('div').props().style.backgroundColor)
            .toEqual((global as any).eventkit_test_props.theme.eventkit.colors.backdrop);
    });

    it('should use pattern background', () => {
        props.background = 'pattern';
        const wrapper = shallow(<PageLoading {...props} />);
        expect(wrapper.find('div').props().style.backgroundImage)
            .toEqual(`url(${(global as any).eventkit_test_props.theme.eventkit.images.topo_dark})`);
    });
});
