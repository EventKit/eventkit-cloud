import * as React from "react";
import {BaseMapSource, MapDrawer} from "./MapDrawer";
import axios from "axios";
import {getCookie, getFeatureUrl} from "../../utils/generic";
import DisplayDataBox from "./DisplayDataBox";
import {SelectedBaseMap} from "./CreateExport";

// The feature response data for a given coordinate specified by lat and long
interface FeatureResponse {
    lat: number;
    long: number;
    featureData: any;
}

export interface TileCoordinate {
    z: number;
    y: number;
    x: number;
    lat: number;
    long: number;
}

export interface Props {
    selectedBaseMap: SelectedBaseMap;
}

export interface State {
    queryLoading: boolean;
    responseData: FeatureResponse;
    closeCard: boolean;
}

export class MapQueryDisplay extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.getFeatures = this.getFeatures.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);

        this.state = {
            queryLoading: false,
            responseData: undefined,
            closeCard: false,
        };
    }

    private CancelToken = axios.CancelToken;
    private source = this.CancelToken.source();
    private getFeatures(tileCoord: TileCoordinate, i, j) {
        let responseData;

        const url = getFeatureUrl(this.props.selectedBaseMap.slug, tileCoord.z, tileCoord.y, tileCoord.x, i, j);
        const csrfmiddlewaretoken = getCookie('csrftoken');
        return axios({
            url,
            method: 'get',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: this.source.token,
        }).then((response) => {
            const feature = response.data['features'][0];
            responseData = {
                lat: tileCoord.lat,
                long: tileCoord.long,
                featureData: {
                    ...feature['properties'],
                }
            } as FeatureResponse;
            return responseData;
        }).catch(() => {
            this.setState({closeCard: true});
            responseData = {
                lat: tileCoord.lat,
                long: tileCoord.long,
                featureData: undefined,
            } as FeatureResponse;
            return responseData;
        });
    }

    private handleMapClick(tileCoord: TileCoordinate, i, j) {
        if (!!this.props.selectedBaseMap.slug) {
            this.getFeatures(tileCoord, i, j).then(featureResponseData => {
                this.setState({closeCard: false});
                this.setState({ responseData: featureResponseData });
            });
        }
    }

    handleClose = (event) => {
        event.preventDefault();
        this.setState({closeCard: true});
    };

    render() {
        const { responseData } = this.state;
        if (!!responseData) {
            return (
                <DisplayDataBox
                    lat={responseData.lat}
                    long={responseData.long}
                    featureData={responseData.featureData}
                    closeCard={ this.state.closeCard }
                    handleClose={ this.handleClose }
                />
            );
        }
        return (<div/>);
    }
}
