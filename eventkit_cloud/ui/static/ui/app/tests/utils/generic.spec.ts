import * as sinon from 'sinon';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import * as utils from '../../utils/generic';
import {ensureErrorShape, getDefaultFormat, getDuration, shouldDisplay} from '../../utils/generic';
import Polygon from "ol/geom/Polygon";

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
        const geojson = {type: 'FeatureCollection', features: []};
        const feature = new Feature();
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeatures').returns([feature]);
        const features = utils.getFeaturesFromGeojson(geojson);
        expect(features.length).toBe(1);
        expect(readStub.calledWith(geojson)).toBe(true);
        readStub.restore();
    });

    it('getFeaturesFromGeojson should return an array of features from a single feature input', () => {
        const geojson = {type: 'Feature', geometry: {}};
        const feature = new Feature();
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeature').returns(feature);
        const features = utils.getFeaturesFromGeojson(geojson);
        expect(features.length).toBe(1);
        expect(readStub.calledWith(geojson)).toBe(true);
        readStub.restore();
    });

    it('getFeaturesFromGeojson should return empty array if input is not Feature or FeatureCollection', () => {
        const geojson = {type: 'This is not correct'};
        const features = utils.getFeaturesFromGeojson(geojson);
        expect(features.length).toBe(0);
    });

    it('getSqKm should reading geojson and calculate total area', () => {
        const geojson = {type: 'FeatureCollection', features: []};
        const feature = new Feature(new Polygon([[[-1, -1, 1, 1]]]));
        const getArea = () => 5000000;
        const transform = (from: string, to: string) => ({getArea});
        feature.getGeometry = () => ({transform}) as unknown as Polygon;
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeatures').returns([feature]);
        const area = utils.getSqKm(geojson);
        expect(area).toEqual(5);
        readStub.restore();
    });

    it('getSqKmString should call getSqKm and return a formated string', () => {
        expect(utils.getSqKmString({type: 'FeatureCollection', features: []})).toEqual('0 sq km');
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
            description: '', name: '', uid: '', slug: 'gpkg', supported_projections: []
        };
        const format2: Eventkit.Format = {
            description: '', name: '', uid: '', slug: 'gtiff', supported_projections: []
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
            description: '', name: '', uid: '', slug: 'hdr', supported_projections: []
        };
        const format2: Eventkit.Format = {
            description: '', name: '', uid: '', slug: 'gtiff', supported_projections: []
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
            description: '', name: '', uid: '', slug: 'hdr', supported_projections: []
        };
        const supportedFormats: Eventkit.Format[] = [format1];
        const provider: Partial<Eventkit.Provider> = {
            supported_formats: supportedFormats,
            type: 'wcs',
            hidden: false,
        };
        expect(getDefaultFormat(provider)).toEqual(['hdr']);
    });

    it('should be able to tell if a provider is hidden', () => {
        const provider = {
            slug: 'definitelyrealslug',
            name: 'actuallyafakename',
            display: true,
            hidden: false,
        };
        expect(shouldDisplay({
            ...provider,
        })).toBe(true);

        expect(shouldDisplay({
            ...provider,
            display: undefined,
        })).toBe(false);

        expect(shouldDisplay({
            ...provider,
            display: false,
        })).toBe(false);

        expect(shouldDisplay({
            ...provider,
            hidden: true,
        })).toBe(false);
    });
});

describe('Get Duration utility', () => {

    it('should be correct for some arbitrary duration', () => {
        // 3 hours 15 minutes 27 seconds
        // We ignore seconds
        expect(getDuration(11727, false)).toBe('3h 15m');
    });

    it('should return a default string when capped', () => {
        expect(getDuration(100000000000000000000, true)).toBe('At least 1 day');
        expect(getDuration(100000000000000000000, false)).not.toBe('At least 1 day');
    });

    it('should handle large values well', () => {
        expect(getDuration(Number.MAX_SAFE_INTEGER + 1, false)).toBe('104249991374d 7h 36m');
    });

    it('should handle negative and positive numbers the same', () => {
        expect(getDuration(-Number.MAX_SAFE_INTEGER, false)).toBe('104249991374d 7h 36m');
        expect(getDuration(Number.MAX_SAFE_INTEGER, false)).toBe('104249991374d 7h 36m');
    });


    it('should consistently handle sub-minute durations', () => {
        expect(getDuration(59, false)).toBe('<1m');
        expect(getDuration(0, false)).toBe('<1m');
        expect(getDuration(1, false)).toBe('<1m');
        expect(getDuration(60, false)).toBe('1m');
    });
});

// This utility is used to force errors into the bare minimum shape required to prevent crashing during back end errors
describe('Error Shape utility', () => {
    const defaultError = {
        detail: 'Unexpected error encountered during request.',
        title: 'Undefined Error',
        status: 'undefined',
    };
    const error = {
        detail: 'Test error detail',
        title: 'TEST ERROR',
        status: '500',
    }

    it('should return a default error when response data is falsey', () => {
        expect(ensureErrorShape(null)).toEqual(
            {
                errors: [{
                    ...defaultError
                }],
                content: null,
            }
        );
    });

    it('should return a default error when response data is falsey - content should be passed along', () => {
        expect(ensureErrorShape('error message string')).toEqual(
            {
                errors: [{
                    ...defaultError
                }],
                content: 'error message string',
            }
        );
    });

    it('should reshape errors property if it is not an array', () => {
        expect(ensureErrorShape({errors: error})).toEqual(
            {
                errors: [{
                    ...error
                }]
            }
        );
    });

    it('should fill in missing error pieces', () => {
        expect(ensureErrorShape({
            errors: [
                {...error, status: undefined}
            ]})).toEqual(
            {
                errors: [{
                    ...error, status: defaultError.status,
                }]
            }
        );
        expect(ensureErrorShape({
            errors: [
                {...error, detail: undefined}
            ]})).toEqual(
            {
                errors: [{
                    ...error, detail: defaultError.detail,
                }]
            }
        );
        expect(ensureErrorShape({
            errors: [
                {...error, title: undefined}
            ]})).toEqual(
            {
                errors: [{
                    ...error, title: defaultError.title,
                }]
            }
        );
    });
});
