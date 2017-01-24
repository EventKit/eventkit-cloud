import {Config} from '../config'
import * as types from './actionTypes'
import fetch from 'isomorphic-fetch'
const isEqual = require('lodash/isEqual');


export function getGeonames(query) {
    return (dispatch) => {
        dispatch({type: "FETCHING_GEONAMES"});
        return fetch(`http:\/\/api.geonames.org/searchJSON?q=${query}&maxRows=${20}&username=${'hotexports'}&style=${'full'}`, {
            method: 'POST',
        }).then(response => {
            return response.json();
        }).then(responseData => {
            let data = responseData.geonames;
            let geonames = []
            for(var i=0;i<data.length;i++) {
                if (data[i].bbox && !isEqual(data[i].bbox, {})) {
                    geonames.push(data[i]);
                }
            }
            dispatch({type: "RECEIVED_GEONAMES", geonames: geonames});
        }).catch(error => {
            dispatch({type: "GEONAMES_ERROR", error: error});
        });
    }
}

export function drawSearchBbox(searchBbox) {
    return {
        type: types.DRAW_SEARCH_BBOX,
        searchBbox: searchBbox,
    }
}

export function clearSearchBbox() {
    return {
        type: types.CLEAR_SEARCH_BBOX,
    }
}