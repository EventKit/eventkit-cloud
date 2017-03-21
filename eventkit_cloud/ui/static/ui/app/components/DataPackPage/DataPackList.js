import React, {PropTypes, Component} from 'react'
import {GridList, GridTile} from 'material-ui/GridList'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import moment from 'moment';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import ol from 'openlayers';
import DataPackItem from './DataPackItem';


export class DataPackList extends Component {
    constructor(props) {
        super(props);
        this.updateColumns = this.updateColumns.bind(this);
        this.state = {
            cols: 2
        }
    }

    componentWillMount() {
        this.updateColumns();
        window.addEventListener('resize', this.updateColumns);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateColumns);
    }

    updateColumns() {
        if(window.innerWidth <= 800) {
            this.setState({cols: 1});
        }
        else if(window.innerWidth > 1200) {
            this.setState({cols: 3});
        }
        else {
            this.setState({cols: 2});
        }
    }


    render() {
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginTop: '20px',
                marginLeft: '20px',
                marginRight: '20px',
            },
            gridList: {
                border: '1px',
                width: '100%',
                margin: '0px',
                height: 'auto',
            },
        };

        return (
            <div style={styles.root}>
                <GridList
                    cellHeight={'auto'}
                    style={styles.gridList}
                    cols={this.state.cols}
                >
                    {this.props.runs.map((run) => (
                        <DataPackItem 
                            run={run} 
                            user={this.props.user} 
                            key={run.uid}
                            onRunDelete={this.props.onRunDelete}/>
                    ))}
                </GridList>
            </div>
        )
    }
}

DataPackList.propTypes = {
    runs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
};

export default DataPackList;
