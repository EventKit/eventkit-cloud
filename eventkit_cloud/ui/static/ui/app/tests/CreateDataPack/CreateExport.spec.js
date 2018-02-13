import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import initialState from '../../reducers/initialState';
import {fakeStore} from '../../__mocks__/fakeStore';
import {CreateExport} from '../../components/CreateDataPack/CreateExport';
import {BreadcrumbStepper} from '../../components/BreadcrumbStepper';
import AppBar from 'material-ui/AppBar';

describe('CreateExport component', () => {
    const muiTheme = getMuiTheme();
    it('should render the elements', () => {
        // dont render the full component tree
        const content = BreadcrumbStepper.prototype.getStepContent;
        BreadcrumbStepper.prototype.getStepContent = () => {return <div/>};

        const store = fakeStore(initialState);
        const wrapper = mount(<CreateExport><div id='my-child-element'/></CreateExport>, {
            context: {muiTheme, store},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                store: React.PropTypes.object
            }
        });
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(BreadcrumbStepper)).toHaveLength(1);
        expect(wrapper.find('#my-child-element')).toHaveLength(1);

        // restore content function
        BreadcrumbStepper.prototype.getStepContent = content;      
    });
});
