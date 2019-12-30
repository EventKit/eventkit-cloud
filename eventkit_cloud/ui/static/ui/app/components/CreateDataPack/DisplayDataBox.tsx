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

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    cardDetails: {
        minWidth: 275,
        color: theme.eventkit.colors.white,
    },
    cardDetailsBody: {
        padding: '12px',
    },
    title: {
        fontSize: 15,
        color: theme.eventkit.colors.black,
        marginBottom: "4px",
    },
    details: {
        fontSize: 13,
        color: theme.eventkit.colors.grey,
        display: 'inline-block',
        paddingRight: '5px',
    },
    closeButton: {
        padding: 0,
        fontSize: 'small',
    },
    closeIcon: {
        fontSize: 'small',
        marginTop: '7px'
    }
});

// error handling?

export interface Props {
    lat: number;
    long: number;
    layerId: number;
    layerName: string;
    displayFieldName: string;
    value: string;
    closeCard: boolean;
    handleClose: (event: any) => void;
    classes: {
        // card: string;
        cardDetails: string;
        cardDetailsBody: string;
        title: string;
        details: string;
        closeButton: string;
        closeIcon: string;
    };
}

export class DisplayDataBox extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        const { lat, long, layerId, layerName, displayFieldName, value, closeCard, handleClose, classes } = this.props;

        return (
            <div className={classes.cardDetails} >
                { !closeCard ?
                    <Card>
                        <CardContent className={classes.cardDetailsBody}>
                            <Typography className={classes.title}> {"South Dakota"} </Typography>
                            <Grid>
                                <Grid item xs={4} className={classes.details}>
                                    <Typography>Lat, Long:</Typography>
                                    <Typography>Image Date:</Typography>
                                    <Typography>Source:</Typography>
                                    <Typography>Type:</Typography>
                                </Grid>
                                <Grid item xs={4} className={classes.details}>
                                    <Typography><strong>{1337}, {7331}</strong></Typography>
                                    <Typography><strong>{"10/24"}</strong></Typography>
                                    <Typography><strong>{"Layer Name"}</strong></Typography>
                                    <Typography><strong>{"Display Field Name"}</strong></Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <IconButton
                                        className={classes.closeButton}
                                        type='button'
                                        onClick={(e) => {
                                            handleClose(e);
                                        }}
                                    >
                                        <CloseIcon className={classes.closeIcon}/>
                                    </IconButton>
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
