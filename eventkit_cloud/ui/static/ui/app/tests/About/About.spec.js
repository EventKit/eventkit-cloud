import React from 'react';
import { mount } from 'enzyme';
import AppBar from 'material-ui/AppBar';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import About from '../../components/About/About';
import InfoParagraph from '../../components/About/InfoParagraph';
import ThreeStepInfo from '../../components/About/ThreeStepInfo';
import QuickTourSection from '../../components/About/QuickTourSection';
import CustomScrollbar from '../../components/CustomScrollbar';


describe('About component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getWrapper = () => {
        return mount(<About />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object }
        });
    }

    it('should render all the basic elements', () => {
        const wrapper = getWrapper();
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(AppBar).text()).toEqual('About EventKit');
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(InfoParagraph)).toHaveLength(2);
        expect(wrapper.find(ThreeStepInfo)).toHaveLength(1);
        expect(wrapper.find('h3')).toHaveLength(1);
        expect(wrapper.find('h3').text()).toEqual('Quick Tour');
        expect(wrapper.find(QuickTourSection)).toHaveLength(5);
    });

    it('should only render Quick Tour header if there are quicktour elements', () => {
        const wrapper = getWrapper();
        expect(wrapper.find('h3')).toHaveLength(1);
        const nextState = { ...wrapper.state() };
        nextState.pageInfo.quickTour = [];
        wrapper.setState(nextState);
        expect(wrapper.find('h3')).toHaveLength(0);
    });

    it('should not show the version tag if no version in context', () => {
        const wrapper = getWrapper();
        expect(wrapper.find('.qa-About-version')).toHaveLength(0);
    });

    it('should render the version tag', () => {
        const config = { VERSION: '1.2.3' };
        const wrapper = mount(<About />, {
            context: { muiTheme, config },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                config: React.PropTypes.object,
            },
        });
        expect(wrapper.find('.qa-About-version')).toHaveLength(1);
        expect(wrapper.find('.qa-About-version').text()).toEqual('Version 1.2.3');
    });
});
