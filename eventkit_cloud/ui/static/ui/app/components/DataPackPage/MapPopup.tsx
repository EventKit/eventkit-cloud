import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';
import Card from '@material-ui/core/Card';
import ArrowDown from '@material-ui/icons/KeyboardArrowDown';
import ArrowUp from '@material-ui/icons/KeyboardArrowUp';
import Dot from '@material-ui/icons/FiberManualRecord';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ActionZoomInIcon from '@material-ui/icons/ZoomIn';
import * as moment from 'moment';

export interface Props {
    featureInfo: Eventkit.Run & {
        name: string;
    };
    detailUrl: string;
    handleZoom: () => void;
    handlePopupClose: () => void;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    showMore: boolean;
}

export class MapPopup extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.showMore = this.showMore.bind(this);
        this.state = {
            showMore: false,
        };
    }

    private showMore() {
        this.setState({ showMore: !this.state.showMore });
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            popupHeader: {
                width: '100%',
                height: '100%',
                padding: '10px 10px 5px',
                color: colors.primary,
            },
            popupNameContainer: {
                display: 'inline-block',
                verticalAlign: 'middle' as 'middle',
                height: '22px',
                width: 'calc(100% - 20px)',
            },
            popupName: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as 'nowrap',
                fontSize: '18px',
            },
            closeButtonContainer: {
                display: 'inline-block',
                verticalAlign: 'middle' as 'middle',
                height: '22px',
                float: 'right' as 'right',
            },
            closeButton: {
                height: '20px',
                width: '20px',
                fill: colors.primary,
                cursor: 'pointer',
            },
            buttonLabel: {
                display: 'inline-block',
                height: '20px',
                verticalAlign: 'middle' as 'middle',
                lineHeight: '19px',
            },
            buttonIcon: {
                fill: colors.primary,
                height: '20px',
                width: '20px',
                verticalAlign: 'middle' as 'middle',
                marginRight: '6px',
            },
            buttonStyle: {
                height: '25px',
                fontSize: '12px',
                color: colors.primary,
                lineHeight: '25px',
            },
            event: {
                width: '100%',
                height: '100%',
                padding: '5px 10px',
                color: colors.grey,
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as 'nowrap',
            },
            actions: {
                width: '100%',
                padding: '5px 10px 0',
                color: colors.grey,
                display: 'flex',
                flexWrap: 'wrap' as 'wrap',
            },
            actionButton: {
                display: 'inline-block',
                color: colors.primary,
                whiteSpace: 'nowrap' as 'nowrap',
                marginBottom: '10px',
                cursor: 'pointer',
            },
            showMoreIcon: {
                width: '18px',
                height: '18px',
                color: colors.primary,
                verticalAlign: 'bottom' as 'bottom',
            },
            dot: {
                color: colors.warning,
                backgroundColor: colors.white,
                border: `1px solid ${colors.primary}`,
                borderRadius: '100%',
                height: '14px',
                width: '14px',
                verticalAlign: 'middle',
                marginRight: '5px',
            },
            moreInfo: {
                width: '100%',
                height: '100%',
                padding: '0 10px 5px',
                color: colors.grey,
            },
        };

        return (
            <Card className="qa-MapPopup-Card" style={{ padding: '10px', zIndex: 10 }}>
                <div id="popup-header" style={styles.popupHeader}>
                    <div className="qa-MapPopup-div-name" id="popup-name-container" style={styles.popupNameContainer}>
                        <div id="popup-name" style={styles.popupName}>
                            <a href={`/status/${this.props.featureInfo.job.uid}`} style={{ color: colors.primary }}>
                                <Dot style={styles.dot} />
                                <strong>{this.props.featureInfo.name}</strong>
                            </a>
                        </div>
                    </div>
                    <div className="qa-MapPopup-close" id="close-button-container" style={styles.closeButtonContainer}>
                        <Clear
                            className="qa-MapPopup-Clear"
                            style={styles.closeButton}
                            onClick={this.props.handlePopupClose}
                        />
                    </div>
                </div>
                <div className="qa-MapPopup-event" id="popup-event" style={styles.event}>
                    Event: {this.props.featureInfo.job.event}
                </div>
                <div id="popup-actions" style={styles.actions}>
                    <div
                        className="qa-MapPopup-div-detailsUrl"
                    >
                        <a
                            id="details-url"
                            href={this.props.detailUrl}
                            style={{
                                ...styles.actionButton,
                                marginRight: '15px',
                            }}
                        >
                            <OpenInNewIcon style={styles.buttonIcon} />
                            <span style={{ verticalAlign: 'middle' }}>
                                Status & Download
                            </span>
                        </a>
                    </div>
                    <div
                        className="qa-MapPopup-div-zoomTo"
                        style={{ flex: '1' }}
                    >
                        <span
                            id="zoom-to"
                            role="button"
                            tabIndex={0}
                            onKeyPress={this.props.handleZoom}
                            onClick={this.props.handleZoom}
                            style={{
                                ...styles.actionButton,
                                marginRight: '15px',
                                textDecoration: 'none',
                            }}
                        >
                            <ActionZoomInIcon style={{ ...styles.buttonIcon, marginRight: '4px' }} />
                            <span style={{ verticalAlign: 'middle' }}>
                                Zoom To
                            </span>
                        </span>
                    </div>
                    <div className="qa-MapPopup-div-showMore">
                        <div
                            id="show-more"
                            role="button"
                            tabIndex={0}
                            onKeyPress={this.showMore}
                            onClick={this.showMore}
                            style={{
                                ...styles.actionButton,
                                textDecoration: 'none',
                            }}
                        >
                            {this.state.showMore ?
                                <span style={{ verticalAlign: 'middle' }}>Show Less</span> :
                                <span style={{ verticalAlign: 'middle' }}>Show More</span>
                            }
                            {this.state.showMore ? <ArrowUp style={styles.showMoreIcon} /> : <ArrowDown style={styles.showMoreIcon} />}
                        </div>
                    </div>
                </div>

                {this.state.showMore ?
                    <div className="qa-MapPopup-div-moreInfo" id="moreInfo" style={styles.moreInfo}>
                        {this.props.featureInfo.job.description ?
                            <div style={{ margin: '5px 0px' }}>Description: {this.props.featureInfo.job.description}</div>
                            : null
                        }
                        {this.props.featureInfo.created_at ?
                            <div style={{ margin: '5px 0px' }}>
                                Created: {moment(this.props.featureInfo.created_at).format('M/D/YY')}
                            </div>
                            : null}
                        {this.props.featureInfo.expiration ?
                            <div style={{ margin: '5px 0px' }}>
                                Expires: {moment(this.props.featureInfo.expiration).format('M/D/YY')}
                            </div>
                            : null}
                        {this.props.featureInfo.user ?
                            <div style={{ margin: '5px 0px' }}>Owner: {this.props.featureInfo.user}</div>
                            : null}
                    </div>
                    : null}
            </Card>
        );
    }
}

export default withTheme()(MapPopup);
