import * as React from "react";
import {
    createStyles,
    Grid,
    Theme,
    withStyles
} from "@material-ui/core";
import { Card, CardContent, Typography } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    cardDetails: {
        minWidth: 255,
        color: theme.eventkit.colors.white,
        padding: '12px'
    },
    title: {
        fontSize: 15,
        color: theme.eventkit.colors.black,
        marginBottom: '4px',
        display: 'inline'
    },
    details: {
        fontSize: 13,
        color: theme.eventkit.colors.grey,
        display: 'inline-block',
        // dispaly: 'inline-table',
        paddingRight: '5px',
        padding: 0
    },
    grid: {
        paddingTop: '5px'
    },
    closeButton: {
        fontSize: 'medium',
        float: 'right',
        marginBottom: '4px',
    },
    closeIcon: {
        fontSize: 'small',
    }
});

// error handling?

export interface Props {
    lat: number;
    long: number;
    featureData: any;
    closeCard: boolean;
    handleClose: (event: any) => void;
    classes: {
        cardDetails: string;
        title: string;
        details: string;
        grid: string;
        closeButton: string;
        closeIcon: string;
    };
}

export class DisplayDataBox extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        const { lat, long, closeCard, handleClose, classes } = this.props;
        const latLong = (lat !== null && lat !== undefined && long !== null && long !== undefined) ? `${lat}, ${long}` : '---, ---';
        if (!this.props.featureData) {
            return (<div/>);
        }
        const featureKeys = Object.keys(this.props.featureData);
        const featureValues = Object.values(this.props.featureData);

        return (
            <div className={classes.cardDetails} >
                { !closeCard ?
                    <Card>
                        <CardContent>
                            <Typography className={classes.title}>Query Result:</Typography>
                            <IconButton
                                className={classes.closeButton}
                                type='button'
                                onClick={(e) => {
                                    handleClose(e);
                                }}
                            >
                                <CloseIcon className={classes.closeIcon}/>
                            </IconButton>
                            <Grid className={classes.grid}>
                                <Grid item xs={3} className={classes.details}>
                                    <Typography className={classes.details}>Lat, Long:</Typography>
                                    {featureKeys.map((key, ix) => (
                                        <Typography key={"key" + ix} className={classes.details}>{key}:</Typography>
                                    ))}
                                </Grid>
                                <Grid item xs={9} className={classes.details}>
                                    <Typography className={classes.details}><strong>{latLong}</strong></Typography>
                                    {featureValues.map((value, ix) => (
                                        <Typography key={"value" + ix} className={classes.details}>{value}</Typography>
                                    ))}
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                    :
                    null
                }
            </div>
        );
    }
}
export default withStyles<any, any>(jss)(DisplayDataBox);
