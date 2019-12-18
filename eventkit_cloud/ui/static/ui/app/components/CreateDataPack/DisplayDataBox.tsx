import * as React from "react";
import {Props} from "./ExportAOI";

export interface Props {
    lat: number;
    long: number;
    layerId: number;
    layerName: string;
    displayFieldName: string;
    value: string;
}

export class DisplayDataBox extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }
    render() {
        const { lat, long, layerId, layerName, displayFieldName, value } = this.props;
        return (
            <div className="qa-DisplayDataBox">
                <div className="lat">
                    {lat}
                </div>
                <div className="long">
                    {long}
                </div>
                <div className="layer-name">
                    {layerName}
                </div>
                <div className="display-field-name">
                    {displayFieldName}
                </div>
                <div className="value">
                    {value}
                </div>
            </div>
        );
    }
}
