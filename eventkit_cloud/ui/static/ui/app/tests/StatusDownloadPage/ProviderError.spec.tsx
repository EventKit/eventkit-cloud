import * as sinon from 'sinon';
import {screen, render} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'

jest.doMock('../../components/Dialog/BaseDialog', () => {
    return (props) => (
        <div className="basedialog">
            <span>basedialog in test</span>
            {props.children}
        </div>);
});

const {ErrorDialog} = require('../../components/StatusDownloadPage/ErrorDialog');

describe('ProviderError component', () => {
    const getProps = () => ({
        name: 'OpenStreetMap Data (Themes)',
        errors: [
            {
                exception: 'AOI should not show',
            }, {
                exception: 'OSM should show',
            }, {
                exception: 'QGIS should show',
            },
        ],
        ...(global as any).eventkit_test_props,
        theme: { eventkit: {colors: {}}},
        onRetryClicked: sinon.spy(),
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...getProps(),
            ...propsOverride,
        };
        return render(<ErrorDialog {...props} />);
    };

    it('should render UI elements', () => {
        setup();
        expect(screen.getByText(/basedialog in test/)).toBeInTheDocument();
    });
});
