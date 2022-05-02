import * as PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withTheme, Theme, withStyles, createStyles, StyledComponentProps } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import { Link } from 'react-router-dom';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import moment from 'moment';
import { makeFullRunSelector } from '../../selectors/runSelector';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import {MapView} from "../common/MapView";
import {MapLayer} from "../CreateDataPack/CreateExport";

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    card: {
        backgroundColor: theme.eventkit.colors.secondary,
        position: 'relative',
        height: 'auto',
    },
    content: {
        display: 'flex',
        flexWrap: 'nowrap',
        height: 'auto',
        flexDirection: 'column',
        [theme.breakpoints.up('md')]: {
            flexDirection: 'row',
        },
    },
    map: {
        flex: '67',
        boxSizing: 'border-box',
        backgroundColor: 'none',
        order: 2,
        [theme.breakpoints.up('md')]: {
            maxWidth: '67%',
            order: 1,
        },
        [theme.breakpoints.down('sm')]: {
            maxHeight: '67%',
        },
    },
    info: {
        flex: '33',
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: '12px 16px 14px',
        order: 1,
        [theme.breakpoints.up('md')]: {
            maxWidth: '33%',
            padding: '17px 24px 20px',
            order: 2,
        },
        [theme.breakpoints.down('sm')]: {
            maxHeight: '33%',
        },
    },
    cardHeader: {
        wordWrap: 'break-word',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        boxSizing: 'border-box',
        maxWidth: '100%',
        padding: '0',
    },
    cardTitle: {
        display: 'inline-block',
        width: '100%',
        color: theme.eventkit.colors.primary,
        fontSize: '22px',
    },
    titleLink: {
        color: 'inherit',
        width: '100%',
        margin: '0px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        WebkitLineClamp: 2,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        wordWrap: 'break-word',
    },
    cardSubtitle: {
        fontSize: '10px',
        fontWeight: 'normal',
        color: theme.eventkit.colors.text_primary,
        marginBottom: '16px',
        [theme.breakpoints.up('md')]: {
            fontSize: '12px',
        },
        [theme.breakpoints.down('sm')]: {
            display: 'none',
        },
    },
    cardTextContainer: {
        padding: '0px',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
    },
    cardText: {
        color: theme.eventkit.colors.black,
        wordWrap: 'break-word',
        width: '100%',
        backgroundColor: theme.eventkit.colors.secondary,
        zIndex: 2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        WebkitLineClamp: 2,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        fontSize: '14px',
        lineHeight: 'inherit',
        [theme.breakpoints.up('md')]: {
            WebkitLineClamp: 7,
        },
        [theme.breakpoints.up('lg')]: {
            WebkitLineClamp: 6,
            fontSize: '16px',
            lineHeight: '1.5',
        }
    },
});

interface OwnProps {
    className?: string;
    // RunID is not used directly by the component but it is needs for the state selector
    runId: string;
    gridName: string;
    index: number;
    height?: string;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

interface StateProps {
    run: Eventkit.Run;
}

export type Props = StyledComponentProps & OwnProps & StateProps;

export class DataPackFeaturedItem extends Component<Props, {}> {
    context: any;
    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props) {
        super(props);
        this.getMapId = this.getMapId.bind(this);
    }

    private getMapId() {
        let mapId = '';
        if (this.props.gridName !== undefined) {
            mapId += `${this.props.gridName}_`;
        }
        mapId += `${this.props.run.uid}_`;
        if (this.props.index !== undefined) {
            mapId += `${this.props.index}_`;
        }
        mapId += 'map';

        return mapId;
    }

    render() {
        const { classes } = this.props;
        const selectedBasemap = { mapUrl: this.context.config.BASEMAP_URL } as MapLayer;

        return (
            <Card
                className={classes.card}
                style={{ height: this.props.height }}
                key={this.props.run.uid}
            >
                <div className={classes.content} style={{ height: this.props.height }}>
                    <div className={classes.map}>
                        <MapView
                            id={this.getMapId()}
                            selectedBaseMap={selectedBasemap}
                            copyright={this.context.config.BASEMAP_COPYRIGHT}
                            geojson={this.props.run.job.extent}
                            minZoom={2}
                            maxZoom={20}
                        />
                    </div>
                    <div className={classes.info}>
                        <CardHeader
                            className={classes.cardHeader}
                            title={
                                <div>
                                    <div className={classes.cardTitle}>
                                        <Link
                                            to={`/status/${this.props.run.job.uid}`}
                                            className={classes.titleLink}
                                        >
                                            {this.props.run.job.name}
                                        </Link>
                                    </div>
                                </div>
                            }
                            subheader={
                                <div className={classes.cardSubtitle}>
                                    <div
                                        className="qa-DataPackFeaturedItem-Subtitle-Event"
                                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {`Event: ${this.props.run.job.event}`}
                                    </div>
                                    <span className="qa-DataPackFeaturedItem-Subtitle-Added">
                                        {`Added: ${moment(this.props.run.created_at).format('M/D/YY')}`}
                                    </span>
                                    <br />
                                    <span className="qa-DataPackFeaturedItem-Subtitle-Expires">
                                        {`Expires: ${moment(this.props.run.expiration).format('M/D/YY')}`}
                                    </span>
                                    <br />
                                </div>
                            }
                        />
                        <CardContent
                            className={classes.cardTextContainer}
                        >
                            <span className={classes.cardText}>
                                {this.props.run.job.description}
                            </span>
                        </CardContent>
                    </div>
                </div>
            </Card>
        );
    }
}

const makeMapStateToProps = () => {
    const getFullRun = makeFullRunSelector();
    const mapStateToProps = (state: {}, props: OwnProps) => (
        {
            // @ts-ignore
            run: getFullRun(state),
        }
    );
    return mapStateToProps;
};

export default withWidth()(
    withTheme(
        withStyles(jss)(
            connect(makeMapStateToProps)(DataPackFeaturedItem))));
