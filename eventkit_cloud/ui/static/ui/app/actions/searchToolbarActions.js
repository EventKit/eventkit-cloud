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
                if ((data[i].bbox && !isEqual(data[i].bbox, {})) || (data.lat && data.lng)) {
                    geonames.push(data[i]);
                }
            }
            dispatch({type: "RECEIVED_GEONAMES", geonames: geonames});
        }).catch(error => {
            dispatch({type: "GEONAMES_ERROR", error: error});
        });
    }
}
