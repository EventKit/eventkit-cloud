import * as React from "react";
import {createStyles, Theme, Typography, withStyles} from "@material-ui/core";
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    card: {
        minWidth: 275,
    },
    bullet: {
        display: 'inline-block',
        margin: '0 2px',
        transform: 'scale(0.8)',
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
    theme: Eventkit.Theme;
    classes: {
        container: string;
        card: string;
        title: string;
    };
}

export class DisplayDataBox extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }
    render() {
        const colors = this.props.theme.eventkit.colors;
        const { lat, long, layerId, layerName, displayFieldName, value, classes } = this.props;

        return (
            <div style={{ backgroundColor: colors.white }}>
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
