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
}

export interface State {
    queryLoading: boolean;
    displayBoxData: FeatureResponse;
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

        } as FeatureResponse;

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
                lat: 1337,
                long: 7331,
                layerId: 2,
                layerName: 'States',
                displayFieldName: 'state_name',
                value: 'South Dakota',
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

    private handleMapClick() {
        this.getFeatures().then(featureResponseData => {
            this.setState({displayBoxData: featureResponseData});
        });
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
        return (<div/>);
    }
}
