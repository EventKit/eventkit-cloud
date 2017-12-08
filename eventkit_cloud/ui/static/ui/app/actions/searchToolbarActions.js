import axios from 'axios'
import { isMgrsString } from '../utils/generic';

export function getGeocode(query) {
    console.log(isMgrsString(query));
    if(isMgrsString(query)){
        console.log("Detected MGRS String");
        return (dispatch) => {
            dispatch({type: "FETCHING_GEOCODE"});
            return axios.get('/convert', {
                params: {
                    convert: query
                }
            }).then(response => {
                return response.data;
            }).then(responseData => {
                console.log(responseData);
                let data = [];
                for(const k in responseData.properties) responseData[k]=responseData.properties[k];
                responseData.bbox = [(responseData.geometry.coordinates[0])-1, (responseData.geometry.coordinates[1])-1, (responseData.geometry.coordinates[0])+1, (responseData.geometry.coordinates[1])+1];
                data.push(responseData);
                console.log(data);
                dispatch({type: "RECEIVED_GEOCODE", data: data});
            });
                
        }
    }
    else{
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
                
                features.forEach(function (feature, i) {
                        if (feature.geometry) {
                          //prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
                          for(const k in feature.properties) feature[k]=feature.properties[k];
                          data.push(feature)
                          if(i === 0){
                              console.log(feature);
                          }
                        }
                        
                    }
                )
                console.log(data);
                dispatch({type: "RECEIVED_GEOCODE", data: data});
            }).catch(error => {
                dispatch({type: "GEOCODE_ERROR", error: error});
            });
        }
    }
    
}
