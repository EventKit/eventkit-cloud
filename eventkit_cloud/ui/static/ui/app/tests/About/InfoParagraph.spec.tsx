import * as React from 'react';
import { mount } from 'enzyme';
import { InfoParagraph, Props } from '../../components/About/InfoParagraph';

describe('InfoParagraph component', () => {
    const getProps = (): Props => ({
        ...(global as any).eventkit_test_props,
        title: 'Test Header',
        body: 'Test Body',
    });

    const getWrapper = props => (
        mount(<InfoParagraph {...props} />)
    );

    it('should render a header and body with passed in text', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('h3')).toHaveLength(1);
        expect(wrapper.find('h3').text()).toEqual('Test Header');
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find('div').at(1).text()).toEqual('Test Body');
    });

    it('should return null if not header or body', () => {
        const props = { title: 'only a title here' };
        const wrapper = getWrapper(props);
        expect(wrapper.find('h3')).toHaveLength(0);
        expect(wrapper.find('div')).toHaveLength(0);
    });

    it('should apply passed in style props', () => {
        const props = getProps();
        props.titleStyle = { color: 'red' };
        props.bodyStyle = { color: 'blue' };
        const wrapper = getWrapper(props);
        expect(wrapper.find('h3').props().style.color).toEqual('red');
        expect(wrapper.find('div').at(1).props().style.color).toEqual('blue');
    });
});
