import React, {PropTypes, Component} from 'react'
import {GridList} from 'material-ui/GridList'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card'
import DataPackGridItem from './DataPackGridItem';


export class DataPackGrid extends Component {
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
            this.setState({cols: 2});
        }
        else if(window.innerWidth > 1200) {
            this.setState({cols: 4});
        }
        else {
            this.setState({cols: 3});
        }
    }


    render() {
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: '3px',
                marginRight: '3px',
                paddingBottom: '30px'
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
                    padding={1}
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
