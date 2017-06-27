import axios from 'axios'

export function getGeocode(query) {
    return (dispatch) => {
        dispatch({type: "FETCHING_GEOCODE"});
        return axios.get('/geocode', {
            params: {
                search: query
            }
        }).then(response => {
            return response.data;
        }).then(responseData => {
            let features = responseData.features || [];
            let data = []
            features.forEach(function (feature) {
                    if (feature.bbox || (feature.properties.lat && feature.properties.lng)) {
                        data.push(feature);
                    }
                }
            )
            // for (var i = 0; i < features.length; i++) {
            //     if ((features[i].bbox && !isEqual(features[i].bbox, {})) || (features[i].properties.lat && features[i].properties.lng)) {
            //         data.push(features[i]);
            //     }
            // }
            dispatch({type: "RECEIVED_GEOCODE", data: data});
        }).catch(error => {
            dispatch({type: "GEOCODE_ERROR", error: error});
        });
    }
}
