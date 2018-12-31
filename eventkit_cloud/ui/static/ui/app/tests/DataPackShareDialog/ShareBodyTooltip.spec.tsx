import * as React from 'react';
import { shallow } from 'enzyme';
import { ShareBodyTooltip } from '../../components/DataPackShareDialog/ShareBodyTooltip';

describe('ShareBodyTooltip component', () => {
    const getProps = () => ({
        open: false,
        text: 'test text',
        target: { getBoundingClientRect: () => ({ left: 0, top: 0, height: 0 }) },
        body: { getBoundingClientRect: () => ({ left: 0, top: 0, height: 0 }) },
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => (
        shallow(<ShareBodyTooltip {...props} />)
    );

    it('should render null if not props.open', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.get(0)).toBe(null);
    });

    it('should render the basic components', () => {
        const props = getProps();
        props.open = true;
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-ShareBodyTooltip-arrow')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareBodyTooltip-text')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareBodyTooltip-text').text()).toEqual(props.text);
    });
});
