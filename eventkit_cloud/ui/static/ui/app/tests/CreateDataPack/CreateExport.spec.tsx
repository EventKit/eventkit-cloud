import * as React from 'react';
import { shallow } from 'enzyme';
import * as sinon from 'sinon';
import Help from '@material-ui/icons/Help';
import { CreateExport } from '../../components/CreateDataPack/CreateExport';
import BreadcrumbStepper from '../../components/CreateDataPack/BreadcrumbStepper';
import PageHeader from '../../components/common/PageHeader';

describe('CreateExport component', () => {
    function getProps() {
        return {
            router: {
                push: sinon.spy(),
                setRouteLeaveHook: sinon.spy(),
            },
            routes: [],
            ...(global as any).eventkit_test_props,
        };
    }

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<CreateExport {...props}><div id="my-child-element" /></CreateExport>);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the elements', () => {
        expect(wrapper.find(PageHeader)).toHaveLength(1);
        expect(wrapper.find(BreadcrumbStepper)).toHaveLength(1);
        expect(wrapper.find(Help)).toHaveLength(1);
        expect(wrapper.find('#my-child-element')).toHaveLength(1);
    });

    it('handleWalkthroughReset should set state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleWalkthroughReset();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ walkthroughClicked: false }));
        stateSpy.restore();
    });

    it('handleWalkthroughClick should set state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleWalkthroughClick();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ walkthroughClicked: true }));
        stateSpy.restore();
    });
});
