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
    card: {
        minWidth: 330,
        color: theme.eventkit.colors.white,
        zIndex: 2,
        position: 'absolute',
        width: '100%',
        display: 'flex',
        bottom: '40px',
        // [theme.breakpoints.only('xs')]: {
        //     justifyContent: 'start',
        // },
    },
    cardContent: {
        backgroundColor: theme.eventkit.colors.white,
        display: 'inline-block',
        margin: '0px 10px',
        // [theme.breakpoints.only('xs')]: {
        //     margin: '0px 10px 0px 100px',
        // },
    },
    title: {
        fontSize: 15,
        color: theme.eventkit.colors.black,
        marginBottom: '4px',
        display: 'inline'
    },
    closeButton: {
        fontSize: 'medium',
        float: 'right',
        marginBottom: '4px',
    },
    closeIcon: {
        fontSize: 'small',
    },
    grid: {
        paddingTop: '5px'
    },
    details: {
        fontSize: 13,
        color: theme.eventkit.colors.grey,
        display: 'inline-block',
        paddingRight: '5px',
    }
});


export interface Props {
    lat: number;
    long: number;
    featureData: any;
    closeCard: boolean;
    handleClose: (event: any) => void;
    classes: {
        card: string;
        cardContent: string;
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

    // checkCase(str) {
    //     const splitStr = str.toLowerCase().split(' ');
    //     for (let i = 0; i < splitStr; i++) {
    //         splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    //     }
    //     return splitStr.join(' ');
    // }

    render() {
        const { lat, long, closeCard, handleClose, classes } = this.props;
        const latLong = (lat !== null && lat !== undefined && long !== null && long !== undefined) ? `${lat}, ${long}` : '---, ---';
        if (!this.props.featureData) {
            return (<div/>);
        }
        const featureKeys = Object.keys(this.props.featureData);
        const featureValues = Object.values(this.props.featureData);

        return (
            <div className='qa-displayDataBox' >
                { !closeCard ?
                    <Card className={classes.card}>
                        <CardContent className={classes.cardContent}>
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
                                <Grid item xs={6} className={classes.details}>
                                    <Typography className={classes.details}>Lat, Long:</Typography>
                                    {featureKeys.map((key, ix) => (
                                        <Typography key={"key" + ix} className={classes.details}>{key}:</Typography>
                                    ))}
                                </Grid>
                                <Grid item xs={6} className={classes.details}>
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
