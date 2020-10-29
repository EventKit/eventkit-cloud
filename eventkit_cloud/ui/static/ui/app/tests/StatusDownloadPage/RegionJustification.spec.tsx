import * as React from 'react';
import {fireEvent, render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'
import {RegionJustification} from "../../components/StatusDownloadPage/RegionJustification";
import {_RegionProvider} from "../../components/common/context/RegionContext";
import {RegionalJustificationDialog} from "../../components/Dialog/RegionalJustification/RegionalJustificationDialog";

const featureCollectionExtent = {
    type: 'FeatureCollection',
    features: [{
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [100.0, 0.0],
                    [101.0, 0.0],
                    [101.0, 1.0],
                    [100.0, 1.0],
                    [100.0, 0.0],
                ],
            ],
        },
    }],
};

const featureCollectionPolicy = {
    type: 'FeatureCollection',
    features: [{
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [100.0, 0.0],
                    [102.0, 0.0],
                    [102.0, 1.0],
                    [100.0, 1.0],
                    [100.0, 0.0],
                ],
            ],
        },
    }],
};

jest.mock('../../components/Dialog/RegionalJustification/RegionalJustificationDialog', () => {
    // eslint-disable-next-line global-require,no-shadow
    const React = require('react');
    // eslint-disable-next-line react/prop-types
    return (props) => (
        <div id="regionjustification">
            RegionalJustificationDialog
            <button className="qa-submit" onClick={() => props.onSubmit('sdfg')}>
                submit button
            </button>
        </div>
    );
});

const policy = {
    providers: [{slug: 'providerslug', uid: 'sluguid', name: 'providername'}],
    uid: 'policyuid',
    policies: [{title: 'policy1 title', description: 'policy1 description'}],
    policy_footer_text: 'footer text',
    policy_cancel_text: 'cancel text',
    policy_header_text: 'header text',
    policy_title_text: 'title text',
    policy_cancel_button_text: 'cancel button text',
    region: featureCollectionPolicy,
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
} as Eventkit.RegionPolicy;

describe('Region justification component', () => {
    const defaultProps = () => ({
        open: true,
        onClose: jest.fn(),
        providers: [{slug: 'providerslug'}],
        extents: [featureCollectionExtent],
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}, contextProps={}, renderer=render as any) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        return renderer(
            <_RegionProvider value={{
                getPolicies: jest.fn(),
                isFetching: false,
                hasError: false,
                policies: [policy],
                submitPolicy: jest.fn(),
                submittedPolicies: [],
                ...contextProps,
            }}>
                <RegionJustification {...props} />
            </_RegionProvider>
        );

    };

    it('should not display regionaljustification dialog by when provider isnt specified', () => {
        setup({providers:[]});
        expect(screen.queryByText('RegionalJustificationDialog')).not.toBeInTheDocument();
    });

    it('should fire onSubmit event when button is clicked.', () => {
        const submitSpy = jest.fn();
        setup(undefined, {submitPolicy: submitSpy});

        const submitButton = document.querySelector(`.qa-submit`);
        expect(submitButton).toBeInTheDocument();
        expect(submitSpy).not.toHaveBeenCalled()
        fireEvent(
            submitButton,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(submitSpy).toHaveBeenCalledTimes(1);
    });
});
