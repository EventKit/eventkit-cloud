import * as PropTypes from 'prop-types';
import * as React from 'react';
import CustomTableRow from '../CustomTableRow';
import { getSqKmString } from '../../utils/generic';
import {MapView} from "../common/MapView";
import {SelectedBaseMap} from "../CreateDataPack/CreateExport";

export interface Props {
    extent: object;
}

export class DataPackAoiInfo extends React.Component<Props, {}> {
    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props) {
        super(props);
    }

    render() {
        const selectedBasemap = { baseMapUrl: this.context.config.BASEMAP_URL } as SelectedBaseMap;

        return (
            <div>
                <CustomTableRow
                    className="qa-DataPackAoiInfo-area"
                    title="Area"
                    data={getSqKmString(this.props.extent)}
                    dataStyle={{ wordBreak: 'break-all' }}
                />
                <div className="qa-DataPackAoiInfo-div-map" style={{maxHeight: '400px', marginTop: '10px'}}>
                    <MapView
                        id={"summaryMap"}
                        selectedBaseMap={selectedBasemap}
                        copyright={this.context.config.BASEMAP_COPYRIGHT}
                        geojson={this.props.extent}
                        minZoom={2}
                        maxZoom={20}
                    />
                </div>
            </div>
        );
    }
}

export default DataPackAoiInfo;
