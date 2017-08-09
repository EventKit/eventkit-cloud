import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import ActionViewModule from 'material-ui/svg-icons/action/view-module';
import ActionViewStream from 'material-ui/svg-icons/action/view-stream';
import MapsMap from 'material-ui/svg-icons/maps/map';
import IconButton from 'material-ui/IconButton';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import DataPackViewButtons from '../../components/DataPackPage/DataPackViewButtons';

describe('DataPackViewButtons component', () => {
    const getProps = () => {
        return {
            handleViewChange: () => {},
        }
    };
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();
    
    it('should render three icon buttons', () => {
        const props = getProps();
        const wrapper = mount(<DataPackViewButtons {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(IconButton)).toHaveLength(3);
        expect(wrapper.find(ActionViewModule)).toHaveLength(1);
        expect(wrapper.find(ActionViewStream)).toHaveLength(1);
        expect(wrapper.find(MapsMap)).toHaveLength(1);
    });

    it('should call handleViewChange with the text of which view was selected', () => {
        let props = getProps();
        props.handleViewChange = new sinon.spy();
        const wrapper = mount(<DataPackViewButtons {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(props.handleViewChange.notCalled).toBe(true);
        wrapper.find(IconButton).at(0).simulate('click');
        expect(props.handleViewChange.calledWith('grid')).toBe(true);
        wrapper.find(IconButton).at(1).simulate('click');
        expect(props.handleViewChange.calledWith('list')).toBe(true);
        wrapper.find(IconButton).at(2).simulate('click');
        expect(props.handleViewChange.calledWith('map')).toBe(true);
    });

    it('getDimension should return the size string based on window width', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackViewButtons {...props}/>);

        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getDimension()).toEqual('21px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getDimension()).toEqual('22px');

        window.resizeTo(900, 1000);
        expect(window.innerWidth).toEqual(900);
        expect(wrapper.instance().getDimension()).toEqual('23px');

        window.resizeTo(1000, 1100);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getDimension()).toEqual('24px');

        window.resizeTo(1200, 1300);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getDimension()).toEqual('25px');
    });
});
