import * as PropTypes from 'prop-types';
import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import {MapView} from "./MapView";
import {MapLayer} from "../CreateDataPack/CreateExport";

export interface Props {
    children: any;
    geojson: object;
    theme: Eventkit.Theme & Theme;
    setZoom?: (min: number, max: number) => void;
    provider?: Eventkit.Provider;
    zoom?: number;
}

export interface State {
    open: boolean;
}

export class MapCard extends React.Component<Props, State> {

    readonly mapDiv: string;
    readonly minZoom: number;
    readonly maxZoom: number;

    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props) {
        super(props);
        this.handleExpand = this.handleExpand.bind(this);
        this.state = {
            open: false,
        };
    }

    private handleExpand() {
        this.setState(state => ({ open: !state.open }));
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const selectedBasemap = { mapUrl: this.context.config.BASEMAP_URL } as MapLayer;

        return (
            <Card
                id="Map"
                className="qa-MapCard-Card-map"
            >
                <CardActions
                    className="qa-MapCard-CardHeader-map"
                    style={{
                        padding: '12px 10px 10px',
                        backgroundColor: colors.secondary,
                        fontWeight: 'bold',
                        fontSize: '16px',
                    }}
                >
                    <div style={{ flex: '1 1 auto' }}>
                        {this.props.children}
                    </div>
                    {this.state.open ?
                        <ExpandLess onClick={this.handleExpand} color="primary" />
                        :
                        <ExpandMore onClick={this.handleExpand} color="primary" />
                    }
                </CardActions>
                <Collapse in={this.state.open}>
                    <CardContent
                        className="qa-MapCard-CardText-map"
                        style={{padding: '5px', backgroundColor: colors.secondary}}
                    >
                        { this.props.provider ?
                            <MapView
                                id={this.props.provider.id + "-map"}
                                selectedBaseMap={selectedBasemap}
                                copyright={this.props.provider.service_copyright ? this.props.provider.service_copyright : this.context.config.BASEMAP_COPYRIGHT}
                                geojson={this.props.geojson}
                                setZoom={this.props.setZoom}
                                zoom={this.props.zoom}
                                minZoom={this.props.provider.level_from}
                                maxZoom={this.props.provider.level_to}
                            />
                            :
                            <MapView
                                selectedBaseMap={selectedBasemap}
                                copyright={this.context.config.BASEMAP_COPYRIGHT}
                                geojson={this.props.geojson}
                                setZoom={this.props.setZoom}
                                zoom={this.props.zoom}
                            />
                        }
                    </CardContent>
                </Collapse>
            </Card>
        );
    }
}

export default withTheme(MapCard);
