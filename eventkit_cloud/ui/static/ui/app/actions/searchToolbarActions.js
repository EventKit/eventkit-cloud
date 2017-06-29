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
                    if (feature.geometry || (feature.properties.lat && feature.properties.lng)) {
                      //prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
                      for(const k in feature.properties) feature[k]=feature.properties[k];
                      data.push(feature)
                    }
                }
            )

            dispatch({type: "RECEIVED_GEOCODE", data: data});
        }).catch(error => {
            dispatch({type: "GEOCODE_ERROR", error: error});
        });
    }
}
