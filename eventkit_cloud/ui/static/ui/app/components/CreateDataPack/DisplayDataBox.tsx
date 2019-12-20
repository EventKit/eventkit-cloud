import * as React from "react";
import {createStyles, Theme, withStyles} from "@material-ui/core";
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    card: {
        minWidth: 275,
        // change this
        color: theme.eventkit.colors.primary,
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
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
    classes: {
        card: string;
        title: string;
        pos: string;
    };
}

export class DisplayDataBox extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }
    render() {
        const { lat, long, layerId, layerName, displayFieldName, value, classes } = this.props;

        return (
            <div style={{ backgroundColor: "white" }}>
                <Card className={classes.card}>
                   <CardContent>
                        <Typography className={classes.title} color="textSecondary" gutterBottom>
                            {lat}
                        </Typography>
                       <Typography className={classes.title} color="textSecondary" gutterBottom>
                            {long}
                        </Typography>
                       <Typography className={classes.title} color="textSecondary" gutterBottom>
                            {layerName}
                        </Typography>
                       <Typography className={classes.title} color="textSecondary" gutterBottom>
                            {displayFieldName}
                        </Typography>
                       <Typography className={classes.title} color="textSecondary" gutterBottom>
                            {value}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button size="small">X</Button>
                    </CardActions>
                </Card>
            </div>
        );
    }
}
export default (withStyles<any, any>(jss)(DisplayDataBox));
