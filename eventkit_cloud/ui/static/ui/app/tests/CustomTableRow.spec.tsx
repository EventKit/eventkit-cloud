import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import { CustomTableRow } from '../components/common/CustomTableRow';

describe('CustomTextField component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const props = {
        title: 'test title',
        children: 'test data',
        classes: {},
        ...(global as any).eventkit_test_props,
    };

    const getWrapper = prop => (
        shallow(<CustomTableRow {...prop} />)
    );

    it('should render a title and data', () => {
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-CustomTableRow')).toHaveLength(1);
        expect(wrapper.find('.qa-CustomTableRow').find('div').at(1)
            .text()).toEqual('test title');
        expect(wrapper.find('.qa-CustomTableRow').find('div').at(2)
            .text()).toEqual('test data');
    });
});
