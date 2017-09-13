import React from 'react'
import sinon from 'sinon';
import {mount} from 'enzyme'
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import ol from 'openlayers';
import {ExportSummary} from '../../components/CreateDataPack/ExportSummary';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import CustomScrollbar from '../../components/CustomScrollbar';
import Paper from 'material-ui/Paper';

// this polyfills requestAnimationFrame in the test browser, required for ol3
import raf from 'raf';
raf.polyfill();

describe('Export Summary Component', () => { 
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();
    const getProps = () => {
        return {
            geojson: { 
                "type": "FeatureCollection",
                "features": [{ "type": "Feature",
                    "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                        [100.0, 1.0], [100.0, 0.0] ]
                        ]
                    },}]
            },
            exportName: 'name',
            datapackDescription: 'description',
            projectName: 'project',
            makePublic: true,
            providers: [
                {name: 'one', uid: 1, display: true}, 
                {name: 'two', uid: 2, display: false}, 
                {name: 'three', uid: 3, display: false}
            ],
            area_str: '12 sq km',
            layers: 'Geopackage'
        }
    }

    const getWrapper = (props) => {
        const config = {BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png'};        
        return mount(<ExportSummary {...props}/>, {
            context: {muiTheme, config},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                config: React.PropTypes.object
            }
        });
    }

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('form')).toHaveLength(1);
        expect(wrapper.find('#mainheading').text()).toEqual('Preview and Run Export');
        expect(wrapper.find('#subheading').text()).toEqual('Please make sure all the information below is correct.');
        expect(wrapper.find('#export-information-heading').text()).toEqual('Export Information');
        expect(wrapper.find('#name').find('td').first().text()).toEqual('Name');
        expect(wrapper.find('#name').find('td').last().text()).toEqual('name');
        expect(wrapper.find('#description').find('td').first().text()).toEqual('Description');
        expect(wrapper.find('#description').find('td').last().text()).toEqual('description');
        expect(wrapper.find('#project').find('td').first().text()).toEqual('Project/Category');
        expect(wrapper.find('#project').find('td').last().text()).toEqual('project');
        expect(wrapper.find('#published').find('td').first().text()).toEqual('Published');
        expect(wrapper.find('#published').find('td').last().text()).toEqual('true');
        expect(wrapper.find('#formats').find('td').first().text()).toEqual('File Formats');
        expect(wrapper.find('#formats').find('td').last().text()).toEqual('Geopackage');
        expect(wrapper.find('#layers').find('td').first().text()).toEqual('Layer Data');
        expect(wrapper.find('#layers').find('td').last().text()).toEqual('one');
        expect(wrapper.find('#aoi-heading').text()).toEqual('Area of Interest (AOI)');
        expect(wrapper.find('#aoi-area').find('td').first().text()).toEqual('Area');
        expect(wrapper.find('#aoi-area').find('td').last().text()).toEqual('12 sq km');
        expect(wrapper.find('#aoi-map')).toHaveLength(1);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardHeader).text()).toEqual('Selected Area of Interest');
        expect(wrapper.find(CardText)).toHaveLength(0);
        expect(wrapper.find('#summaryMap')).toHaveLength(0);
    });

    it('should call initializeOpenLayers  when card is expanded', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance()._initializeOpenLayers = new sinon.spy();
        expect(wrapper.instance()._initializeOpenLayers.called).toBe(false);
        wrapper.setState({expanded: true});
        expect(wrapper.instance()._initializeOpenLayers.calledOnce).toBe(true);
        wrapper.setState({expanded: false});
        expect(wrapper.instance()._initializeOpenLayers.calledOnce).toBe(true);
    });

    it('expandedChange should call setState', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ExportSummary.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().expandedChange(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({expanded: true})).toBe(true);
        stateSpy.restore();
    });

    it('componentDidMount should create an eventlistener', () => {
        const props = getProps();
        const mountSpy = new sinon.spy(ExportSummary.prototype, 'componentDidMount');
        const listenerSpy = new sinon.spy(window, 'addEventListener');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(listenerSpy.calledOnce).toBe(true);
        expect(listenerSpy.calledWith('resize', wrapper.instance().screenSizeUpdate)).toBe(true);
        mountSpy.restore();
        listenerSpy.restore();
    });

    it('componentWillUnmount should remove the listener', () => {
        const props = getProps();
        const unmountSpy = new sinon.spy(ExportSummary.prototype, 'componentWillUnmount');
        const listenerSpy = new sinon.spy(window, 'removeEventListener');
        const wrapper = getWrapper(props);
        const func = wrapper.instance().screenSizeUpdate;
        wrapper.unmount();
        expect(unmountSpy.calledOnce).toBe(true);
        expect(listenerSpy.calledOnce).toBe(true);
        expect(listenerSpy.calledWith('resize', func)).toBe(true);
        unmountSpy.restore();
        listenerSpy.restore();
    });

    it('screenSizeUpdate should call force update', () => {
        const props = getProps();
        const updateSpy = new sinon.spy(ExportSummary.prototype, 'forceUpdate');
        const wrapper = getWrapper(props);
        expect(updateSpy.called).toBe(false);
        wrapper.instance().screenSizeUpdate();
        expect(updateSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });
});