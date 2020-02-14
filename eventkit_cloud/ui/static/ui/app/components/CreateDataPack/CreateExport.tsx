import * as React from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import Help from '@material-ui/icons/Help';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
import BreadcrumbStepper from './BreadcrumbStepper';
import {Route} from 'react-router';
import MapDrawer from "./MapDrawer";
import EstimateContainer from "./EstimateContainer";

export interface Props {
    children: any;
    history: any;
    routes: Route[];
    theme: Eventkit.Theme & Theme;
    geojson: GeoJSON.FeatureCollection;
}

export interface SelectedBaseMap {
    baseMapUrl: string;
    slug?: string;
}

export interface State {
    walkthroughClicked: boolean;
    selectedBaseMap: SelectedBaseMap;
}

export class CreateExport extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleWalkthroughReset = this.handleWalkthroughReset.bind(this);
        this.handleWalkthroughClick = this.handleWalkthroughClick.bind(this);
        this.updateBaseMap = this.updateBaseMap.bind(this);
        this.state = {
            walkthroughClicked: false,
            selectedBaseMap: {baseMapUrl: ''},
        };
    }

    private handleWalkthroughReset() {
        this.setState({walkthroughClicked: false});
    }

    private handleWalkthroughClick() {
        this.setState({walkthroughClicked: true});
    }

    private updateBaseMap(baseMapUrl: string, slug?: string) {
        this.setState({selectedBaseMap: {baseMapUrl, slug}});
    }

    render() {
        const {colors} = this.props.theme.eventkit;

        const styles = {
            tourButton: {
                color: colors.primary,
                cursor: 'pointer',
                display: 'inline-block',
            },
            tourIcon: {
                cursor: 'pointer',
                height: '18px',
                width: '18px',
                verticalAlign: 'middle',
                marginRight: '5px',
            },
        };

        const iconElementRight = (
            <ButtonBase
                onClick={this.handleWalkthroughClick}
                style={styles.tourButton}
            >
                <Help
                    style={styles.tourIcon}
                />
                Page Tour
            </ButtonBase>
        );

        return (
            <div>
                <PageHeader
                    title="Create DataPack"
                >
                    {iconElementRight}
                </PageHeader>
                <EstimateContainer
                    breadcrumbStepperProps={{
                        history: this.props.history,
                        routes: this.props.routes,
                        walkthroughClicked: this.state.walkthroughClicked,
                        onWalkthroughReset: this.handleWalkthroughReset,
                        selectedBaseMap: this.state.selectedBaseMap,
                        geojson: this.props.geojson,
                    }}
                />
                <MapDrawer
                    updateBaseMap={this.updateBaseMap}
                />
                <div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default withTheme()(CreateExport);
