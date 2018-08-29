import PropTypes from 'prop-types';
import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import Help from '@material-ui/icons/Help';
import initialState from '../../reducers/initialState';
import { fakeStore } from '../../__mocks__/fakeStore';
import { CreateExport } from '../../components/CreateDataPack/CreateExport';
import { BreadcrumbStepper } from '../../components/CreateDataPack/BreadcrumbStepper';
import { ConfirmDialog } from '../../components/Dialog/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';

describe('CreateExport component', () => {
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
        return mount(<CreateExport {...props}><div id="my-child-element" /></CreateExport>, {
            context: { store },
            childContextTypes: {
                store: PropTypes.object,
            },
        });
    }

    it('should render the elements', () => {
        // dont render the full component tree
        const content = BreadcrumbStepper.prototype.getStepContent;
        BreadcrumbStepper.prototype.getStepContent = () => <div />;

        const wrapper = getMountedWrapper();
        expect(wrapper.find(PageHeader)).toHaveLength(1);
        expect(wrapper.find(BreadcrumbStepper)).toHaveLength(1);
        expect(wrapper.find(ConfirmDialog)).toHaveLength(1);
        expect(wrapper.find(Help)).toHaveLength(1);
        expect(wrapper.find('#my-child-element')).toHaveLength(1);

        // restore content function
        BreadcrumbStepper.prototype.getStepContent = content;
    });

    it('handleWalkthroughReset should set state', () => {
        const wrapper = shallow(<CreateExport />);
        const stateSpy = sinon.spy(CreateExport.prototype, 'setState');
        wrapper.instance().handleWalkthroughReset();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ walkthroughClicked: false }));
        stateSpy.restore();
    });

    it('handleWalkthroughClick should set state', () => {
        const wrapper = shallow(<CreateExport />);
        const stateSpy = sinon.spy(CreateExport.prototype, 'setState');
        wrapper.instance().handleWalkthroughClick();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ walkthroughClicked: true }));
        stateSpy.restore();
    });
});
