import * as sinon from 'sinon';
import {fireEvent, render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'

// Base dialog is typically mocked out with simple text because it can cause issues,
// In this case we're mocking it more comprehensively so we can verify that the actions and title
// contain the appropriate text.
jest.doMock('../../../components/Dialog/BaseDialog',  () => {
    return (props) => (
        <div id="basedialog">
            <span>{props.title}</span>
            <span>{props.actions.map(action => action)}</span>
            <span>{props.children}</span>
        </div>
    );
});

jest.doMock(
    '../../../components/Dialog/RegionalJustification/TextLabel',
    () => () => 'textlabel'
);
jest.doMock(
    '../../../components/Dialog/RegionalJustification/JustificationDropdown',
    () => () => 'dropdown'
);
// Replace the spinner component to make it easier to find during testing
jest.doMock('@material-ui/core/CircularProgress', () => {
    return () => (<div>spinner</div>);
});

const {RegionalJustificationDialog} = require("../../../components/Dialog/RegionalJustification/RegionalJustificationDialog");

describe('CreateDataPackButton component', () => {
    const defaultProps = () => ({
        policy: {
            providers: [{slug: 'providerslug', uid: 'sluguid', name: 'providername'}],
            uid: 'policyuid',
            policies: [{title: 'policy1 title', description: 'policy1 description'}],
            policy_footer_text: 'footer text',
            policy_cancel_text: 'cancel text',
            policy_header_text: 'header text',
            policy_title_text: 'title text',
            policy_cancel_button_text: 'cancel button text',
            region: {},
            justification_options: [{
                id: '1',
                name: 'option1',
                display: true,
                suboption: {
                    type: 'dropdown',
                    options: ['option1 dropoption1', 'option1 dropoption2'],
                },
            }, {
                id: '2',
                name: 'option2',
                display: true,
                suboption: {
                    type: 'text',
                    label: 'option2 label text',
                },
            }],
        } as Eventkit.RegionPolicy,
        isOpen: true,
        onSubmit: sinon.spy(),
        onClose: sinon.spy(),
        classes: {},
        theme: {
            eventkit: {
                images: {},
                colors: {}
            }
        },
        width: {},
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        return render(<RegionalJustificationDialog {...props} />);
    };

    it('should display core policy information', () => {
        setup();
        // Default title if nothing is specified.
        expect(screen.queryByText('Region Policy')).not.toBeInTheDocument();
        expect(screen.getByText('footer text')).toBeInTheDocument();
        expect(screen.getByText('header text')).toBeInTheDocument();
        expect(screen.getByText('title text')).toBeInTheDocument();
        expect(screen.getByText('cancel text')).toBeInTheDocument();
        expect(screen.getByText('cancel button text')).toBeInTheDocument();
        expect(screen.getByText('policy1 title')).toBeInTheDocument();
        expect(screen.getByText('policy1 description')).toBeInTheDocument();
    });

    it('should not display core policy information if policy is not present', () => {
        setup({policy: undefined});
        expect(screen.getByText('Region Policy')).toBeInTheDocument();
        expect(screen.getByText('spinner')).toBeInTheDocument();
    });

    it('should not show policy description until drop down is clicked.', () => {
        setup();
        // Default title if nothing is specified.
        expect(screen.queryByText('textlabel')).not.toBeInTheDocument();
        expect(screen.queryByText('dropdown')).not.toBeInTheDocument();

        let radioSelect = document.querySelector(`input[name='qa-radio-select-1']`);
        expect(radioSelect).toBeInTheDocument();
        // open menu
        fireEvent(
            radioSelect,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(screen.queryByText('textlabel')).not.toBeInTheDocument();
        expect(screen.queryByText('dropdown')). toBeInTheDocument();

        radioSelect = document.querySelector(`input[name='qa-radio-select-2']`);
        expect(radioSelect).toBeInTheDocument();
        // open menu
        fireEvent(
            radioSelect,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(screen.queryByText('textlabel')).toBeInTheDocument();
        expect(screen.queryByText('dropdown')).not.toBeInTheDocument();
    });
});
