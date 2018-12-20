import sinon from 'sinon';
import GeoJSON from 'ol/format/geojson';
import Feature from 'ol/feature';
import * as utils from '../../utils/generic';

describe('test generic utils', () => {
    it('getHeaderPageInfo should return nextPage and range info', () => {
        const ret = {
            headers: {
                link: 'some value, another value, value with rel="next"',
                'content-range': 'something-0/100',
            },
        };
        expect(utils.getHeaderPageInfo(ret)).toEqual({
            nextPage: true,
            range: '0/100',
        });
    });

    it('getFeaturesFromGeojson should return an array of features from a feature collection input', () => {
        const geojson = { type: 'FeatureCollection', features: [] };
        const feature = new Feature();
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeatures').returns([feature]);
        const features = utils.getFeaturesFromGeojson(geojson);
        expect(features.length).toBe(1);
        expect(readStub.calledWith(geojson)).toBe(true);
        readStub.restore();
    });

    it('getFeaturesFromGeojson should return an array of features from a single feature input', () => {
        const geojson = { type: 'Feature', geometry: {} };
        const feature = new Feature();
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeature').returns(feature);
        const features = utils.getFeaturesFromGeojson(geojson);
        expect(features.length).toBe(1);
        expect(readStub.calledWith(geojson)).toBe(true);
        readStub.restore();
    });

    it('getFeaturesFromGeojson should return empty array if input is not Feature or FeatureCollection', () => {
        const geojson = { type: 'This is not correct' };
        const features = utils.getFeaturesFromGeojson(geojson);
        expect(features.length).toBe(0);
    });

    it('getSqKm should reading geojson and calculate total area', () => {
        const geojson = { type: 'FeatureCollection', features: [] };
        const feature = new Feature();
        const getArea = () => 5000000;
        feature.getGeometry = () => ({ getArea });
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeatures').returns([feature]);
        const area = utils.getSqKm(geojson);
        expect(area).toEqual(5);
        readStub.restore();
    });

    it('getSqKmString should call getSqKm and return a formated string', () => {
        expect(utils.getSqKmString({ type: 'FeatureCollection', features: [] })).toEqual('0 sq km');
    });
});
