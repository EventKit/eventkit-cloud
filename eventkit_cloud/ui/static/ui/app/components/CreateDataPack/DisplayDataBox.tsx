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
    layerId: number;
    layerName: string;
    displayFieldName: string;
    value: string;
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
        const { lat, long, layerId, layerName, displayFieldName, value, closeCard, handleClose, classes } = this.props;

        return (
            <div className={classes.cardDetails} >
                { !closeCard ?
                    <Card>
                        <CardContent>
                            <Typography className={classes.title}> {"South Dakota"} </Typography>
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
                                    <Typography className={classes.details}>Date:</Typography>
                                    <Typography className={classes.details}>Source:</Typography>
                                    <Typography className={classes.details}>Type:</Typography>
                                </Grid>
                                <Grid item xs={9} className={classes.details}>
                                    <Typography className={classes.details}><strong>{1337}, {1402}</strong></Typography>
                                    <Typography className={classes.details}><strong>{"10/24/2019"}</strong></Typography>
                                    <Typography className={classes.details}><strong>{"Layer Name"}</strong></Typography>
                                    <Typography className={classes.details}><strong>{"Display Field Name"}</strong></Typography>
                                </Grid>
                                {/*<Grid item xs={4}>*/}
                                {/*    <IconButton*/}
                                {/*        className={classes.closeButton}*/}
                                {/*        type='button'*/}
                                {/*        onClick={(e) => {*/}
                                {/*            handleClose(e);*/}
                                {/*        }}*/}
                                {/*    >*/}
                                {/*        <CloseIcon className={classes.closeIcon}/>*/}
                                {/*    </IconButton>*/}
                                    {/*</Grid>*/}
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
