import React from 'react';
import {mount, shallow} from 'enzyme';
import sinon from 'sinon';
import AppBar from 'material-ui/AppBar';
import About from '../../components/About/About';
import InfoParagraph from '../../components/About/InfoParagraph';
import ThreeStepInfo from '../../components/About/ThreeStepInfo';
import QuickTour from '../../components/About/QuickTour';
import QuickTourSection from '../../components/About/QuickTourSection';
import CustomScrollbar from '../../components/CustomScrollbar';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('About component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getWrapper = () => {
        return mount(<About/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
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
        let nextState = {...wrapper.state()};
        nextState.pageInfo.quickTour = [];
        wrapper.setState(nextState);
        expect(wrapper.find('h3')).toHaveLength(0);
    });

    it('should set state on mount', () => {
        const mountSpy = new sinon.spy(About.prototype, 'componentDidMount');
        const stateSpy = new sinon.spy(About.prototype, 'setState');
        const wrapper = getWrapper();
        expect(mountSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        mountSpy.restore();
        stateSpy.restore();
    });
});
