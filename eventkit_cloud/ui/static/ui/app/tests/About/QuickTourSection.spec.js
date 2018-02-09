import React from 'react';
import {mount, shallow} from 'enzyme';
import sinon from 'sinon';
import {Card, CardHeader, CardMedia} from 'material-ui/Card';
import QuickTourSection from '../../components/About/QuickTourSection';
import testImg from '../../../images/eventkit_logo.png';
import Swipeable from 'react-swipeable';
import ChevronLeft from 'material-ui/svg-icons/navigation/chevron-left';
import ChevronRight from 'material-ui/svg-icons/navigation/chevron-right';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowDropUp from 'material-ui/svg-icons/navigation/arrow-drop-up';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('QuickTour component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => {
        return {
            steps: [
                {img: testImg, caption: 'step 1 caption'},
                {img: testImg, caption: 'step 2 caption'},
                {img: testImg, caption: 'step 3 caption'}
            ],
            sectionTitle: 'test title'
        }
    };

    const getWrapper = (props) => {
        return mount(<QuickTourSection {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    };

    it('should render all the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardMedia)).toHaveLength(1);
        expect(wrapper.find(Swipeable)).toHaveLength(1);
        expect(wrapper.find('img')).toHaveLength(1);
        expect(wrapper.find(ChevronLeft)).toHaveLength(1);
        expect(wrapper.find(ChevronRight)).toHaveLength(1);
        expect(wrapper.find('#captionContainer')).toHaveLength(1);
        expect(wrapper.find('#captionText').text()).toEqual('step 1 caption');
        expect(wrapper.find('#stepNumber')).toHaveLength(3);
        expect(wrapper.find('#stepNumber').at(0).text()).toEqual('1');
        expect(wrapper.find('#stepNumber').at(1).text()).toEqual('2');
        expect(wrapper.find('#stepNumber').at(2).text()).toEqual('3');
    });

    it('should call goToStep on stepNumber click', () => {
        const props = getProps();
        const stepSpy = new sinon.spy(QuickTourSection.prototype, 'goToStep');
        const wrapper = getWrapper(props);
        wrapper.find('#stepNumber').first().simulate('click');
        expect(stepSpy.calledOnce).toBe(true);
        expect(stepSpy.calledWith(0)).toBe(true);
        stepSpy.restore();
    });

    it('ChevronLeft should call previousStep when clicked', () => {
        const props = getProps();
        const prevSpy = new sinon.spy(QuickTourSection.prototype, 'previousStep');
        const wrapper = getWrapper(props);
        wrapper.find(ChevronLeft).simulate('click');
        expect(prevSpy.calledOnce).toBe(true);
    });

    it('ChevronRight should call nextStep when clicked', () => {
        const props = getProps();
        const nextSpy = new sinon.spy(QuickTourSection.prototype, 'nextStep');
        const wrapper = getWrapper(props);
        wrapper.find(ChevronRight).simulate('click');
        expect(nextSpy.calledOnce).toBe(true);
        nextSpy.restore();
    });

    it('mediaContainer div should call setArrowVisiblity(true) on mouseEnter', () => {
        const props = getProps();
        const spy = new sinon.spy(QuickTourSection.prototype, 'setArrowVisibility');
        const wrapper = getWrapper(props);
        wrapper.find('#mediaContainer').simulate('mouseEnter');
        expect(spy.calledOnce).toBe(true);
        expect(spy.calledWith(true)).toBe(true);
        spy.restore();
    });

    it('mediaContainer div should call setArrowVisibility(false) on mouseLeave', () => {
        const props = getProps();
        const spy = new sinon.spy(QuickTourSection.prototype, 'setArrowVisibility');
        const wrapper = getWrapper(props);
        wrapper.find('#mediaContainer').simulate('mouseLeave');
        expect(spy.calledOnce).toBe(true);
        expect(spy.calledWith(false)).toBe(true);
        spy.restore();
    });

    it('should update captionFontSize, numberFontSize, and numberDiameter', () => {
        const props = getProps();
        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        const wrapper = getWrapper(props);
        expect(wrapper.find('#captionText').props().style.fontSize).toEqual(14);
        expect(wrapper.find('#stepNumber').first().props().style.fontSize).toEqual(10);
        expect(wrapper.find('#stepNumber').first().props().style.width).toEqual(20);
        expect(wrapper.find('#stepNumber').first().props().style.height).toEqual(20);
        window.resizeTo(1200, 1000);
        wrapper.update();
        expect(wrapper.find('#captionText').props().style.fontSize).toEqual(16);
        expect(wrapper.find('#stepNumber').first().props().style.fontSize).toEqual(14);
        expect(wrapper.find('#stepNumber').first().props().style.width).toEqual(25);
        expect(wrapper.find('#stepNumber').first().props().style.height).toEqual(25);
    });

    it('nextStep should increment or return to 0', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(QuickTourSection.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().nextStep();
        expect(stateSpy.calledWith({step: 1})).toBe(true);
        wrapper.instance().nextStep();
        expect(stateSpy.calledWith({step: 2})).toBe(true);
        wrapper.instance().nextStep();
        expect(stateSpy.calledWith({step: 0})).toBe(true);
        stateSpy.restore();
    });

    it('previousStep should decrement or return to the last element', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(QuickTourSection.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().previousStep();
        expect(stateSpy.calledWith({step: 2})).toBe(true);
        wrapper.instance().previousStep();
        expect(stateSpy.calledWith({step: 1})).toBe(true);
        wrapper.instance().previousStep();
        expect(stateSpy.calledWith({step: 0})).toBe(true);
        stateSpy.restore();
    });

    it('goToStep should set state to specified step if it exists', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(QuickTourSection.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.notCalled).toBe(true);
        wrapper.instance().goToStep(-1);
        expect(stateSpy.notCalled).toBe(true);
        wrapper.instance().goToStep(4);
        expect(stateSpy.notCalled).toBe(true);
        wrapper.instance().goToStep(0);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({step: 0})).toBe(true);
        stateSpy.restore();
    });

    it('setArrowVisibility should set the state', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(QuickTourSection.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().setArrowVisibility(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({arrowsVisible: true})).toBe(true);
        stateSpy.restore();
    });
});
