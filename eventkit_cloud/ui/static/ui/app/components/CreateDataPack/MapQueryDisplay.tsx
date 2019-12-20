import * as React from "react";
import {BaseMapSource, MapDrawer} from "./MapDrawer";
import axios from "axios";
import {getCookie} from "../../utils/generic";
import DisplayDataBox from "./DisplayDataBox";

interface featureResponse {
    lat: number;
    long: number;
    layerId: number;
    layerName: string;
    displayFieldName: string;
    value: string;
}

export interface Props {
}

export interface State {
    queryLoading: boolean;
    displayBoxData: featureResponse;
}

export class MapQueryDisplay extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.getFeatures = this.getFeatures.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);

        this.state = {
            queryLoading: false,
            displayBoxData: undefined,
        };
    }

    private CancelToken = axios.CancelToken;
    private source = this.CancelToken.source();
    private getFeatures() {
        const data = {
        };
        let featureResult = {

        } as featureResponse;

        const MOCK_DATA = {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [125.6, 10.1],
                }
            }],
            properties: {
                layerId: 2,
                layerName: "States",
                displayFieldName: "state_name",
                value: "South Dakota"
            }
        };

        const csrfmiddlewaretoken = getCookie('csrftoken');
        // return axios({
        //     url: `/api/estimate`,
        //     method: 'get',
        //     params: data,
        //     headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        //     cancelToken: this.source.token,
        // }).then((response) => {
        return Promise.resolve().then(response => {
            featureResult = {
                // Is it a safe assumption that we're only dealing with a single feature/point
                lat: MOCK_DATA.features[0].geometry.coordinates[1],
                long: MOCK_DATA.features[0].geometry.coordinates[0],
                layerId: MOCK_DATA.properties.layerId,
                layerName: MOCK_DATA.properties.layerName,
                displayFieldName: MOCK_DATA.properties.displayFieldName,
                value: MOCK_DATA.properties.value,
            } as featureResponse;
            return featureResult;
        }).catch(() => {
            featureResult = {
                lat: undefined,
                long: undefined,
                layerId: -1,
                layerName: undefined,
                displayFieldName: undefined,
                value: undefined,
            } as featureResponse;
            return featureResult;
        });
    }

    private handleMapClick() {
        this.getFeatures().then(featureResponseData => {
            this.setState({displayBoxData: featureResponseData});
        })
    }

    render() {
        const { displayBoxData } = this.state;
        if (!!displayBoxData || true) {
            return (
                <DisplayDataBox
                    {...displayBoxData}
                />
            );
        }
        return (<div/>)
    }
}
