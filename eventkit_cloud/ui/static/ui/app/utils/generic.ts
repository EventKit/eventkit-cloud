import axios from 'axios';
import numeral from 'numeral';
import GeoJSON from 'ol/format/GeoJSON';
import Polygon from 'ol/geom/Polygon';
import MultiPolygon from "ol/geom/MultiPolygon";
import LinearRing from "ol/geom/LinearRing";

export function getHeaderPageInfo(response) {
    let nextPage = false;
    let links = [];

    if (response.headers.link) {
        links = response.headers.link.split(',');
    }

    links.forEach((link) => {
        if (link.includes('rel="next"')) {
            nextPage = true;
        }
    });

    let range = '';
    if (response.headers['content-range']) {
        [, range] = response.headers['content-range'].split('-');
    }

    return { nextPage, range };
}

export function isMgrsString(c) {
    const coord = c.replace(/\s+/g, '');
    const MGRS = /^(\d{1,2})([C-HJ-NP-X])\s*([A-HJ-NP-Z])([A-HJ-NP-V])\s*(\d{1,5}\s*\d{1,5})$/i;
    return MGRS.test(coord);
}

export function isLatLon(c) {
    // Regex for lat and lon respectively
    const lat = /^(\+|-)?(?:90(?:(?:\.0{1,20})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,20})?))$/;
    const lon = /^(\+|-)?(?:180(?:(?:\.0{1,20})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,20})?))$/;

    let coordArray = [];
    const parsedCoordArray = [];

    // Initial separation of numbers
    if (c.indexOf(',') > 0) {
        coordArray = c.split(',');
    } else {
        coordArray = c.split(' ');
    }

    if (coordArray.length > 2) {
        coordArray.forEach((coord) => {
            if (!Number.isNaN(parseFloat(coord))) {
                parsedCoordArray.push(parseFloat(coord));
            }
        });
        coordArray.forEach((coord) => {
            if (!Number.isNaN(parseFloat(coord))) {
                parsedCoordArray.push(parseFloat(coord));
            }
        });
    } else if (!Number.isNaN(parseFloat(coordArray[0])) && !Number.isNaN(parseFloat(coordArray[1]))) {
        coordArray.forEach((coord) => {
            parsedCoordArray.push(parseFloat(coord));
        });
    }

    if (parsedCoordArray.length === 2 && lat.test(parsedCoordArray[0]) && lon.test(parsedCoordArray[1])) {
        return parsedCoordArray;
    }
    return false;
}

export function getFeaturesFromGeojson(json) {
    // json can be either a feature collection or a single feature in EPSG:4326
    // returns an array of features in EPSG:3857
    const Geojson = new GeoJSON();
    if (json.type === 'FeatureCollection') {
        return Geojson.readFeatures(json, {
            featureProjection: 'EPSG:4326',
            dataProjection: 'EPSG:4326',
        });
    }
    if (json.type === 'Feature') {
        return [Geojson.readFeature(json, {
            featureProjection: 'EPSG:4326',
            dataProjection: 'EPSG:4326',
        })];
    }
    return [];
}

// convert an extent (bbox) to an openlayers polygon
export function extentToPoly(minx, miny, maxx, maxy) {
    let polyCoordRing = [[[minx, maxy], [maxx,maxy], [maxx,miny], [minx,miny], [minx,maxy]]];
    return new Polygon(polyCoordRing);
}

export function getSqKm(geojson, useExtent = false) {
    let area = 0;
    const features = getFeaturesFromGeojson(geojson);
    if (!features.length) {
        return area;
    }

    features.forEach((feature) => {
        try {
            let geo = feature.getGeometry();
            if (useExtent) {
                let [minx, miny, maxx, maxy] = geo.getExtent();
                geo = extentToPoly(minx, miny, maxx, maxy);
            }
            geo = geo.transform('EPSG:4326', 'EPSG:3857');
            if (geo instanceof Polygon || geo instanceof MultiPolygon || geo instanceof LinearRing) {
                area += geo.getArea() / 1000000;
            } else {
                area += 0;
            }
        } catch (e) {
            area += 0;
        }
    });
    return area;
}

export function getSqKmString(geojson) {
    const area = getSqKm(geojson);
    const areaStr = numeral(area).format('0,0');
    return `${areaStr} sq km`;
}

export function getDuration(seconds, capEstimate = true) {
    // returns a string duration formatted like  1d 5h 30m (1 day 5 hours 30 minutes)
    // this is calculated based on the number of seconds supplied
    let remainingSeconds = Math.abs(seconds);
    const secondsInDay = 60 * 60 * 24;
    const secondsInHour = 60 * 60;

    if (capEstimate && seconds >= secondsInDay) return 'At least 1 day';

    let days: any = Math.floor(remainingSeconds / secondsInDay);
    remainingSeconds -= days * secondsInDay;
    let hours: any = Math.floor(remainingSeconds / secondsInHour);
    remainingSeconds -= hours * secondsInHour;
    let minutes: any = Math.floor(remainingSeconds / 60);

    days = (days > 0) ? `${days}d ` : '';
    hours = (hours > 0) ? `${hours}h ` : '';
    minutes = (minutes <= 0 && days == 0 && hours == 0) ? '<1m' : `${minutes}m`;
    return `${days}${hours}${minutes}`;
}

export function formatMegaBytes(megabytes, digits = 2) {
    // format a size so that it is reasonably displayed.
    // megabytes = 40 => 40 MB
    // megabytes = 1337 => 1.34 GB
    const units = ['MB', 'GB', 'TB']; // More can be added, obviously
    let order = 0;
    const mb = Number(megabytes);
    while (mb / (10 ** ((order + 1) * 3)) >= 1) {
        order += 1;
    }
    return `${Number(mb / (10 ** (order * 3))).toFixed(digits)} ${units[order]}`;
}

