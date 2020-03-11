import * as React from "react";
import axios from "axios";
import {getCookie, getFeatureUrl} from "../../utils/generic";
import QueryDataBox from "./QueryDataBox";
import {MapLayer} from "./CreateExport";

// The feature response data for a given coordinate specified by lat and long
interface FeatureResponse {
    lat: number;
    long: number;
    featureData: any;
    errorMessage?: string;
}

export interface TileCoordinate {
    z: number;  // Tile Zoom level
    y: number;  // Tile row
    x: number;  // Tile col
    lat: number;
    long: number;
    i?: number;  // Click pixel x
    j?: number;  // Click pixel y
}

export interface Props {
    selectedLayer: MapLayer;
    style?: any;
    maxHeight?: number;
    name?: string;
    setVisibility?: (state: boolean) => void;
}

export interface State {
    queryLoading: boolean;
    responseData: FeatureResponse;
    lastCoordinate?: TileCoordinate;
    closeCard: boolean;
}

export class MapQueryDisplay extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.getFeatures = this.getFeatures.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.isQueryBoxVisible = this.isQueryBoxVisible.bind(this);
        this.setVisibility = this.setVisibility.bind(this);

        this.state = {
            queryLoading: false,
            responseData: undefined,
            closeCard: true,
        };
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        const { selectedLayer } = this.props;
        const { closeCard, lastCoordinate} = this.state;
        const prevSelectedLayer = prevProps.selectedLayer;

        if (prevSelectedLayer !== selectedLayer && !closeCard && lastCoordinate) {
            this.handleMapClick(this.state.lastCoordinate);
        }
    }

    isQueryBoxVisible() {
        return this.state.queryLoading || !!this.state.responseData;
    }

    private CancelToken = axios.CancelToken;
    private source = this.CancelToken.source();
    async getFeatures(tileCoord: TileCoordinate) {
        this.setState({lastCoordinate: tileCoord});
        let responseData = {
            lat: tileCoord.lat,
            long: tileCoord.long,
        } as FeatureResponse;
        let url;
        try {
            url = getFeatureUrl(this.props.selectedLayer, tileCoord.z, tileCoord.y, tileCoord.x, tileCoord.i, tileCoord.j);
        }
        catch(error) {
            responseData.errorMessage = 'No data found at coordinates.';
            return responseData;
        }

        const csrfmiddlewaretoken = getCookie('csrftoken');
        return axios({
            url,
            method: 'get',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: this.source.token,
        }).then((response) => {
            setTimeout(() => {}, 2000);
            if (Object.entries(response.data).length === 0) {
                responseData.errorMessage = 'No data found at coordinates.';
                return responseData;
            }
            const feature = response.data['features'][0];
            responseData['featureData'] = { ...feature['properties']};
            return responseData;
        }).catch((error) => {
            responseData.errorMessage = error.response.data;
            return responseData;
        });
    }

    private setVisibility(visibility: boolean) {
        if (!this.props.setVisibility) {
            return;
        }
        this.props.setVisibility(visibility);
    }

    private handleMapClick(tileCoord: TileCoordinate) {
        if (!!this.props.selectedLayer && !!this.props.selectedLayer.mapUrl) {
            this.setState({
                closeCard: false,
                responseData: undefined,
                queryLoading: true,
            });
            this.setVisibility(true);
            this.getFeatures(tileCoord).then(featureResponseData => {
                this.setState({
                    responseData: featureResponseData,
                    queryLoading: false,
                });
            });
            return true;
        }
        return false;
    }

    handleClose = (event) => {
        event.preventDefault();
        this.setVisibility(false);
        this.setState({closeCard: true});
    };

    render() {
        const { responseData } = this.state;
        return (
            <QueryDataBox
                {...(responseData) ? responseData : {}}
                maxHeight={this.props.maxHeight}
                style={this.props.style}
                closeCard={ this.state.closeCard }
                handleClose={ this.handleClose }
            />
        );
    }
}

export default MapQueryDisplay;