import * as sinon from 'sinon';
import {render, screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'

jest.doMock('react-swipeable-views', () => {
    return (props) => (
        <div>
            <span>{props.children}</span>
            <button>SwipeableView</button>
        </div>
    );
});

jest.doMock('@material-ui/icons/KeyboardArrowRight', () => {
    return (props) => (
        <button>rightarrow</button>
    );
})

jest.doMock('@material-ui/icons/KeyboardArrowLeft', () => {
    return (props) => (
        <button>leftarrow</button>
    );
})

const {ProviderPreview} = require("../../components/StatusDownloadPage/ProviderPreview");

describe('GroupsDrawer component', () => {
    const getProps = () => ({
        providerTasks: [{
            display: true,
            slug: 'slug1',
            uid: '1',
            name: '1',
            preview_url: 'thisisaurl',
            tasks: [
                {
                    uid: '1',
                    name: 'task 1',
                    status: 'SUCCESS',
                    display: true,
                    errors: [],
                },
                {
                    uid: '2',
                    name: 'task 2',
                    status: 'SUCCESS',
                    display: false,
                    errors: [],
                },
            ],
            status: 'COMPLETED',
        }],
        selectedProvider: 'slug1',
        selectProvider: sinon.spy(),
        classes: {},
        theme: {eventkit: {colors: {}}},
        ...(global as any).eventkit_test_props,
    });

    let props;
    const setup = (propsOverride = {}) => {
        props = {
            ...getProps(),
            ...propsOverride,
        };
        return render(<ProviderPreview {...props} />);
    };

    it('should render a swipeable view', () => {
        setup();
        expect(screen.getByText('SwipeableView')).toBeInTheDocument();
    });

    it('it should call onNewGroupClick', () => {
        setup();
        fireEvent.click(screen.getByText('rightarrow'));
        fireEvent.click(screen.getByText('leftarrow'));
        fireEvent.mouseEnter(screen.getByText('rightarrow'));
        expect(document.querySelector('#preview0')).toBeInTheDocument();
    });
});
