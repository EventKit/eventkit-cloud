import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import '../../components/tap_events';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Dialog from 'material-ui/Dialog';;
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';
import TaskError from '../../components/StatusDownloadPage/TaskError';

describe('TaskError component', () => {
    const getProps = () => {
        return {
            task: {
                uid: "1975da4d-9580-4fa8-8a4b-c1ef6e2f7553",
                url: "http://cloud.eventkit.dev/api/tasks/1975da4d-9580-4fa8-8a4b-c1ef6e2f7553",
                name: "OSM Data (.gpkg)",
                status: "CANCELED",
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
        }
    };
    const muiTheme = getMuiTheme();

    const getWrapper = (props) => {
        return mount(<TaskError {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    };

    it('should render UI elements', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('span').find('a').text()).toEqual('ERROR');
        expect(wrapper.find(Dialog)).toHaveLength(1);
        //expect(wrapper.find('div').find('div').find(NavigationArrowForward)).toHaveLength(1);
    });

    it('handleTaskErrorOpen should set task error dialog to open', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(TaskError.prototype, 'setState');
        const wrapper = shallow(<TaskError {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleTaskErrorOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({taskErrorDialogOpen: true})).toBe(true);
        stateSpy.restore();
    });

    it('handleTaskErrorClose should set task error dialog to close', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(TaskError.prototype, 'setState');
        const wrapper = shallow(<TaskError {...props}/>);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleTaskErrorClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({taskErrorDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });
});
