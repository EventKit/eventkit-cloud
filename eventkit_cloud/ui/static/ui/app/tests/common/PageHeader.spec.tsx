import * as React from 'react';
import { shallow } from 'enzyme';
import { PageHeader } from '../../components/common/PageHeader';

describe('PageHeader component', () => {
    const props = {
        title: 'test title',
        children: <div>test children</div>,
        ...(global as any).eventkit_test_props,
    };

    it('should render', () => {
        const wrapper = shallow(<PageHeader {...props} />);
        expect(wrapper.find('.qa-PageHeader')).toHaveLength(1);
    });
});
