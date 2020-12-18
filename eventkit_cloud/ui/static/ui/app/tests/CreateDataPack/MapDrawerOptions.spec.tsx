import * as React from 'react';
import {render, screen, getByText, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'
import {MapDrawerOptions} from "../../components/CreateDataPack/MapDrawerOptions";
import {StepValidator} from "../../components/CreateDataPack/ExportValidation";

jest.mock("@material-ui/core/Grow", () => {
    const React = require('react');
    return (props) => (<div className="qa-Grow">{props.children}</div>)
});

jest.mock("@material-ui/core/Radio", () => {
    const React = require('react');
    return (props) => (<div {...props} className="qa-Radio">{props.name}</div>)
});

jest.mock("@material-ui/core/Chip", () => {
    const React = require('react');
    return (props) => (<div {...props} className="qa-Chip">CHIPLABEL-{props.label}</div>)
});

describe('FilterDrawer component', () => {
    const providers = [
        {
            id: 2,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-7777-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)1',
            slug: 'osm',
            service_description: 'OpenStreetMap vector data.',
            display: true,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
            preview_url: 'url/path/1',
            data_type: 'Raster',
        },
        {
            id: 6,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-7777-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)2',
            slug: 'osm',
            service_description: 'OpenStreetMap vector data.',
            display: true,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
            preview_url: 'url/path/1',
            data_type: 'Raster',
        },
        {
            id: 3,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-6666-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)3',
            slug: 'osm4',
            service_description: 'OpenStreetMap vector data.',
            display: true,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
            preview_url: 'url/path/2',
            data_type: 'Vector'
        },
        {
            id: 3,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-6666-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)3',
            slug: 'osm4',
            service_description: 'OpenStreetMap vector data.',
            display: false,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
            preview_url: 'url/path/2',
            data_type: 'Vector'
        },
        {
            id: 1337,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-5555-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)4',
            slug: 'osm5',
            service_description: 'OpenStreetMap vector data.',
            display: true,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
            data_type: 'Other'
        },
    ];

    const getProps = () => ({
        providers,
        setProviders: jest.fn(),
        onEnabled: jest.fn(),
        onDisabled: jest.fn(),
        classes: {},
        ...(global as any).eventkit_test_props
    });

    const setup = (overrides = {}) => {
        const props = {
            ...getProps(),
            ...overrides,
        };
        const Component = MapDrawerOptions;
        const rendered = render(<Component {...props} />);
        function _rerender(newProps={} as any) {
            return rendered.rerender(<Component {...props} {...newProps}/>);
        }

        return {
            ...rendered,
            rerender: _rerender,
        }
    };


    it('should render the closed state by default', () => {
        setup();
        expect(screen.queryByText('Filter')).toBeInTheDocument();
        expect(screen.queryByText('Filter by Name:')).not.toBeInTheDocument();
    });

    it('should render the rest after clicking filter', () => {
        setup();
        const filterLink = screen.getByText('Filter');
        fireEvent.click(filterLink);
        expect(screen.queryByText('Filter by Name:')).toBeInTheDocument();
    });

    it('should not render the rest after clicking filter again', () => {
        setup();
        const filterLink = screen.getByText('Filter');
        fireEvent.click(filterLink);
        expect(screen.queryByText('Filter by Name:')).toBeInTheDocument();
        fireEvent.click(filterLink);
        expect(screen.queryByText('Filter by Name:')).not.toBeInTheDocument();
    });

    it('should render the correct number of providers for each filter option', () => {
        setup();
        const filterLink = screen.getByText('Filter');
        fireEvent.click(filterLink);
        expect(screen.queryByText('Filter by Name:')).toBeInTheDocument();
        expect(screen.queryByText('Raster (2)')).toBeInTheDocument();
        expect(screen.queryByText('Vector (1)')).toBeInTheDocument();
        expect(screen.getByText('Other (1)')).toBeInTheDocument();
    });

    it('should render appropriate chips when filter option is clicked', () => {
        const {rerender } = setup();
        const filterLink = screen.getByText('Filter');
        fireEvent.click(filterLink);
        expect(screen.queryByText('Raster (2)')).toBeInTheDocument();
        fireEvent.click(screen.getByText('radio-Raster'));
        fireEvent.click(filterLink);
        expect(screen.getByText('CHIPLABEL-Raster')).toBeInTheDocument();

        // Repoen the drawer, and click the "elevation" radio
        fireEvent.click(filterLink);
        fireEvent.click(screen.getByText('radio-Elevation'));


        fireEvent.click(filterLink);
        expect(screen.getByText('CHIPLABEL-Elevation')).toBeInTheDocument();
    });

});