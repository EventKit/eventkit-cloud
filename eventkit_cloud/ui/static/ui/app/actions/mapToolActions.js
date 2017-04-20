import types from './mapToolActionTypes'
import ol from 'openlayers';
import * as jsts from 'jsts';

export function setBoxButtonSelected() {
    return {type: types.SET_BOX_SELECTED}
}

export function setFreeButtonSelected() {
    return {type: types.SET_FREE_SELECTED} 
}

export function setMapViewButtonSelected() {
    return {type: types.SET_VIEW_SELECTED}
}

export function setImportButtonSelected() {
    return {type: types.SET_IMPORT_SELECTED}
}

export function setSearchAOIButtonSelected() {
    return {type: types.SET_SEARCH_SELECTED}
}

export function setAllButtonsDefault() {
    return {type: types.SET_BUTTONS_DEFAULT}
}

export function setImportModalState(visibility) {
    return {
        type: types.SET_IMPORT_MODAL_STATE,
        showImportModal: visibility,
    }
}

export function resetGeoJSONFile() {
    return {
        type: types.FILE_RESET
    }
}

function bufferGeometry(geometry){
    const bufferSize = 0.01
    if(geometry.getGeometryType() === 'Point'){
        return geometry.buffer(bufferSize)
    }
    return geometry;
}

export function processGeoJSONFile(file) {
    return (dispatch) => {
        dispatch({type: types.FILE_PROCESSING});
        const fileName = file.name;
        const ext = fileName.split('.').pop();
        if(ext != 'geojson') {
            dispatch({type: types.FILE_ERROR, error: 'File must be .geojson NOT .' + ext});
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataURL = reader.result;
            let geojson = null;
            try {
                geojson = JSON.parse(dataURL);
            }
            catch (e) {
                dispatch({type: types.FILE_ERROR, error: 'Could not parse GeoJSON'});
                return;
            }
            try {
                const geojsonReader = new jsts.io.GeoJSONReader();

                var features = geojsonReader.read(geojson).features;

                //Because the UI doesn't support multiple features combine all polygons into one feature.
                var multipolygon = bufferGeometry(features[0].geometry);
                for (var i = 1; i < features.length; i++) {
                    multipolygon = multipolygon.union(bufferGeometry(features[i].geometry));
                }

                var writer = new jsts.io.GeoJSONWriter();

                const geom = (new ol.format.GeoJSON()).readGeometry(writer.write(multipolygon)).transform('EPSG:4326', 'EPSG:3857');
                if(geom.getType() == 'Polygon' || geom.getType() == 'MultiPolygon') {
                    dispatch({type: types.FILE_PROCESSED, geom: geom});
                }
                else {
                    dispatch({type: types.FILE_ERROR, error: 'Geometry must be Polygon or MultiPolygon type, not ' + geom.getType()})
                }
            }
            catch(err){
                dispatch({type: types.FILE_ERROR, error: 'There was an error processing the geojson file.'});
                console.log(err)
                return;
            }

        }
        reader.onerror = () => {
            dispatch({type: types.FILE_ERROR, error: 'An error was encountered while reading your file'});
        }
        reader.readAsText(file);
    }
}
