import {shallow} from "enzyme";
import * as sinon from 'sinon';
import * as React from "react";
import EstimateContainer from "../../components/CreateDataPack/EstimateContainer";
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
            getProviders: sinon.spy(),
            ...(global as any).eventkit_test_props,
            classes: {},
        }
    );

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}, serveEstimates = true) => {
        const config = {
            SERVE_ESTIMATES: serveEstimates
        };
        props = {...getProps(), ...overrides};
        wrapper = shallow(<EstimateContainer {...props} />, {
            context: {config},
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('getAvailability should return updated provider', async () => {
        const mock = new MockAdapter(axios, {delayResponse: 10});
        const provider = {
            slug: '123',
        };
        const expected = {
            status: 'some status',
            slug: provider.slug,
        };
        mock.onPost(`/api/providers/${provider.slug}/status`)
            .reply(200, {status: 'some status'});
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
            status: 'WARN',
            type: 'CHECK_FAILURE',
            message: 'An error occurred while checking this provider\'s availability.',
            slug: provider.slug,
        };
        const newProvider = await instance.getAvailability(provider, {});
        expect(newProvider).toEqual(expected);
        mock.restore();
    });

    it('checkProvider should call checkAvailablity and checkEstimate for a provider', async () => {
        const provider = {display: true};
        const checkAvailStub = sinon.stub(instance, 'checkAvailability').resolves({});
        const checkEstStub = sinon.stub(instance, 'checkEstimate');
        await instance.checkProvider(provider);
        expect(checkAvailStub.calledOnce).toBe(true);
        expect(checkEstStub.calledOnce).toBe(true);
    });

    it('checkProvider should not call checkAvailablity and checkEstimate when provider display is set to false', async () => {
        const provider = {display: false};
        const checkAvailStub = sinon.stub(instance, 'checkAvailability').resolves({});
        const checkEstStub = sinon.stub(instance, 'checkEstimate');
        await instance.checkProvider(provider);
        expect(checkAvailStub.called).toBe(false);
        expect(checkEstStub.called).toBe(false);
    });

    it('updated estimates should trigger componentDidUpdate', async () => {
        const updateSpy = sinon.spy(instance, 'componentDidUpdate');
        expect(updateSpy.called).toBe(false);
        instance.setState({sizeEstimate: 4, timeEstimate: 10});
        wrapper.update();
        expect(updateSpy.called).toBe(true);
        updateSpy.restore();
    });

    it('componentDidUpdate should update the providers and call checkProviders', () => {
        const checkStub = sinon.stub(instance, 'checkProviders');
        const nextProps = getProps();
        nextProps.providers = [{slug: '124'}];
        wrapper.setProps(nextProps);
        expect(checkStub.calledWith(nextProps.providers)).toBe(true);
    });
});