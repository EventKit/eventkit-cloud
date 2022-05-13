import * as sinon from 'sinon';
import '@testing-library/jest-dom/extend-expect'
import {render} from "@testing-library/react";


jest.doMock("../../components/Dialog/BaseDialog", () => {
    return (props) => (<div className="basedialog">{props.children}</div>);
});

jest.doMock("../../components/common/DropDownListItem", () => {
    return (props) => (<div className="basedialog">{props.children}</div>);
});

const {ProviderDialog} = require('../../components/Dialog/ProviderDialog');

const providers = [
    {
        slug: 'one-slug',
        name: 'one',
        service_description: 'one info',
        hidden: false,
        display: true,
    },
    {
        slug: 'three-slug',
        name: 'three',
        service_description: 'three info',
        hidden: false,
        display: true,
    }
];

describe('ProviderDialog component', () => {

    const getProps = () => ({
        open: true,
        uids: ['1', '3'],
        providerTasks: {
            '1': {
                uid: '1',
                slug: 'one-slug',
                provider: providers[0],
                hidden: false,
                display: true,
            },
            '3': {
                uid: '3',
                slug: 'three-slug',
                provider: providers[1],
                hidden: false,
                display: true,
            },
        },
        providers,
        onClose: sinon.stub(),
        getProviderTask: sinon.stub(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let props;
    const setup = (propsOverride = {}) => {
        props = {
            ...getProps(),
            ...propsOverride,
        };
        return render(<ProviderDialog {...props} />);
    };


    it('should render a Dialog', () => {
        setup();
        expect(document.querySelector(`.basedialog`)).toBeInTheDocument();
    });


    it('should return null when not open', () => {
        setup({open: false})
        expect(document.querySelector(`.basedialog`)).not.toBeInTheDocument();
    });

    it('should call getProviders on mount', () => {
        setup();
        expect(props.getProviderTask.called).toBe(true);
    });

    it('should call getProviders if component updates to "open"', () => {
        const {rerender} = setup({open: false});
        expect(props.getProviderTask.called).toBe(false);
        rerender(<ProviderDialog {...{...props, open: true}} />);
        expect(props.getProviderTask.called).toBe(true);
    });
    //
    // it('getProviders should get provider tasks for each uid', async () => {
    //     const stateStub = sinon.stub(wrapper.instance(), 'setState');
    //     props.getProviderTask.reset();
    //     const uids = ['1', '2', '3'];
    //     await wrapper.instance().getProviders(uids);
    //     expect(stateStub.calledTwice).toBe(true);
    //     expect(props.getProviderTask.callCount).toEqual(uids.length);
    //     expect(stateStub.calledWith({loading: true})).toBe(true);
    //     expect(stateStub.calledWith({loading: false})).toBe(true);
    // });
    //
    // it('should show progress indicator', () => {
    //     expect(wrapper.find(Progress)).toHaveLength(0);
    //     wrapper.setState({loading: true});
    //     expect(wrapper.find(Progress)).toHaveLength(1);
    // });
    //
    // it('should show List with items for each provider', () => {
    //     wrapper.setState({loading: false});
    //     expect(wrapper.find(BaseDialog).dive().find(List)).toHaveLength(1);
    //     expect(wrapper.find(BaseDialog).dive().find(DropDownListItem)).toHaveLength(2);
    // });
    //
    // it('should show only available provider info', () => {
    //     setup({providers: [props.providers[0]]});
    //     wrapper.setState({loading: false});
    //     expect(wrapper.find(BaseDialog).dive().find(DropDownListItem)).toHaveLength(1);
    // });
});
