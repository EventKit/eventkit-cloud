import axios from 'axios'
import { isMgrsString } from '../utils/generic';

export function getGeocode(query) {
    console.log(isMgrsString(query));
    if(isMgrsString(query)){
        console.log("this is an mgrs string jajajajajja");
        return (dispatch) => {
            dispatch({type: "FETCHING_GEOCODE"});
            return axios.get('/convert', {
                params: {
                    convert: query
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
