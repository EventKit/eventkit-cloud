import {shallow} from "enzyme";
import * as sinon from 'sinon';
import * as React from "react";
import {ExportInfo} from "../../components/CreateDataPack/ExportInfo";
import {EstimateContainer} from "../../components/CreateDataPack/EstimateContainer";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

describe('EstimateContainer component', () => {
    const getProps = () => (
        {
            geojson: {
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
            },
            exportInfo: {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                providers: [],
                providerInfo: {},
                exportOptions: {
                    '123': {
                        minZoom: 0,
                        maxZoom: 2,
                    }
                },
                projections: [],
            },
            providers: [],
            walkthroughClicked: false,
            onWalkthroughReset: sinon.spy(),
            updateExportInfo: sinon.spy(),
            onUpdateEstimate: sinon.spy(),
            ...(global as any).eventkit_test_props,
            classes: {},
        }
    );

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}, serveEstimates = true) => {
        const config = {
            BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png',
            SERVE_ESTIMATES: serveEstimates
        };
        props = {...getProps(), ...overrides};
        wrapper = shallow(<EstimateContainer {...props} />, {
            context: {config},
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    // it('should render a form', () => {
    //     expect(wrapper.find('#root')).toHaveLength(1);
    // });
    it('getAvailability should return updated provider', async () => {
        const mock = new MockAdapter(axios, {delayResponse: 10});
        const provider = {
            slug: '123',
        };
        mock.onPost(`/api/providers/${provider.slug}/status`)
            .reply(200, {status: 'some status'});
        const expected = {
            ...provider,
            availability: {
                status: 'some status',
                slug: provider.slug,
            },
        };
        const newProvider = await instance.getAvailability(provider, {});
        expect(newProvider).toEqual(expected);
        mock.restore();
    });

    it('getAvailability should return failed provider', async () => {
        const mock = new MockAdapter(axios, {delayResponse: 10});
        const provider = {
            slug: '123',
        };
        mock.onPost(`/api/providers/${provider.slug}/status`)
            .reply(400, {status: 'some status'});
        const expected = {
            ...provider,
            availability: {
                status: 'WARN',
                type: 'CHECK_FAILURE',
                message: 'An error occurred while checking this provider\'s availability.',
                slug: provider.slug,
            },
        };
        const newProvider = await instance.getAvailability(provider, {});
        expect(newProvider).toEqual(expected);
        mock.restore();
    });

    it('checkAvailability should setState with new provider', async () => {
        setup({providers: [{slug: '123'}]});
        const provider = {
            slug: '123',
        };

        const newProvider = {
            slug: '123',
            availability: {
                status: 'GOOD',
            },
        };

        sinon.stub(instance, 'getAvailability').callsFake(() => (
            new Promise((resolve) => {
                setTimeout(() => resolve(newProvider), 10);
            })
        ));
        const stateSpy = sinon.spy(instance, 'setState');
        await instance.checkAvailability(provider);
        expect(stateSpy.calledOnce).toBe(true);
        expect(wrapper.state().providers).toEqual([newProvider]);
    });

    it('checkEstimate should setState with new provider', async () => {
        setup({providers: [{slug: '123'}]});
        const provider = {
            slug: '123',
        };

        const newProvider = {
            slug: '123',
            estimate: {
                slug: '123',
                size: 10,
                unit: 'MB',
            }
        };

        sinon.stub(instance, 'getEstimate').callsFake(() => (
            new Promise((resolve) => {
                setTimeout(() => resolve(newProvider), 10);
            })
        ));
        const stateSpy = sinon.spy(instance, 'setState');
        await instance.checkEstimate(provider);
        expect(stateSpy.calledOnce).toBe(true);
        expect(wrapper.state().providers).toEqual([newProvider]);
    });

    it('checkEstimate should not setState when SERVE_ESTIMATES is false', async () => {
        setup({}, false);
        const provider = {
            slug: '123',
        };

        const newProvider = {
            slug: '123',
            estimate: {
                slug: '123',
                size: 10,
                unit: 'MB',
            }
        };

        sinon.stub(instance, 'getEstimate').callsFake(() => (
            new Promise((resolve) => {
                setTimeout(() => resolve(newProvider), 10);
            })
        ));
        const stateSpy = sinon.spy(instance, 'setState');
        await instance.checkEstimate(provider);
        expect(stateSpy.called).toBe(false);
        expect(wrapper.state().providers).toEqual([]);
    });
});