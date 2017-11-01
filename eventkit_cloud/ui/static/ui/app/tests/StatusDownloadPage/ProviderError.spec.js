import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Divider from 'material-ui/Divider';
import Warning from 'material-ui/svg-icons/alert/warning';
import ProviderError from '../../components/StatusDownloadPage/ProviderError';
import BaseDialog from '../../components/BaseDialog';

describe('ProviderError component', () => {
    const getProps = () => {
        return  {
            provider: {
                name: "OpenStreetMap Data (Themes)",
                status: "COMPLETED",
                tasks: tasks,
                uid: "e261d619-2a02-4ba5-a58c-be0908f97d04",
                url: "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04",
                display: true,
            },
        }
    };
    const muiTheme = getMuiTheme();

    const getWrapper = (props) => {
        return mount(<ProviderError {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    };

    it('should render UI elements', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find('span').find('a').text()).toEqual('ERROR');
        expect(wrapper.find(Warning)).toHaveLength(1);


    });

    it('handleProviderErrorOpen should set provider error dialog to open', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ProviderError.prototype, 'setState');
        const wrapper = shallow(<ProviderError {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderErrorOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providerErrorDialogOpen: true})).toBe(true);
        expect(wrapper.find(Warning)).toHaveLength(4)
        expect(wrapper.find(Divider)).toHaveLength(3);
        expect(wrapper.find('#error-data')).toHaveLength(3);
        expect(wrapper.find('#error-data').at(0).text()).toEqual('<AlertWarning />OpenStreetMap Data (Themes) was canceled by admin.<Divider />');
        stateSpy.restore();
    });

    it('handleProviderErrorClose should set provider error dialog to close', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ProviderError.prototype, 'setState');
        const wrapper = shallow(<ProviderError {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleProviderErrorClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providerErrorDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });

    it('should call handleProviderErrorOpen when the error link is clicked. ', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ProviderError.prototype, 'setState');
        const errorSpy = new sinon.spy(ProviderError.prototype, 'handleProviderErrorOpen');
        const wrapper = getWrapper(props);
        expect(errorSpy.notCalled).toBe(true);
        wrapper.find('a').simulate('click');
        expect(errorSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providerErrorDialogOpen: true})).toBe(true);
        stateSpy.restore();
        errorSpy.restore();
    });

    it('should call handleProviderErrorOpen when the error warning icon is clicked. ', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ProviderError.prototype, 'setState');
        const errorSpy = new sinon.spy(ProviderError.prototype, 'handleProviderErrorOpen');
        const wrapper = getWrapper(props);
        expect(errorSpy.notCalled).toBe(true);
        wrapper.find(Warning).simulate('click');
        expect(errorSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({providerErrorDialogOpen: true})).toBe(true);
        errorSpy.restore();
        stateSpy.restore();
    });


});

const tasks = [
    {
        uid: "1975da4d-9580-4fa8-8a4b-c1ef6e2f7553",
        url: "http://cloud.eventkit.dev/api/tasks/1975da4d-9580-4fa8-8a4b-c1ef6e2f7553",
        name: "OSM Data (.gpkg)",
        status: "INCOMPLETE",
        progress: 0,
        estimated_finish: null,
        started_at: null,
        finished_at: null,
        duration: null,
        result: null,
        errors: [
            {
                exception: "OpenStreetMap Data (Themes) was canceled by admin."
            }
        ],
        display: true
    },
    {
        uid: "cfb971d4-432d-48ba-ba36-cce314228fba",
        url: "http://cloud.eventkit.dev/api/tasks/cfb971d4-432d-48ba-ba36-cce314228fba",
        name: "QGIS Project file (.qgs)",
        status: "INCOMPLETE",
        progress: 0,
        estimated_finish: null,
        started_at: null,
        finished_at: null,
        duration: null,
        result: null,
        errors: [
            {
                exception: "OpenStreetMap Data (Themes) was canceled by admin."
            }
        ],
        display: true
    },
    {
        uid: "aff6ccb9-6bc3-4080-aeb9-d599780949d5",
        url: "http://cloud.eventkit.dev/api/tasks/aff6ccb9-6bc3-4080-aeb9-d599780949d5",
        name: "Area of Interest (.geojson)",
        status: "INCOMPLETE",
        progress: 0,
        estimated_finish: null,
        started_at: null,
        finished_at: "2017-07-17T16:33:47.519125Z",
        duration: null,
        result: null,
        errors: [
            {
                exception: "OpenStreetMap Data (Themes) was canceled by admin."
            }
        ],
        display: true
    },
    {
        uid: "47d8f8a6-9611-4fc7-8f1b-210d3ff87198",
        url: "http://cloud.eventkit.dev/api/tasks/47d8f8a6-9611-4fc7-8f1b-210d3ff87198",
        name: "Area of Interest (.gpkg)",
        status: "INCOMPLETE",
        progress: 0,
        estimated_finish: null,
        started_at: null,
        finished_at: null,
        duration: null,
        result: null,
        errors: [
            {
                exception: "OpenStreetMap Data (Themes) was canceled by admin."
            }
        ],
        display: true
    }
];