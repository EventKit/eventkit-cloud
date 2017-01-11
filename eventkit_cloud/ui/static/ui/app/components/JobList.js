
import React, {PropTypes} from 'react'
import {GridList, GridTile} from 'material-ui/GridList'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'
import {lightBlue200} from 'material-ui/styles/colors'
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import StarBorder from 'material-ui/svg-icons/toggle/star-border';
import logo from '../../images/logo_white_small.png'

const styles = {
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginTop: '10px',
        marginLeft: '10px',
        marginRight: '10px',
    },
    gridList: {
        border: '1px',
    },
    card: {
        backgroundColor: '#f7f8f8',

    },
    cardTitle:{


    }
};

const JobList = ({jobs}) => {
    return (
    <div style={styles.root}>
        <GridList
            cellHeight={'auto'}
            style={styles.gridList}
            cols={5}
            padding={15}

        >
            {jobs.map((job) => (
                <Card style={styles.card} key={job.uid}>
                    <CardTitle color={lightBlue200} style={styles.cardTitle} title={job.name} subtitle={job.date} />
                    <CardActions>
                        <FlatButton label="Action1" />
                        <FlatButton label="Action2" />
                    </CardActions>
                </Card>
            ))}
        </GridList>
    </div>

    );
};

JobList.propTypes = {
    jobs: PropTypes.array.isRequired
};

export default JobList;