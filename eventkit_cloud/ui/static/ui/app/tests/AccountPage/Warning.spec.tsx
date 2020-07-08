import * as React from 'react';
import { mount } from 'enzyme';
import { Warning } from '../../components/AccountPage/Warning';

describe('Warning component', () => {
    it('should display a div with the passed in text', () => {
        const wrapper = mount(<Warning text="this is some text" />);
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.text()).toEqual('this is some text');
    });

    it('should display div with a passed in <p> element with text', () => {
        const wrapper = mount(<Warning text={<p>passed in node</p>} />);
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('p')).toHaveLength(1);
        expect(wrapper.text()).toEqual('passed in node');
    });

    it('should apply the right inline styles to the div', () => {
        const expectedStyles = {
            backgroundColor: '#f8e6dd',
            width: '100%',
            margin: '5px 0px',
            lineHeight: '25px',
            padding: '16px',
            textAlign: 'center',
        };
        const wrapper = mount(<Warning text="blah blah" />);
        expect(wrapper.find('div').props().style).toEqual(expectedStyles);
    });

    it('The text should change when new text prop is passed in', () => {
        const wrapper = mount(<Warning text="this is the first text" />);
        expect(wrapper.find('div').text()).toEqual('this is the first text');
        wrapper.setProps({ text: 'here is some different text' });
        expect(wrapper.find('div').text()).toEqual('here is some different text');
    });
});
