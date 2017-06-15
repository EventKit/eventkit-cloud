import React from 'react';
import {mount, shallow} from 'enzyme';
import sinon from 'sinon';
import ThreeStepInfo from '../../components/About/ThreeStepInfo';
import create_img from '../../../images/3_stage_create.png';
import manage_img from '../../../images/3_stage_manage.png';
import use_img from '../../../images/3_stage_use.png';

describe('ThreeStepInfo component', () => {
    const getProps = () => {
        return {
            steps: [
                {img: create_img, caption: 'Create DataPacks'},
                {img: manage_img, caption: 'Manage DataPacks'},
                {img: use_img, caption: 'Use DataPacks'}
            ]
        }
    }

    const getWrapper = (props) => {
        return mount(<ThreeStepInfo {...props}/>);
    }

    it('should render all the table elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('table')).toHaveLength(1);
        expect(wrapper.find('tbody')).toHaveLength(1);
        expect(wrapper.find('tr')).toHaveLength(1);
        expect(wrapper.find('td')).toHaveLength(3);
        expect(wrapper.find('td').at(0).find('img')).toHaveLength(1);
        expect(wrapper.find('td').at(0).find('div').text()).toEqual('Create DataPacks');
        expect(wrapper.find('td').at(1).find('img')).toHaveLength(1);
        expect(wrapper.find('td').at(1).find('div').text()).toEqual('Manage DataPacks');
        expect(wrapper.find('td').at(2).find('img')).toHaveLength(1);
        expect(wrapper.find('td').at(2).find('div').text()).toEqual('Use DataPacks');
    });

    it('should return null if there are no steps', () => {
        const props = {steps: []};
        const wrapper = getWrapper(props);
        expect(wrapper.find('table')).toHaveLength(0);
    });

    it('should pass custom style prop to table', () => {
        let props = getProps();
        props.tableStyle = {color: 'red'};
        const wrapper = getWrapper(props);
        expect(wrapper.find('table').props().style.color).toEqual('red');
    });

    it('should set table fontsize to 14px', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        wrapper.update();
        expect(wrapper.find('table').props().style.fontSize).toEqual('14px');
    });

    it('should set table fontSize to 16px', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        window.resizeTo(1300, 1000);
        expect(window.innerWidth).toEqual(1300);
        wrapper.update();
        expect(wrapper.find('table').props().style.fontSize).toEqual('16px');
    });
});
