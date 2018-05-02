import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Dialog from 'material-ui/Dialog';
import ShareBaseDialog from '../../components/DataPackShareDialog/ShareBaseDialog';


describe('MembersHeaderRow component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            title: 'SHARE',
            children: [<div>hello</div>],
            submitButtonLabel: 'SAVE',
            show: true,
            onClose: () => {},
            handleSave: () => {},
        }
    );

    const getWrapper = props => (
        mount(<ShareBaseDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Dialog)).toHaveLength(1);
    });

    it('componentDidMount should add an event listener', () => {
        const props = getProps();
        const addStub = sinon.stub(global.window, 'addEventListener');
        const wrapper = getWrapper(props);
        expect(addStub.called).toBe(true);
        expect(addStub.calledWith('resize', wrapper.instance().handleResize)).toBe(true);
        addStub.restore();
    });

    it('componentWillUnmount should remove event listener', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const func = wrapper.instance().handleResize;
        const removeSpy = sinon.spy(global.window, 'removeEventListener');
        wrapper.unmount();
        expect(removeSpy.called).toBe(true);
        expect(removeSpy.calledWith('resize', func)).toBe(true);
        removeSpy.restore();
    });

    it('handleResize should setState if mobile has changed', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const { mobile } = wrapper.state();
        const mobileStub = sinon.stub(wrapper.instance(), 'isMobile').returns(!mobile);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleResize();
        expect(mobileStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ mobile: !mobile })).toBe(true);
        mobileStub.restore();
        stateStub.restore();
    });

    it('isMobile should return a bool indicating if the screen width is less than 768px', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const width = global.window.innerWidth;
        expect(wrapper.instance().isMobile()).toBe(width < 768);
    });

    it('should set styles based on isMobile', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        window.resizeTo(500, 500);
        wrapper.update();
        expect(wrapper.find(Dialog).props().contentStyle.transform).toEqual('translate(0px, 16px)');
    });
});
