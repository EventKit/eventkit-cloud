import React, {PropTypes, Component} from 'react'
import {GridList} from 'material-ui/GridList'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card'
import DataPackGridItem from './DataPackGridItem';


export class DataPackGrid extends Component {
    constructor(props) {
        super(props);
    }

    getColumns() {
        if(window.innerWidth <= 800) {
            return 2;
        }
        else if(window.innerWidth > 1200) {
            return 4;
        }
        else {
            return 3;
        }
    }

    render() {
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: '10px',
                marginRight: '10px',
                paddingBottom: '10px'
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
                    padding={window.innerWidth >= 768 ? 7: 2}
                    cols={this.getColumns()}
                >
                    {this.props.runs.map((run) => (
                        <DataPackGridItem 
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

DataPackGrid.propTypes = {
    runs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
};

export default DataPackGrid;
