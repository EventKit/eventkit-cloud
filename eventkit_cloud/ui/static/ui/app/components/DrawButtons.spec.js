import { DrawButtons } from './DrawButtons'
import React from 'react'
import {expect} from 'chai'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { Button } from 'react-bootstrap'


const getProps = () => {
    return  {
            drawBoxButton: {disabled: true, click: false},
            drawFreeButton: {disabled: true, click: false},
            mode: 'DRAW_NORMAL',
            updateMode: () => {},
            toggleDrawBoxButton: () => {},
            clickDrawBoxButton: () => {},
            toggleDrawFreeButton: () => {},
            clickDrawFreeButton: () => {},
        }
}

describe('DrawButtons component', () => {
    it('should display a box and free button', () => {
        const wrapper = mount(<DrawButtons/>)
        expect(wrapper.contains([Button, Button]))
        const buttons = wrapper.find(Button)
        expect(buttons.first().text()).to.equal('BOX')
        expect(buttons.last().text()).to.equal('FREE')
    })

    it('should contains all the passed in props', () => {
        const props = getProps();
        const wrapper = mount(<DrawButtons {...props}/>)
        expect(wrapper.props().mode).to.equal('DRAW_NORMAL')
        expect(wrapper.props().drawBoxButton).to.deep.equal({disabled: true, click: false})
        expect(wrapper.props().drawFreeButton).to.deep.equal({disabled: true, click: false})
        expect(wrapper.props().updateMode).to.be.instanceOf(Function)
        expect(wrapper.props().toggleDrawBoxButton).to.be.instanceOf(Function)
        expect(wrapper.props().clickDrawBoxButton).to.be.instanceOf(Function)
        expect(wrapper.props().toggleDrawFreeButton).to.be.instanceOf(Function)
        expect(wrapper.props().clickDrawFreeButton).to.be.instanceOf(Function)
    })

})
