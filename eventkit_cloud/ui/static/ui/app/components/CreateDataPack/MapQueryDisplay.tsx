import * as React from "react";
import {BaseMapSource, MapDrawer} from "./MapDrawer";
import axios from "axios";
import {getCookie} from "../../utils/generic";
import DisplayDataBox from "./DisplayDataBox";

interface FeatureResponse {
    lat: number;
    long: number;
    layerId: number;
    layerName: string;
    displayFieldName: string;
    value: string;
    closeCard: boolean;
    handleClose: (event: any) => void;
}

export interface Props {
    baseMapUrl: string;
}

export interface State {
    queryLoading: boolean;
    displayBoxData: FeatureResponse;
    closeCard: boolean;
}

export class MapQueryDisplay extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.getFeatures = this.getFeatures.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);

        this.state = {
            queryLoading: false,
            displayBoxData: undefined,
            closeCard: false,
        };
    }

    private CancelToken = axios.CancelToken;
    private source = this.CancelToken.source();
    private getFeatures() {
        const data = {
        };
        let featureResult = {

        } as FeatureResponse;

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
        return axios({
            url: `http://cloud.eventkit.test/map/usa-sample/service?FORMAT=application%2Fjson&InfoFormat=application%2Fjson&LAYER=usa-sample&REQUEST=GetFeatureInfo&SERVICE=WMTS&STYLE=default&TILECOL=28&TILEMATRIX=06&TILEMATRIXSET=default&TILEROW=16&VERSION=1.0.0&i=120&j=120`,
            method: 'get',
            params: data,
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: this.source.token,
        }).then((response) => {
            featureResult = {
                // Is it a safe assumption that we're only dealing with a single feature/point
                lat: response['features'][0].geometry.coordinates[1],
                long: response['features'][0].geometry.coordinates[0],
                layerId: response['properties'].layerId,
                layerName: response['properties'].layerName,
                displayFieldName: response['properties'].displayFieldName,
                value: response['properties'].value,
            } as FeatureResponse;
            return featureResult;
        }).catch(() => {
            featureResult = {
                lat: undefined,
                long: undefined,
                layerId: -1,
                layerName: undefined,
                displayFieldName: undefined,
                value: undefined,
            } as FeatureResponse;
            return featureResult;
        });
    }

    private handleMapClick(z, y, x, i, j) {
        if (!!this.props.baseMapUrl) {
            this.getFeatures().then(featureResponseData => {
                this.setState({closeCard: false});
                this.setState({ displayBoxData: featureResponseData });
            });
        }
    }

    handleClose = (event) => {
        event.preventDefault();
        this.setState({closeCard: true});
    };

    render() {
        const { displayBoxData } = this.state;
        if (!!displayBoxData || true) {
            return (
                <DisplayDataBox
                    {...displayBoxData}
                    closeCard={ this.state.closeCard }
                    handleClose={ this.handleClose }
                />
            );
        }
        return (<div/>);
    }
}
