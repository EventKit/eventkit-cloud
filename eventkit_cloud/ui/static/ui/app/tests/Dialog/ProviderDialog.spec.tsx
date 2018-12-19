import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import List from '@material-ui/core/List';
import Progress from '@material-ui/core/CircularProgress';
import BaseDialog from '../../components/Dialog/BaseDialog';
import DropDownListItem from '../../components/common/DropDownListItem';
import { ProviderDialog } from '../../components/Dialog/ProviderDialog';

describe('ProviderDialog component', () => {
    let shallow: any;
    let wrapper;
    let props;

    const getProps = () => ({
        open : true,
        uids: ['1', '3'],
        providerTasks: {
            '1': {
                uid: '1',
                slug: 'one-slug'
            },
            '3': {
                uid: '3',
                slug: 'three-slug',
            },
        },
        providers: [
            {
                slug: 'one-slug',
                name: 'one',
                service_description: 'one info',
            },
            {
                slug: 'three-slug',
                name: 'three',
                service_description: 'three info',
            }
        ],
        onClose: sinon.stub(),
        getProviderTask: sinon.stub(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = p => shallow(<ProviderDialog {...p} />);

    const setup = (customProps = {}) => {
        props = { ...getProps(), ...customProps };
        wrapper = getWrapper(props);
    };

    beforeAll(() => {
        shallow = createShallow();
    });

    beforeEach(() => {
        setup();
    });

    afterEach(() => {
        wrapper.unmount();
    });

    it('should render a Dialog', () => {
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
    });

    it('should give the parent dialogs the close action', () => {
        expect(wrapper.find(BaseDialog).props().onClose).toEqual(props.onClose);
    });

    it('should return null when not open', () => {
        wrapper.setProps({ open: false });
        expect(wrapper.get(0)).toBe(null);
    });

    it('should call getProviders on mount', () => {
        const  getStub = sinon.stub(wrapper.instance(), 'getProviders');
        wrapper.instance().componentDidMount();
        expect(getStub.calledOnce).toBe(true);
        expect(getStub.calledWith(props.uids));
    });

    it('should call getProviders if component updates to "open"', () => {
        setup({ open: false });
        const getStub = sinon.stub(wrapper.instance(), 'getProviders');
        expect(getStub.called).toBe(false);
        wrapper.setProps({ open: true });
        expect(getStub.calledOnce).toBe(true);
        expect(getStub.calledWith(props.uids)).toBe(true);
    });

    it('getProviders should get provider tasks for each uid', async () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        props.getProviderTask.reset();
        const uids = ['1', '2', '3'];
        await wrapper.instance().getProviders(uids);
        expect(stateStub.calledTwice).toBe(true);
        expect(props.getProviderTask.callCount).toEqual(uids.length);
        expect(stateStub.calledWith({ loading: true })).toBe(true);
        expect(stateStub.calledWith({ loading: false })).toBe(true);
    });

    it('should show progress indicator', () => {
        expect(wrapper.find(Progress)).toHaveLength(0);
        wrapper.setState({ loading: true });
        expect(wrapper.find(Progress)).toHaveLength(1);
    });

    it('should show List with items for each provider', () => {
        wrapper.setState({ loading: false });
        expect(wrapper.find(BaseDialog).dive().find(List)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).dive().find(DropDownListItem)).toHaveLength(2);
    });

    it('should show only available provider info', () => {
        setup({ providers: [props.providers[0]] });
        wrapper.setState({ loading: false });
        expect(wrapper.find(BaseDialog).dive().find(DropDownListItem)).toHaveLength(1);
    });

    it('should show only available providerTask provider info', () => {
        setup({ providerTasks: { '1': props.providerTasks['1'] } });
        wrapper.setState({ loading: false });
        expect(wrapper.find(BaseDialog).dive().find(DropDownListItem)).toHaveLength(1);
    });
});
