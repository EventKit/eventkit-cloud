import axios from 'axios';
import numeral from 'numeral';
import GeoJSON from 'ol/format/geojson';
import {useEffect, useRef} from 'react';

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

    return {nextPage, range};
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
    } else if (json.type === 'Feature') {
        return [Geojson.readFeature(json, {
            featureProjection: 'EPSG:4326',
            dataProjection: 'EPSG:4326',
        })];
    }
    return [];
}

export function getSqKm(geojson) {
    let area = 0;
    const features = getFeaturesFromGeojson(geojson);
    if (!features.length) {
        return area;
    }

    features.forEach((feature) => {
        try {
            area += feature.getGeometry().transform("EPSG:4326", "EPSG:3857").getArea() / 1000000;
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
    let remainingSeconds = seconds;
    const secondsInDay = 60 * 60 * 24;
    const secondsInHour = 60 * 60;

    if (capEstimate && seconds >= secondsInDay)
        return `At least 1 day`;

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

export function formatMegaBytes(megabytes) {
    // format a size so that it is reasonably displayed.
    // megabytes = 40 => 40 MB
    // megabytes = 1337 => 1.34 GB
    const units = ['MB', 'GB', 'TB']; // More can be added, obviously
    let order = 0;
    const mb = Number(megabytes);
    while (mb / (10 ** ((order + 1) * 3)) >= 1) {
        order += 1;
    }
    return `${Number(mb / (10 ** (order * 3))).toFixed(2)} ${units[order]}`;
}

export function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
}

export function getJobDetails(jobuid) {
    return axios.get('/api/jobs/' + jobuid)
        .then((result) => {
            return result.data
        })
        .catch(console.log)
}

export function isZoomLevelInRange(zoomLevel, provider: Eventkit.Provider) {
    return !((!zoomLevel && zoomLevel !== 0) || (zoomLevel < provider.level_from && zoomLevel > provider.level_to));
}

// Not an exhaustive list, just what I'm aware of right now.
const typesSupportingZoomLevels = ['tms', 'wmts', 'wms', 'arcgis-raster'];

export function supportsZoomLevels(provider: Eventkit.Provider) {
    if (provider.type === null || provider.type === undefined) {
        return false;
    }
    return typesSupportingZoomLevels.indexOf(provider.type.toLowerCase()) >= 0;
}

// This maps special case formats that only support certain projections
const formatCompatibilityMap = {
    nitf: [4326],
};
// This maps special case formats that do not support certain projections
// Use this when a format can support any projection except a specific set.
const formatIncompatibilityMap = {};

// Takes a list of formats, and returns any formats that are incompotible with the specified projection (passed by srid)
export function unsupportedFormats(projection: number, formats: Eventkit.Format[]) {
    const incompatibleFormats = [];
    formats.forEach((format) => {
        // A format should not be listed in BOTH the compatabilty and incompatibility map.
        const supportedProjections = formatCompatibilityMap[format.slug.toLowerCase()];
        const unsupportedProjections = formatIncompatibilityMap[format.slug.toLowerCase()];
        if (supportedProjections && supportedProjections.indexOf(projection) === -1) {
            // If the format ONLY supports certain projections, and this projection is not in that list
            incompatibleFormats.push(format);
        } else if (unsupportedProjections && unsupportedProjections.indexOf(projection) >= 0) {
            // If the format DOES NOT support a specific set of projections, and this projection is in that list
            incompatibleFormats.push(format);
        }
    });
    return incompatibleFormats;
}

export function getDefaultFormat(provider: Partial<Eventkit.Provider>) {
    const supportedFormats = provider.supported_formats;

    const defaultFormatsList = [];
    if (supportedFormats.length !== 0) {
        if (provider.type.toLowerCase() === 'wcs') {
            if (supportedFormats.map(format => format.slug).indexOf('gpkg') >= 0) {
                defaultFormatsList.push('gpkg');
            } else if (supportedFormats.map(format => format.slug).indexOf('gtiff') >= 0) {
                defaultFormatsList.push('gtiff');
            }
        } else if (supportedFormats.map(format => format.slug).indexOf('gpkg') >= 0) {
            defaultFormatsList.push('gpkg');
        }
    }
    if (defaultFormatsList.length === 0) {
        defaultFormatsList.push(supportedFormats[0].slug);
    }
    return defaultFormatsList;
}

export function getFeatureUrl(mapLayer, z, y, x, i, j) {
    // MapProxy identifies the zoom level by the TileMatrix name which are named like so, 00, 01, 02...18, 19.
    const tileMatrixId = z.toString().padStart(1, '2');
    return `${mapLayer.metadata.url}?FORMAT=application%2Fjson&InfoFormat=application%2Fjson&LAYER=${mapLayer.slug}&`
        + 'REQUEST=GetFeatureInfo&SERVICE=WMTS&STYLE=default&'
        + `TILECOL=${x}&TILEMATRIX=${tileMatrixId}&TILEMATRIXSET=default&TILEROW=${y}&VERSION=1.0.0&i=${i}&j=${j}`;
}
