import {PopupBox} from './PopupBox';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';

describe('PopupBox component', () => {

    const getProps = () => {
        return {
            show: false,
            title: 'test title',
            onExit: () => {},
        }
    };

    it('should display an empty div when props.show == false', () => {
        const props = getProps();
        const wrapper = mount(<PopupBox {...props}/>);
        expect(wrapper.find('div')).to.have.length(1);
    });

    it('should display container, titlebar, body, and footer', () => {
        let props = getProps();
        props.show = true;
        const wrapper = mount(<PopupBox {...props}/>);
        expect(wrapper.find('.container')).to.have.length(1);
        expect(wrapper.find('.titlebar')).to.have.length(1);
        expect(wrapper.find('.title')).to.have.length(1);
        expect(wrapper.find('span').text()).to.equal('test title');
        expect(wrapper.find('.exit')).to.have.length(1);
        expect(wrapper.find('button')).to.have.length(1);
        expect(wrapper.find('i')).to.have.length(1);
        expect(wrapper.find('i').text()).to.equal('clear');
        expect(wrapper.find('.body')).to.have.length(1);
        expect(wrapper.find('.footer')).to.have.length(1);
    });

    it('should execute the passed in function when exit button is clicked', () =>{
        let props = getProps();
        props.onExit = sinon.spy();
        props.show = true;
        const wrapper = mount(<PopupBox {...props}/>);
        wrapper.find('button').simulate('click');
        expect(props.onExit.calledOnce).to.equal(true);
    });

    it('should render any child elements', () => {
        let props = getProps();
        props.show = true;
        const wrapper = mount(<PopupBox {...props}><p>my child</p></PopupBox>);
        expect(wrapper.find('p')).to.have.length(1);
        expect(wrapper.find('p').text()).to.equal('my child');
    });
});
