import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import initialState from '../../reducers/initialState';
import {fakeStore} from '../../__mocks__/fakeStore';
import {CreateExport} from '../../components/CreateDataPack/CreateExport';
import {BreadcrumbStepper} from '../../components/CreateDataPack/BreadcrumbStepper';
import AppBar from 'material-ui/AppBar';
import {ConfirmDialog} from '../../components/Dialog/ConfirmDialog';

describe('CreateExport component', () => {
    const muiTheme = getMuiTheme();

    function getProps() {
        return {
            router: {
                push: () => {},
                setRouteLeaveHook: () => {},
            },
            routes: [],
        };
    }

    function getMountedWrapper(props = getProps()) {
        const store = fakeStore(initialState);
        return mount(<CreateExport { ...props }><div id='my-child-element'/></CreateExport>, {
            context: {muiTheme, store},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                store: React.PropTypes.object
            }
        });
    }

    it('should render the elements', () => {
        // dont render the full component tree
        const content = BreadcrumbStepper.prototype.getStepContent;
        BreadcrumbStepper.prototype.getStepContent = () => {return <div/>};

        const wrapper = getMountedWrapper();
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(BreadcrumbStepper)).toHaveLength(1);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
        expect(wrapper.find('#my-child-element')).toHaveLength(1);

        // restore content function
        BreadcrumbStepper.prototype.getStepContent = content;
    });
});
