import * as React from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import Help from '@material-ui/icons/Help';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
import {Route} from 'react-router';
import EstimateContainer from "./EstimateContainer";

export interface Props {
    children: any;
    history: any;
    routes: Route[];
    theme: Eventkit.Theme & Theme;
    geojson: GeoJSON.FeatureCollection;
    exportInfo: Eventkit.Store.ExportInfo;
    providers: Eventkit.Provider[];
    updateExportInfo: (args: any) => void;
}

export interface MapLayer {
    mapUrl: string;
    metadata?: {
        type: string;
        url: string;
    };
    slug: string;
    copyright?: string;
}

export interface State {
    walkthroughClicked: boolean;
}

export class CreateExport extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleWalkthroughReset = this.handleWalkthroughReset.bind(this);
        this.handleWalkthroughClick = this.handleWalkthroughClick.bind(this);
        this.state = {
            walkthroughClicked: false,
        };
    }

    private handleWalkthroughReset() {
        this.setState({walkthroughClicked: false});
    }

    private handleWalkthroughClick() {
        this.setState({walkthroughClicked: true});
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
            <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
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
                        geojson: this.props.geojson,
                    }}
                />
                <div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default withTheme(CreateExport);
