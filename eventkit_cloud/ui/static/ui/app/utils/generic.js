import numeral from 'numeral';
import GeoJSON from 'ol/format/geojson';

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
    } else if (!Number.isNaN(parseFloat(coordArray[0]) && !Number.isNaN(parseFloat(coordArray[1])))) {
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
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
    } else if (json.type === 'Feature') {
        return [Geojson.readFeature(json, {
            featureProjection: 'EPSG:3857',
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
            area += feature.getGeometry().getArea() / 1000000;
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