export function getCookie(name) {
    const v = document.cookie.match(`(^|;) ?${name}=([^;]*)(;|$)`);
    return v ? v[2] : null;
}

export function getJobDetails(jobuid) {
    return axios.get(`/api/jobs/${jobuid}`)
        .then((result) => result.data)
        .catch(console.log);
}

export function isZoomLevelInRange(zoomLevel, provider: Eventkit.Provider) {
    return !((!zoomLevel && zoomLevel !== 0) || (zoomLevel < provider.level_from && zoomLevel > provider.level_to));
}

// Not an exhaustive list, just what I'm aware of right now.
const typesSupportingZoomLevels = ['tms', 'wmts', 'wms', 'arcgis-raster'];

export function supportsZoomLevels(provider: Eventkit.Provider) : boolean {
    if (provider.type === null || provider.type === undefined) {
        return false;
    }
    return typesSupportingZoomLevels.indexOf(provider.type.toLowerCase()) >= 0;
}

export function getDefaultFormat(provider: Partial<Eventkit.Provider>) {
    if (provider.hidden === false) {
        const supportedFormats = provider.supported_formats;

        const defaultFormatsList = [];
        if (supportedFormats.length !== 0) {
            if (provider.type.toLowerCase() === 'wcs') {
                if (supportedFormats.map((format) => format.slug).indexOf('gpkg') >= 0) {
                    defaultFormatsList.push('gpkg');
                } else if (supportedFormats.map((format) => format.slug).indexOf('gtiff') >= 0) {
                    defaultFormatsList.push('gtiff');
                }
            } else if (supportedFormats.map((format) => format.slug).indexOf('gpkg') >= 0) {
                defaultFormatsList.push('gpkg');
            }
        }
        if (defaultFormatsList.length === 0) {
            defaultFormatsList.push(supportedFormats[0].slug);
        }
        return defaultFormatsList;
    }
}

export function getFeatureUrl(mapLayer, z, y, x, i, j): string {
    // MapProxy identifies the zoom level by the TileMatrix name which are named like so, 00, 01, 02...18, 19.
    const tileMatrixId = z.toString().padStart(1, '2');
    return `${mapLayer.metadata.url}?FORMAT=application%2Fjson&InfoFormat=application%2Fjson&LAYER=${mapLayer.slug}&`
        + 'REQUEST=GetFeatureInfo&SERVICE=WMTS&STYLE=default&'
        + `TILECOL=${x}&TILEMATRIX=${tileMatrixId}&TILEMATRIXSET=default&TILEROW=${y}&VERSION=1.0.0&i=${i}&j=${j}`;
}

export function arrayHasValue(array: any[], val: any): boolean {
    return array.indexOf(val) !== -1;
}

// Searches for the full provider object in a list of providers that matches the provider task.
// The ProviderTask representation of provider lacks certain fields that the full provider has.
export function getProviderFromProviderTask(providerTask: Eventkit.ProviderTask, providers: Eventkit.Provider[]): Eventkit.Provider {
    return providers.find((provider) => provider.slug === providerTask.provider.slug);
}

// A variety of objects, Provider/Provider Task, have the display and hidden fields
// This is a utility that examines both fields to determine if the UI should allow the given object to be displayed
export function shouldDisplay(hideableObject: { hidden: boolean, display: boolean }) {
    return !!(hideableObject.display && !hideableObject.hidden);
}

// We sometimes expect error messages to be a certain shape, if something goes wrong with the error itself, we will
// modify the error shape or inject a generic error message to prevent crashes.
// If this error is encountered, the actual response object and be inspected by a developer to understand
// what went wrong during the request.
const defaultError = {
    detail: 'Unexpected error encountered during request.',
    title: 'Undefined Error',
    status: 'undefined',
};

// Expects the data portion of an error response
export function ensureErrorShape(responseData: any) {
    // If responseData comes through falsey, we will assign it to the predefined default state.
    let { errors } = (responseData || { errors: [{ ...defaultError }] });
    if (!!errors && !Array.isArray(errors)) {
        // If the errors property is not an array, convert it to one containing itself.
        errors = [errors];
    } else if (!errors) {
        // If errors does not exist at all on the response object, insert the default shape.
        errors = [{ ...defaultError }];
    }
    // For each error now present in errors, validate the existence of the properties we need
    for (let errorIndex = 0; errorIndex < errors.length; errorIndex += 1) {
        const error = errors[errorIndex];
        errors[errorIndex] = {
            ...error,
            detail: error.detail || defaultError.detail,
            title: error.title || defaultError.title,
            status: error.status || defaultError.status,
        };
    }
    // If response data is some non falsey object, return it with the updated errors property (it may be unchanged)
    if (!!responseData && typeof responseData === 'object') {
        return {
            ...responseData,
            errors,
        };
    }
    // If responseData is not a valid object, insert it as the content property to avoid losing it
    // This is done because sometimes the responseData will be a string of HTML which cannot have properties added like
    // above. In the aforementioned case, undefined, null, numbers, the original response data can be accessed via
    // the content property.
    return {
        content: responseData,
        errors,
    };
}

// We only use mebi to mega right now, if we need more, add more.
const conversionMap = {
    k: 1.024,
    m: 1.04858,
    g: 1.07374,
}

// Converts from size in powers of 2 to standard powers of 10, e.g. mebibytes to megabytes
export function binaryPrefixConversion(size, prefix='m') {
    if (conversionMap.hasOwnProperty(prefix)) {
        return size * conversionMap[prefix];
    }
    return -1;
}
