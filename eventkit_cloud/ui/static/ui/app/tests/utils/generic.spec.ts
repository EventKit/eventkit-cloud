import * as sinon from 'sinon';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import * as utils from '../../utils/generic';
import { getDefaultFormat } from '../../utils/generic';

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
        const transform = (from: string, to: string) => ({ getArea });
        feature.getGeometry = () => ({ transform });
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeatures').returns([feature]);
        const area = utils.getSqKm(geojson);
        expect(area).toEqual(5);
        readStub.restore();
    });

    it('getSqKmString should call getSqKm and return a formated string', () => {
        expect(utils.getSqKmString({ type: 'FeatureCollection', features: [] })).toEqual('0 sq km');
    });

    it('formatMegaBytes should convert 1000 to 1.00 GB', () => {
        expect(utils.formatMegaBytes(1000)).toEqual('1.00 GB');
    });

    it('formatMegaBytes should convert 1 to 1.00 MB', () => {
        expect(utils.formatMegaBytes(1)).toEqual('1.00 MB');
    });

    it('formatMegaBytes should convert 19999 to 20.00 GB', () => {
        expect(utils.formatMegaBytes(19999)).toEqual('20.00 GB');
    });

    it('formatMegaBytes should convert 1000000 to 1.00 TB', () => {
        expect(utils.formatMegaBytes(1000000)).toEqual('1.00 TB');
    });

    it('getDefaultFormat should return a gpkg if not wcs', () => {
        const format1: Eventkit.Format = {
            description: '', name: '', uid: '', slug: 'gpkg',
        };
        const format2: Eventkit.Format = {
            description: '', name: '', uid: '', slug: 'gtiff',
        };
        const supportedFormats: Eventkit.Format[] = [format1, format2];
        const provider: Partial<Eventkit.Provider> = {
            supported_formats: supportedFormats,
            type: 'wms',
            hidden: false,
        };
        expect(getDefaultFormat(provider)).toEqual(['gpkg']);
    });

    it('getDefaultFormat should return a gtiff if wcs', () => {
        const format1: Eventkit.Format = {
            description: '', name: '', uid: '', slug: 'hdr',
        };
        const format2: Eventkit.Format = {
            description: '', name: '', uid: '', slug: 'gtiff',
        };
        const supportedFormats: Eventkit.Format[] = [format1, format2];
        const provider: Partial<Eventkit.Provider> = {
            supported_formats: supportedFormats,
            type: 'wcs',
            hidden: false,
        };
        expect(getDefaultFormat(provider)).toEqual(['gtiff']);
    });

    it('getDefaultFormat should return something if geotiff or gpkg are not available', () => {
        const format1: Eventkit.Format = {
            description: '', name: '', uid: '', slug: 'hdr',
        };
        const supportedFormats: Eventkit.Format[] = [format1];
        const provider: Partial<Eventkit.Provider> = {
            supported_formats: supportedFormats,
            type: 'wcs',
            hidden: false,
        };
        expect(getDefaultFormat(provider)).toEqual(['hdr']);
    });
});
