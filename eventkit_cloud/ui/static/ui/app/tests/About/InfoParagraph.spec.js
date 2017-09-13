import React from 'react';
import {mount, shallow} from 'enzyme';
import sinon from 'sinon';
import InfoParagraph from '../../components/About/InfoParagraph';

describe('InfoParagraph component', () => {
    const getProps = () => {
        return {
            header: 'Test Header',
            body: 'Test Body',
        }
    }
    
    const getWrapper = (props) => {
        return mount(<InfoParagraph {...props}/>);
    }

    it('should render a header and body with passed in text', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('h4')).toHaveLength(1);
        expect(wrapper.find('h4').text()).toEqual('Test Header');
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find('div').at(1).text()).toEqual('Test Body');
    });

    it('should return null if not header or body', () => {
        const props = {header: 'only a header here'}
        const wrapper = getWrapper(props);
        expect(wrapper.find('h4')).toHaveLength(0);
        expect(wrapper.find('div')).toHaveLength(0);
    });

    it('should apply passed in style props', () => {
        let props = getProps();
        props.headerStyle = {color: 'red'};
        props.bodyStyle = {color: 'blue'};
        const wrapper = getWrapper(props);
        expect(wrapper.find('h4').props().style.color).toEqual('red');
        expect(wrapper.find('div').at(1).props().style.color).toEqual('blue');
    });
});
