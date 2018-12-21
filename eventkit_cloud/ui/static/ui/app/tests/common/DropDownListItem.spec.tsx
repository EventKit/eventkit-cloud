import * as React from 'react';
import { mount } from 'enzyme';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { DropDownListItem } from '../../components/common/DropDownListItem';

describe('DropDownListItem component', () => {
    let wrapper;

    const defaultProps = () => ({
        title: 'test title',
        children: <span className="test-child">hello</span>,
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = mount(<DropDownListItem {...props} />);
    };

    beforeEach(setup);

    it('should display a list item with title and collapse-able children', () => {
        expect(wrapper.find(ListItem)).toHaveLength(2);
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(List)).toHaveLength(1);
        expect(wrapper.find(Collapse)).toHaveLength(1);
        expect(wrapper.find('.qa-DropDownListItem-title').hostNodes().text()).toEqual('test title');
        expect(wrapper.find('.test-child')).toHaveLength(1);
    });

    it('handleExpand should negate the open state', () => {
        expect(wrapper.state('open')).toBe(false);
        wrapper.instance().handleExpand();
        wrapper.update();
        expect(wrapper.state('open')).toBe(true);
    });
});
