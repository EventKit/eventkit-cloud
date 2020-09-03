import * as React from 'react';
import * as sinon from 'sinon';
import {ErrorDialog} from '../../components/StatusDownloadPage/ErrorDialog';
import {screen, render} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'

jest.mock('../../components/Dialog/BaseDialog', () => {
    // eslint-disable-next-line global-require,no-shadow
    const React = require('react');
    // eslint-disable-next-line react/prop-types
    return (props) => (
        <div className="basedialog">
            <span>basedialog in test</span>
            {props.children}
        </div>);
});

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
