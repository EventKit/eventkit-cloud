import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import FlatButton from 'material-ui/FlatButton';
import {Card} from 'material-ui/Card';
import Clear from 'material-ui/svg-icons/content/clear';
import Forward from 'material-ui/svg-icons/content/forward';
import ZoomIn from 'material-ui/svg-icons/action/zoom-in';
import MapPopup from '../../components/DataPackPage/MapPopup';

describe('LoadButtons component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            name: 'test name',
            event: 'test event',
            detailUrl: 'cloud.eventkit.dev',
            handleZoom: () => {},
            handlePopupClose: () => {}
        }
    };
    const getWrapper = (props) => {
        return mount(<MapPopup {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            }
        });
    }

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find('#popup-header')).toHaveLength(1);
        expect(wrapper.find('#popup-name')).toHaveLength(1);
        expect(wrapper.find('#popup-name').text()).toEqual('test name');
        expect(wrapper.find(Clear)).toHaveLength(1);
        expect(wrapper.find('#popup-event')).toHaveLength(1);
        expect(wrapper.find('#popup-event').text()).toEqual('test event');
        expect(wrapper.find(FlatButton)).toHaveLength(2);
        expect(wrapper.find(FlatButton).first().text()).toEqual('Go to detail');
        expect(wrapper.find(Forward)).toHaveLength(1);
        expect(wrapper.find(FlatButton).last().text()).toEqual('Zoom To');
        expect(wrapper.find(ZoomIn)).toHaveLength(1);
    });

    it('should pass detailUrl to button as href', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(FlatButton).first().props().href).toEqual(props.detailUrl);
    });

    it('should call handleZoom when zoom button is clicked', () => {
        let props = getProps();
        props.handleZoom = new sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.handleZoom.notCalled).toBe(true);
        wrapper.find(FlatButton).last().simulate('click');
        expect(props.handleZoom.calledOnce).toBe(true);
    });

    it('should call handlePopupClose when a user clicks the close icon', () => {
        let props = getProps();
        props.handlePopupClose = new sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.handlePopupClose.notCalled).toBe(true);
        wrapper.find(Clear).simulate('click');
        expect(props.handlePopupClose.calledOnce).toBe(true);
    });
});

