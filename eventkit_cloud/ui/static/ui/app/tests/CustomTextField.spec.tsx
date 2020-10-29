import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import {CustomTextField} from '../components/common/CustomTextField';
import {act} from "react-dom/test-utils";
import {hasValue} from "../utils/arrays";

describe('CustomTextField component', () => {
    const defaultProps = { classes: {}, ...(global as any).eventkit_test_props, };


    const getWrapper = (props = {}) => {
        return mount(<CustomTextField {...defaultProps} {...props}/>)
    };

    it('should render a TextField component and pass events', () => {
        let wrapper;
        act(() => {
            wrapper = getWrapper();
        });
        expect(wrapper.find('div.qa-CustomTextField-TextField')).toHaveLength(1);
        const passedProps = Object.keys(wrapper.find('.qa-CustomTextField-TextField').first().props());
        expect(['onFocus', 'onChange', 'onBlur'].every(key => hasValue(passedProps, key))).toBe(true);
    });

    it('should show remaining characters when maxLength is present and input is focused', () => {
        let wrapper;
        act(() => {
            wrapper = getWrapper({ maxLength: 100 });
        });

        wrapper.find('input').first().simulate('focus');
        return new Promise(resolve => setImmediate(resolve)).then(() => {
            expect(wrapper.find('.qa-remaining').text()).toEqual('100');
            wrapper.find('input').first().simulate('change', { target: { value: 'abc' } });
        }).then(() => {
            expect(wrapper.find('.qa-remaining').text()).toEqual('97');
            wrapper.find('input').first().simulate('blur');
        }).then(() => expect(wrapper.find('.qa-remaining')).toHaveLength(0));
    });

    it('should show remaining characters in a warning color', () => {
        let wrapper;
        act(() => {
            wrapper = getWrapper({
                maxLength: 9 + 'something'.length,  // Just enough to ensure warning should show when text is added.
                classes: {
                    charsRemainingText: 'regular',
                    limitWarning: 'warning',
                }
            });
        });

        wrapper.find('input').first().simulate('focus');
        return new Promise(resolve => setImmediate(resolve)).then(() => {
            expect(wrapper.find('.qa-remaining').html()).toContain('regular');
            expect(wrapper.find('.qa-remaining').html()).not.toContain('warning');
            wrapper.find('input').first().simulate('change', { target: { value: 'something' } });
        }).then(() => {
            expect(wrapper.find('.qa-remaining').html()).toContain('regular');
            expect(wrapper.find('.qa-remaining').html()).toContain('warning');
        });
    });

    it('should not show remaining characters when showRemaining is false', () => {
        let wrapper;
        act(() => {
            wrapper = getWrapper({ maxLength: 100, showRemaining: false });
        });

        wrapper.find('input').first().simulate('focus');
        return new Promise(resolve => setImmediate(resolve)).then(() => {
            expect(wrapper.find('.qa-remaining')).toHaveLength(0);
        });
    });
});
