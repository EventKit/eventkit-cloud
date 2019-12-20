import * as React from "react";
import {createStyles, Theme, withStyles} from "@material-ui/core";
import { Card, CardContent, Typography } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Menu from "@material-ui/icons/Menu";
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
        fontSize: 14,
        color: theme.eventkit.colors.black,
        marginBottom: "2px",
    },
    details: {
        fontSize: 14,
        color: theme.eventkit.colors.grey,
    },
    closeButton: {
        padding: 0,
        fontSize: 'small',
    },
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
        card: string;
        title: string;
        closeButton: string;
        cardDetails: string;
        cardDetailsBody: string;
        details: string;
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
                            <Typography className={classes.title} variant="h5" component="h3">
                                {"South Dakota"}
                            </Typography>
                            <Typography className={classes.details}>
                                Lat, Long: {1337} {7331}
                            </Typography>
                            <Typography className={classes.details}>
                                Image Date: 10/24/2019
                            </Typography>
                            <Typography className={classes.details}>
                                Source: {"Layer Name"}
                            </Typography>
                            <Typography className={classes.details}>
                                Type: {"Display Field Name"}
                            </Typography>
                            <IconButton
                                className={classes.closeButton}
                                type='button'
                                onClick={(e) => {
                                    handleClose(e);
                                }}
                            >
                                <CloseIcon style={{ fontSize: 'small', marginTop: '7px'}}/>
                            </IconButton>
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
