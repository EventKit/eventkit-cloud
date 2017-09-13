import React from 'react';
import {mount, shallow} from 'enzyme';
import sinon from 'sinon';
import QuickTour from '../../components/About/QuickTour';
import QuickTourSection from '../../components/About/QuickTourSection';
import testImg from '../../../images/eventkit_logo.png';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('QuickTour component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    const getProps = () => {
        return {
            header: 'Test Header',
            tourSections: [
                {
                    sectionTitle: 'title',
                    steps: [
                        {img: testImg, caption: 'step1'},
                        {img: testImg, caption: 'step2'},
                        {img: testImg, caption: 'step3'}
                    ]
                }
            ]
        }
    };

    const getWrapper = (props) => {
        return mount(<QuickTour {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    };

    it('should render a header and all QuickTourSections', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('h4')).toHaveLength(1);
        expect(wrapper.find('h4').text()).toEqual('Test Header');
        expect(wrapper.find(QuickTourSection)).toHaveLength(1);
    });3

    it('should apply style props to the container', () => {
        let props = getProps();
        props.containerStyle = {color: 'red'};
        const wrapper = getWrapper(props);
        expect(wrapper.find('div').first().props().style.color).toEqual('red');
    });
});
