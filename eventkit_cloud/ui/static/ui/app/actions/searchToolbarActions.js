import axios from 'axios'
import { isMgrsString, isLatLon } from '../utils/generic';

export function getGeocode(query) {
    //Detect lat and lon if possible
    let validLatLon = isLatLon(query);

    //Perform MGRS parse and subsequent reverse geocode
    if(isMgrsString(query)){
        return (dispatch) => {
            let geocodeData = [];
            dispatch({type: "FETCHING_GEOCODE"});
            return axios.get('/convert', {
                params: {
                    convert: query
                }
            }).then(mgrsResponse => mgrsResponse.data
            ).then(mgrsData => {
                if(mgrsData.geometry){
                    const degreeRange = 0.05;
                    for(const k in mgrsData.properties) mgrsData[k]=mgrsData.properties[k];
                    mgrsData.properties.bbox = [(mgrsData.geometry.coordinates[0])-degreeRange, (mgrsData.geometry.coordinates[1])-degreeRange, (mgrsData.geometry.coordinates[0])+degreeRange, (mgrsData.geometry.coordinates[1])+degreeRange];
                    mgrsData.source = "MGRS";
                    //Add to results
                    geocodeData.push(mgrsData);
                    return mgrsData;
                }
                else{
                    return null;
                }
            }).then(mgrsData => {      
                if(mgrsData){
                    return axios.get('/reverse_geocode', { params:{
                        "lon": mgrsData.geometry.coordinates[0],
                        "lat": mgrsData.geometry.coordinates[1]
                    }});
                }
                else{
                    return null;
                }
            }).then(reverseResponse => reverseResponse.data
            ).then(reverseData => {
                const features = reverseData.features || [];
                features.forEach((feature, i) => {
                        if (feature.geometry) {
                          //prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
                          for(const k in feature.properties) feature[k]=feature.properties[k];
                          feature.query = query;
                          //Add to results
                          geocodeData.push(feature)
                        }
                    }
                )
                dispatch({type: "RECEIVED_GEOCODE", data: geocodeData});
            }).catch(error => {
                dispatch({type: "GEOCODE_ERROR", error: error});
                dispatch({type: "RECEIVED_GEOCODE", data: geocodeData});
            });
        }
    }
    //Perform simple reverse geocode
    else if(validLatLon){
        return (dispatch) => {
            let geocodeData = [];
            dispatch({type: "FETCHING_GEOCODE"});
            
            return axios.get('/reverse_geocode', {
                params: {
                    "lat": validLatLon[0],
                    "lon": validLatLon[1]
                }
            }).then(response => {
                return response.data;
            }).then(responseData => {
                const features = responseData.features || [];
                features.forEach((feature, i) => {
                        if (feature.geometry) {
                            //prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
                            for(const k in feature.properties) feature[k]=feature.properties[k];
                            feature.query = query;
                            //Add to results
                            geocodeData.push(feature)
                        }
                    }
                )
                dispatch({type: "RECEIVED_GEOCODE", data: geocodeData});
            }).catch(error => {
                dispatch({type: "GEOCODE_ERROR", error: error});
                dispatch({type: "RECEIVED_GEOCODE", data: []});
            });
        }
    }

    //Perform standard geocode
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
                const features = responseData.features || [], data = [];
                features.forEach((feature, i) => {
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
