import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import Banner from '../components/Banner';

describe('Banner component', () => {
    it('should render a div with string and style from context', () => {
        const wrapper = mount(<Banner />, {
            childContextTypes: {
                context: PropTypes.object,
            },
            context: {
                config: {
                    BANNER_BACKGROUND_COLOR: 'green',
                    BANNER_TEXT: 'test banner',
                    BANNER_TEXT_COLOR: 'red',
                },
            },
        });
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('div').text()).toEqual('test banner');
        expect(wrapper.find('div').props().style.color).toEqual('red');
        expect(wrapper.find('div').props().style.backgroundColor).toEqual('green');
    });

    it('should render div with empty string and default style when no config', () => {
        const wrapper = mount(<Banner />, {
            childContextTypes: { context: PropTypes.object },
            context: { config: {} },
        });
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('div').text()).toEqual('');
        expect(wrapper.find('div').props().style.backgroundColor).toEqual('#000');
        expect(wrapper.find('div').props().style.color).toEqual('#fff');
    });
});
