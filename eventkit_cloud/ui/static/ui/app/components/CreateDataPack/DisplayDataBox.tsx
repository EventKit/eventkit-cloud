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
        padding: '12px'
    },
    title: {
        fontSize: 15,
        color: theme.eventkit.colors.black,
        marginBottom: '4px',
        display: 'inline'
    },
    details: {
        fontSize: '13px !important',
        color: theme.eventkit.colors.grey,
        display: 'inline-block',
        paddingRight: '5px',
        padding: 0
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
                            <Grid>
                                <Grid item xs={6} className={classes.details}>
                                    <Typography>Lat, Long:</Typography>
                                    <Typography>Image Date:</Typography>
                                    <Typography>Source:</Typography>
                                    <Typography>Type:</Typography>
                                </Grid>
                                <Grid item xs={6} className={classes.details}>
                                    <Typography>{1337}, {7331}</Typography>
                                    <Typography>{"10/24"}</Typography>
                                    <Typography>{"Layer Name"}</Typography>
                                    <Typography>{"Display Field Name"}</Typography>
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
