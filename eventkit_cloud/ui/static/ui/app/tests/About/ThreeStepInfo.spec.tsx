import * as React from 'react';
import { mount } from 'enzyme';
import { ThreeStepInfo, Props } from '../../components/About/ThreeStepInfo';
import create from '../../../images/AboutPage/three_step_1.png';
import manage from '../../../images/AboutPage/three_step_2.png';
import use from '../../../images/AboutPage/three_step_3.png';

describe('ThreeStepInfo component', () => {
    const getProps = (): Props => ({
        ...(global as any).eventkit_test_props,
        steps: [
            { img: create, caption: 'Create DataPacks' },
            { img: manage, caption: 'Manage DataPacks' },
            { img: use, caption: 'Use DataPacks' },
        ],

    });

    const getWrapper = props => mount(<ThreeStepInfo {...props} />);

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
        const props = { steps: [], ...(global as any).eventkit_test_props };
        const wrapper = getWrapper(props);
        expect(wrapper.find('table')).toHaveLength(0);
    });

    it('should pass custom style prop to table', () => {
        const props = getProps();
        props.tableStyle = { color: 'red' };
        const wrapper = getWrapper(props);
        expect(wrapper.find('table').props().style.color).toEqual('red');
    });
});
