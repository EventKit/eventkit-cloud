import * as React from "react";
import {
    createStyles,
    Table, TableCell, TableRow, TableBody,
    Theme,
    withStyles, Paper, Divider
} from "@material-ui/core";
import {Card, CardContent, Typography} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";
import CustomScrollbar from "../CustomScrollbar";

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    card: {
        color: theme.eventkit.colors.white,
        padding: '5px 10px',
        zIndex: 2,
        position: 'relative',
        display: 'block',
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
    }
});


export interface Props {
    lat?: number;
    long?: number;
    featureData?: any;
    errorMessage?: string;
    closeCard: boolean;
    handleClose: (event: any) => void;
    classes: { [className: string]: string };
}

export class QueryDataBox extends React.Component<Props, {}> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        const { lat, long, closeCard, handleClose, classes } = this.props;
        const keyAlign = "left";
        const valueAlign = "right";

        const waitingForData = (!this.props.featureData && !this.props.errorMessage);

        if (closeCard) {
            return (<div/>);
        }
        // Format the lat long string now.
        const latLong = (lat !== null && lat !== undefined && long !== null && long !== undefined) ?
            `${parseFloat(lat.toFixed(6))}, ${parseFloat(long.toFixed(6))}`
            : '---, ---';

        if (!!this.props.errorMessage || !this.props.featureData) {
            return (
                <Card className={classes.card}>
                    <Typography className={classes.title}>Query Result:</Typography>
                    <Divider/>
                    <IconButton
                        className={classes.closeButton}
                        type='button'
                        onClick={(e) => {
                            handleClose(e);
                        }}
                    >
                        <CloseIcon className={classes.closeIcon}/>
                    </IconButton>
                    <CustomScrollbar
                        autoHeight
                        autoHeightMax={100}
                    >
                        {(waitingForData) ?
                            (<div>
                                <strong className={classes.details}>Fetching data, please wait.</strong>
                                <CircularProgress size={15} style={{ margin: '3px' }}/>
                            </div>) :
                            ( // Error message found and we're not waiting for data
                                <div>
                                    <strong className={classes.details}>{this.props.errorMessage}</strong>
                                    <Table padding="dense">
                                        <TableBody>
                                            <TableRow className={classes.tableRow}>
                                                <TableCell align={keyAlign} className={classes.tableCell}>
                                                    <Typography className={classes.details}>Lat, Long:</Typography>
                                                </TableCell>
                                                <TableCell align={valueAlign} className={classes.tableCell}>
                                                    <Typography className={classes.details}>{latLong}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            )
                        }
                    </CustomScrollbar>
                </Card>
            )
        }
        return (
            <Card className={classes.card}>
                <Typography className={classes.title}>Query Result:</Typography>
                <Divider/>
                <IconButton
                    className={classes.closeButton}
                    type='button'
                    onClick={(e) => {
                        handleClose(e);
                    }}
                >
                    <CloseIcon className={classes.closeIcon}/>
                </IconButton>
                <CustomScrollbar
                    autoHeight
                    autoHeightMin={75}
                    autoHeightMax={125}
                >
                    <Table padding="dense">
                        <TableBody>
                            <TableRow className={classes.tableRow}>
                                <TableCell align={keyAlign} className={classes.tableCell}>
                                    <Typography className={classes.details}>Lat, Long:</Typography>
                                </TableCell>
                                <TableCell align={valueAlign} className={classes.tableCell}>
                                    <Typography className={classes.details}>{latLong}</Typography>
                                </TableCell>
                            </TableRow>
                            {Object.entries(this.props.featureData).map(([key, value], ix) => (
                                <TableRow className={classes.tableRow} key={"row" + ix}>
                                    <TableCell align={keyAlign} className={classes.tableCell}>
                                        <Typography key={"key" + ix} className={classes.details}>
                                            {key}:
                                        </Typography>
                                    </TableCell>
                                    <TableCell align={valueAlign} className={classes.tableCell}>
                                        <Typography key={"value" + ix} className={classes.details}>
                                            {value}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CustomScrollbar>
            </Card>
        );
    }
}

export default withStyles<any, any>(jss)(QueryDataBox);
