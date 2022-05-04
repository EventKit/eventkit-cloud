import * as React from 'react';
import * as sinon from 'sinon';
import {fireEvent, render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'
import {CenteredPopup} from "../../components/common/CenteredPopup";

jest.mock('@mui/material/Popover', () => {
    // eslint-disable-next-line global-require,no-shadow
    const React = require('react');
    // eslint-disable-next-line react/prop-types
    return (props) => (
        <div id="popover">
            Popover
            <div>
                {props.children}
            </div>
        </div>
    );
});


describe('Centered popup component', () => {
    const defaultProps = () => ({
        open: true,
        onClose: jest.fn(),
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        return render(<CenteredPopup {...props} />);
    };

    it('should display core information and popover component', () => {
        setup();
        // Default title if nothing is specified.
        expect(screen.queryByText('Popover')).toBeInTheDocument();
        expect(screen.queryByText('Close')).toBeInTheDocument();
    });

    it('should not display core popover when open is false', () => {
        setup({open: false});
        expect(screen.queryByText('Popover')).not.toBeInTheDocument();
    });

    it('should fire close event when button is clicked.', () => {
        const closeSpy = jest.fn();
        setup({onClose: closeSpy});
        const closeButton = document.querySelector(`.qa-BaseDialog-Button`);
        expect(closeButton).toBeInTheDocument();
        expect(closeSpy).not.toHaveBeenCalled()
        fireEvent(
            closeButton,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(closeSpy).toHaveBeenCalledTimes(1);
    });
});
