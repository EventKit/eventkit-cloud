import * as PropTypes from 'prop-types';
import * as React from 'react';
import CustomTableRow from '../common/CustomTableRow';
import { getSqKmString } from '../../utils/generic';
import {MapView} from "../common/MapView";
import {MapLayer} from "../CreateDataPack/CreateExport";

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
        const selectedBasemap = { mapUrl: this.context.config.BASEMAP_URL } as MapLayer;

        return (
            <div>
                <CustomTableRow
                    className="qa-DataPackAoiInfo-area"
                    title="Area"
                    dataStyle={{ wordBreak: 'break-all' }}
                >
                    {getSqKmString(this.props.extent)}
                </CustomTableRow>
                <div className="qa-DataPackAoiInfo-div-map" style={{marginTop: '10px'}}>
                    <MapView
                        id={"summaryMap"}
                        selectedBaseMap={selectedBasemap}
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
