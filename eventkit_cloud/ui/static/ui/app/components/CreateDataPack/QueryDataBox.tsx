import { Component } from "react";
import {
    createStyles,
    Table, TableCell, TableRow, TableBody,
    Theme,
    withStyles, Divider, PropTypes
} from "@material-ui/core";
import {Typography} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import CustomScrollbar from "../common/CustomScrollbar";
import Alignment = PropTypes.Alignment;

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    card: {
        background: theme.eventkit.colors.white,
        padding: '5px 10px',
        zIndex: 2,
        position: 'relative',
        display: 'grid',
    },
    title: {
        fontSize: 15,
        color: theme.eventkit.colors.black,
        marginBottom: '10px',
        display: 'inline'
    },
    closeButton: {
        position: 'absolute',
        top: '7px',
        right: '7px',
    },
    closeIcon: {
        fontSize: 'medium',
    },
    tableRow: {
        height: 'auto',
        '& td:last-child': {
            paddingRight: '10px'
        },
    },
    tableCell: {
        padding: '0px',
        marginBottom: '5px',
        border: '0px',
    },
    details: {
        fontSize: 13,
        color: theme.eventkit.colors.grey,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        paddingRight: '5px',
    },
    wrapper: {
        zIndex: 2,
        position: 'absolute',
        width: '100%',
        bottom: '40px',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        [theme.breakpoints.only('xs')]: {
            justifyContent: 'start',
        },
    },
});


export interface Props {
    lat?: number;
    long?: number;
    featureData?: any;
    errorMessage?: string;
    closeCard: boolean;
    handleClose: (event: any) => void;
    maxHeight?: number;
    style: any;
    classes: { [className: string]: string };
}

export class QueryDataBox extends Component<Props, {}> {

    private keyAlign : Alignment = "left";
    private valueAlign : Alignment = "right";

    static defaultProps = {
        maxHeight: 125,
        style: {},
    };

    constructor(props: Props) {
        super(props);
    }

    getErrorBox(latLong) {
        const { classes } = this.props;
        const waitingForData = (!this.props.featureData && !this.props.errorMessage);

        if (waitingForData) {
            return (
                <div style={{height: 'calc(100vh)'}}>
                    <strong className={classes.details}>Fetching data, please wait.</strong>
                    <CircularProgress size={15} style={{ margin: '15px', marginLeft: '5px' }}/>
                </div>
            );
        } else {
            return ( // Error message found and we're not waiting for data
                <div style={{height: 'calc(100vh)'}}>
                    <strong className={classes.details}>{this.props.errorMessage}</strong>
                    <Table size="small">
                        <TableBody>
                            <TableRow className={classes.tableRow}>
                                <TableCell align={this.keyAlign} className={classes.tableCell}>
                                    <Typography className={classes.details}>Lat, Long:</Typography>
                                </TableCell>
                                <TableCell align={this.valueAlign} className={classes.tableCell}>
                                    <Typography className={classes.details}>{latLong}</Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            );
        }
    }

    getDataDisplay(latLong) {
        const { classes } = this.props;

        return (
            <Table size="small">
                <TableBody>
                    <TableRow className={classes.tableRow}>
                        <TableCell align={this.keyAlign} className={classes.tableCell}>
                            <Typography className={classes.details}>Lat, Long:</Typography>
                        </TableCell>
                        <TableCell align={this.valueAlign} className={classes.tableCell}>
                            <Typography className={classes.details}>{latLong}</Typography>
                        </TableCell>
                    </TableRow>
                    {Object.entries(this.props.featureData).map(([key, value], ix) => (
                        <TableRow className={classes.tableRow} key={"row" + ix}>
                            <TableCell align={this.keyAlign} className={classes.tableCell}>
                                <Typography key={"key" + ix} className={classes.details}>
                                    {key}:
                                </Typography>
                            </TableCell>
                            <TableCell align={this.valueAlign} className={classes.tableCell}>
                                <Typography key={"value" + ix} className={classes.details}>
                                    {value as string}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
        </Table>)
    }

    render() {
        const { lat, long, closeCard, handleClose, classes } = this.props;
        if (closeCard) {
            return (<div className="queryBoxClosed"/>);
        }
        // Format the lat long string now.
        const latLong = (lat !== null && lat !== undefined && long !== null && long !== undefined) ?
            `${parseFloat(lat.toFixed(6))}, ${parseFloat(long.toFixed(6))}`
            : '---, ---';

        return (
            <div className={classes.card} style={this.props.style}>
                <Typography className={classes.title}>Point of Interest:</Typography>
                <Divider/>
                { !!this.props.handleClose &&
                    <IconButton
                        className={classes.closeButton}
                        type='button'
                        onClick={(e) => {
                            handleClose(e);
                        }}
                    >
                        <CloseIcon className={classes.closeIcon}/>
                    </IconButton>
                }
                <CustomScrollbar
                    autoHeight
                    style={{height: '100%'}}
                >
                    { (!!this.props.errorMessage || !this.props.featureData) ?
                        this.getErrorBox(latLong) :
                        this.getDataDisplay(latLong)
                    }
                </CustomScrollbar>
            </div>
        );
    }
}

export default withStyles<any, any>(jss)(QueryDataBox);
