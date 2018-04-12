import axios from 'axios';
// import { isMgrsString, isLatLon } from '../utils/generic';

export function getGeocode(query) {
    // Detect lat and lon if possible
    // const validLatLon = isLatLon(query);

    // Perform MGRS parse and subsequent reverse geocode
    // if (isMgrsString(query)) {
    //     return (dispatch) => {
    //         const geocodeData = [];
    //         dispatch({ type: 'FETCHING_GEOCODE' });
    //         return axios.get('/convert', {
    //             params: {
    //                 convert: query,
    //             },
    //         }).then(mgrsResponse => mgrsResponse.data)
    //             .then((mgrsData) => {
    //                 console.log(mgrsData);
    //                 const mgrs = { ...mgrsData };
    //                 if (mgrs.geometry) {
    //                     const degreeRange = 0.05;
    //                     Object.keys(mgrs.properties).forEach((k) => {
    //                         mgrs[k] = mgrs.properties[k];
    //                     });
    //                     mgrs.properties.bbox = [
    //                         (mgrs.geometry.coordinates[0]) - degreeRange,
    //                         (mgrs.geometry.coordinates[1]) - degreeRange,
    //                         (mgrs.geometry.coordinates[0]) + degreeRange,
    //                         (mgrs.geometry.coordinates[1]) + degreeRange,
    //                     ];
    //                     mgrs.source = 'MGRS';
    //                     // Add to results
    //                     geocodeData.push(mgrs);
    //                     return mgrs;
    //                 }
    //                 return null;
    //             }).then((mgrsData) => {
    //                 if (mgrsData) {
    //                     return axios.get('/reverse_geocode', {
    //                         params: {
    //                             lon: mgrsData.geometry.coordinates[0],
    //                             lat: mgrsData.geometry.coordinates[1],
    //                         },
    //                     });
    //                 }
    //                 return null;
    //             })
    //             .then(reverseResponse => reverseResponse.data)
    //             .then((reverseData) => {
    //                 const features = reverseData.features || [];
    //                 features.forEach((feature) => {
    //                     if (feature.geometry) {
    //                         // prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
    //                         Object.keys(feature.properties).forEach((k) => {
    //                             feature[k] = feature.properties[k];
    //                         });
    //                         feature.query = query;
    //                         // Add to results
    //                         geocodeData.push(feature);
    //                     }
    //                 });
    //                 dispatch({ type: 'RECEIVED_GEOCODE', data: geocodeData });
    //             })
    //             .catch((error) => {
    //                 dispatch({ type: 'GEOCODE_ERROR', error });
    //                 dispatch({ type: 'RECEIVED_GEOCODE', data: geocodeData });
    //             });
    //     };
    // } else if (validLatLon) { // Perform simple reverse geocode
    //     return (dispatch) => {
    //         const geocodeData = [];
    //         dispatch({ type: 'FETCHING_GEOCODE' });
            
    //         return axios.get('/reverse_geocode', {
    //             params: {
    //                 lat: validLatLon[0],
    //                 lon: validLatLon[1],
    //             },
    //         }).then(response => response.data)
    //             .then((responseData) => {
    //                 const features = responseData.features || [];
    //                 features.forEach((feature) => {
    //                     if (feature.geometry) {
    //                         // prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
    //                         Object.keys(feature.properties).forEach((k) => {
    //                             feature[k] = feature.properties[k];
    //                         });
    //                         feature.query = query;
    //                         // Add to results
    //                         geocodeData.push(feature);
    //                     }
    //                 });
    //                 dispatch({ type: 'RECEIVED_GEOCODE', data: geocodeData });
    //             })
    //             .catch((error) => {
    //                 dispatch({ type: 'GEOCODE_ERROR', error });
    //                 dispatch({ type: 'RECEIVED_GEOCODE', data: [] });
    //             });
    //     };
    // }
    // // Perform standard geocode
    return (dispatch) => {
        dispatch({ type: 'FETCHING_GEOCODE' });
        return axios.get('/search', {
            params: {
                query,
            },
        }).then(response => (response.data))
            .then((responseData) => {
                const features = responseData.features || [];
                const data = [];
                features.forEach((feature) => {
                    if (feature.geometry) {
                        // prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
                        Object.keys(feature.properties).forEach((k) => {
                            feature[k] = feature.properties[k];
                        });
                        data.push(feature);
                    }
                });
                dispatch({ type: 'RECEIVED_GEOCODE', data });
            })
            .catch((error) => {
                dispatch({ type: 'GEOCODE_ERROR', error });
            });
    }
}
