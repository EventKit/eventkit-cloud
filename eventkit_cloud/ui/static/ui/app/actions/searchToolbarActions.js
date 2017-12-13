import axios from 'axios'
import { isMgrsString } from '../utils/generic';

export function getGeocode(query) {
    if(isMgrsString(query)){
        
        return (dispatch) => {
            dispatch({type: "FETCHING_GEOCODE"});
            return axios.get('/convert', {
                params: {
                    convert: query
                }
            }).then(response => {
                return response.data;
            }).then(responseData => {
                let data = [];
                if(responseData.geometry){
                    let degreeRange = 0.05;
                    for(const k in responseData.properties) responseData[k]=responseData.properties[k];
                    responseData.properties.bbox = [(responseData.geometry.coordinates[0])-degreeRange, (responseData.geometry.coordinates[1])-degreeRange, (responseData.geometry.coordinates[0])+degreeRange, (responseData.geometry.coordinates[1])+degreeRange];
                    data.push(responseData);
                }                
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
                        }
                        
                    }
                )
                dispatch({type: "RECEIVED_GEOCODE", data: data});
            }).catch(error => {
                dispatch({type: "GEOCODE_ERROR", error: error});
            });
        }
    }
    
}
