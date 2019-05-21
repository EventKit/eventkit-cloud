import * as React from 'react';
import { withTheme, withStyles, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Button from '@material-ui/core/Button';
import Info from '@material-ui/icons/Info';
import CloudDownload from '@material-ui/icons/CloudDownload';
import ProviderRow from './ProviderRow';
import BaseDialog from '../Dialog/BaseDialog';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

const jss = (theme: Eventkit.Theme & Theme) => ({
    btn: {
        backgroundColor: theme.eventkit.colors.selected_primary,
        color: theme.eventkit.colors.primary,
        fontWeight: 'bold' as 'bold',
        '&:hover': {
            backgroundColor: theme.eventkit.colors.selected_primary_dark,
            color: theme.eventkit.colors.primary,
        },
        '&:disabled': {
            backgroundColor: theme.eventkit.colors.secondary_dark,
            color: theme.eventkit.colors.grey,
        },
    },
});

export interface Props {
    providerTasks: Eventkit.ProviderTask[];
    onProviderCancel: (uid: string) => void;
    providers: Eventkit.Provider[];
    zipFileProp: string;
    classes: { [className: string]: string };
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

export interface State {
    infoOpen: boolean;
    selectedProviders: { [slug: string]: boolean };
}

export class DataPackDetails extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleInfoOpen = this.handleInfoOpen.bind(this);
        this.handleInfoClose = this.handleInfoClose.bind(this);
        this.state = {
            infoOpen: false,
            selectedProviders: {},
        };
    }

    componentDidMount() {
        this.onMount();
    }

    private onMount() {
        const selectedProviders = {};
        this.props.providerTasks.forEach((provider) => {
            if (provider.display === true) {
                selectedProviders[provider.uid] = false;
            }
        });
        this.setState({ selectedProviders });
    }

    private getCloudDownloadIcon() {
        const { colors } = this.props.theme.eventkit;
        if (!this.props.zipFileProp) {
            return (
                <CloudDownload
                    className="qa-DataPackDetails-CloudDownload-disabled"
                    style={{ fill: colors.grey, verticalAlign: 'middle', marginRight: '5px' }}
                />
            );
        }
        return (
            <CloudDownload
                className="qa-DataPackDetails-CloudDownload-enabled"
                style={{ fill: colors.primary, verticalAlign: 'middle', marginRight: '5px' }}
            />
        );
    }

    private getTextFontSize() {
        const { width } = this.props;
        if (!isWidthUp('sm', width)) {
            return '10px';
        } else if (!isWidthUp('md', width)) {
            return '11px';
        } else if (!isWidthUp('lg', width)) {
            return '12px';
        } else if (!isWidthUp('xl', width)) {
            return '13px';
        }
        return '14px';
    }

    private getTableCellWidth() {
        if (!isWidthUp('md', this.props.width)) {
            return '80px';
        }
        return '120px';
    }

    private getToggleCellWidth() {
        return '86px';
    }

    private isZipFileCompleted() {
        if (!this.props.zipFileProp) {
            return false;
        }
        return true;
    }

    private handleInfoOpen() {
        this.setState({ infoOpen: true });
    }

    private handleInfoClose() {
        this.setState({ infoOpen: false });
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const tableCellWidth = this.getTableCellWidth();
        const toggleCellWidth = this.getToggleCellWidth();
        const textFontSize = this.getTextFontSize();

        const providers = this.props.providerTasks.filter(provider => (provider.display));

        const styles = {
            subHeading: {
                fontSize: '16px',
                fontWeight: 'bold' as 'bold',
                color: colors.black,
                alignContent: 'flex-start',
                paddingBottom: '5px',
            },
            download: {
                paddingRight: '12px',
                paddingLeft: '0px',
                fontSize: textFontSize,
                whiteSpace: 'normal' as 'normal',
            },
            genericColumn: {
                paddingRight: '0px',
                paddingLeft: '0px',
                width: tableCellWidth,
                textAlign: 'center' as 'center',
                fontSize: textFontSize,
            },
            info: {
                margin: '5px 10px 5px 5px',
                height: '18px',
                width: '18px',
                cursor: 'pointer',
                fill: colors.primary,
                verticalAlign: 'middle',
            },
        };

        const { classes } = this.props;

        return (
            <div>
                <div className="qa-DataPackDetails-heading" style={styles.subHeading}>
                   Download Options
                </div>
                <Table
                    className="qa-DataPackDetails-Table"
                    style={{ width: '100%', tableLayout: 'fixed' }}
                >
                    <TableBody
                        className="qa-DataPackDetails-TableHeader"
                    >
                        <TableRow className="qa-DataPackDetails-TableRow">
                            <TableCell
                                className="qa-DataPackDetails-TableCell-zipButton"
                                style={styles.download}
                            >
                                <Button
                                    id="CompleteDownload"
                                    href={this.props.zipFileProp}
                                    variant="contained"
                                    className="qa-DataPackDetails-Button-zipButton"
                                    classes={{ root: classes.btn }}
                                    disabled={!this.isZipFileCompleted()}
                                    style={{ fontSize: textFontSize, lineHeight: 'initial' }}
                                >
                                    {this.getCloudDownloadIcon()}
                                    {this.props.zipFileProp ? 'DOWNLOAD DATAPACK (.ZIP)' : 'CREATING DATAPACK ZIP'}

                                </Button>
                                <Info
                                    className="qa-DataPackDetails-info"
                                    onClick={this.handleInfoOpen}
                                    style={styles.info}
                                />
                                <BaseDialog
                                    className="qa-DataPackDetails-info-dialog"
                                    show={this.state.infoOpen}
                                    title="DataPack Information"
                                    onClose={this.handleInfoClose}
                                >
                                    <div style={{ paddingBottom: '10px', wordWrap: 'break-word' }}>
                                        For convenience, EventKit bundles all the individual data sources into a single download
                                         (formatted as a .zip file).
                                         Additionally, this file contains GIS application files (QGIS and ArcMap),
                                         cartographic styles, metadata, and associated documents.
                                         See the Page Tour for more details about other elements of the Status and Download page.
                                         Detailed information about how to use the DataPacks in QGIS and ArcMap are in
                                         the About EventKit page and in the metadata of the DataPack.
                                    </div>
                                </BaseDialog>
                            </TableCell>
                            <TableCell
                                className="qa-DataPackDetails-TableCell-fileSize"
                                style={styles.genericColumn}
                            >
                                FILE SIZE
                            </TableCell>
                            <TableCell
                                className="qa-DataPackDetails-TableCell-progress"
                                style={styles.genericColumn}
                            >
                                PROGRESS
                            </TableCell>
                            <TableCell
                                className="qa-DataPackDetails-TableCell-empty"
                                style={{ ...styles.genericColumn, width: toggleCellWidth }}
                            />
                        </TableRow>
                    </TableBody>
                </Table>
                <div className="qa-DataPackDetails-providers" id="Providers">
                    {providers.map((provider, ix) => (
                        <ProviderRow
                            backgroundColor={ix % 2 === 0 ? colors.secondary : colors.white}
                            key={provider.uid}
                            onProviderCancel={this.props.onProviderCancel}
                            provider={provider}
                            selectedProviders={this.state.selectedProviders}
                            providers={this.props.providers}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

export default withWidth()(withTheme()(withStyles(jss)(DataPackDetails)));
