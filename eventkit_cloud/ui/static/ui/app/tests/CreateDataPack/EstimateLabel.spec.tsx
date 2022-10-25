import * as TestUtils from '../test-utils';
import EstimateLabel from "../../components/CreateDataPack/EstimateLabel";
import { screen } from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import { Visibility } from "../../utils/permissions";
import * as React from "react";
import { Breakpoint } from "@material-ui/core/styles/createBreakpoints";

describe('EstimateLabel component', () => {

    const getProps = () => ({
        show: true,
        step: 1,
        width: 'xl' as Breakpoint,
        isCollectingEstimates: false,
        sizeEstimate: 10,
        timeEstimate: 10,
        exportInfo: {
            areaStr: '',
            exportName: '',
            datapackDescription: '',
            projectName: '',
            providers: [
                {
                    display: true,
                    id: 1,
                    model_url: 'http://host.docker.internal/api/providers/1',
                    data_type: 'osm-generic',
                    created_at: '2017-03-24T17:44:22.940611Z',
                    updated_at: '2017-03-24T17:44:22.940629Z',
                    uid: 'be401b02-63d3-4080-943a-0093c1b5a914',
                    name: 'OpenStreetMap Data (Generic)',
                    slug: 'osm',
                    preview_url: '',
                    service_copyright: '',
                    service_description: '',
                    layer: null,
                    hidden: false,
                    latest_download: 2,
                    download_count: 2,
                    level_from: 0,
                    level_to: 10,
                    export_provider_type: 1,
                    metadata: {
                        type: '',
                        url: '',
                    },
                    footprint_url: '',
                    thumbnail_url: '',
                    zip: false,
                    use_bbox: false,
                    supported_formats: [],
                    favorite: false,
                    license: null,
                    the_geom: null,
                    max_data_size: '',
                    max_selection: '',
                    type: '',
                },
            ],
            providerInfo: {
                'osm': {
                    availability: {
                        type: 'vector',
                        status: 'STAT',
                        slug: 'osm',
                        message: 'test',
                    },
                }
            },
            exportOptions: {
                '123': {
                    minZoom: 0,
                    maxZoom: 2,
                    formats: [],
                }
            },
            projections: [],
            topics: [],
            formats: [],
            isProviderLoading: false,
            visibility: Visibility.PUBLIC,
        },
    });
    it( 'should render without issues', () => {
        TestUtils.renderComponent(<EstimateLabel {...getProps()} />);
    });

    it( 'should render circular progress when collecting estimates', () => {
        const props = {
            ...getProps(),
            isCollectingEstimates: true,
        };
        TestUtils.renderComponent(<EstimateLabel {...props} />);

        expect(screen.getByText('Getting calculations...', { exact: false })).toBeInTheDocument();
    });
});
