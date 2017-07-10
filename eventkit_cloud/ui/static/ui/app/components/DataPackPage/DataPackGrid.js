import React, {PropTypes, Component} from 'react'
import {GridList} from 'material-ui/GridList'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card'
import DataPackGridItem from './DataPackGridItem';
import CustomScrollbar from '../CustomScrollbar';
import LoadButtons from './LoadButtons';

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
            <CustomScrollbar style={{height: window.innerHeight - 236, width: '100%'}}>
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
                <LoadButtons
                    range={this.props.range}
                    handleLoadLess={this.props.handleLoadLess}
                    handleLoadMore={this.props.handleLoadMore}
                    loadLessDisabled={this.props.loadLessDisabled}
                    loadMoreDisabled={this.props.loadMoreDisabled}
                />
            </CustomScrollbar>
        )
    }
}

DataPackGrid.propTypes = {
    runs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    range: PropTypes.string.isRequired,
    handleLoadLess: PropTypes.func.isRequired,
    handleLoadMore: PropTypes.func.isRequired,
    loadLessDisabled: PropTypes.bool.isRequired,
    loadMoreDisabled: PropTypes.bool.isRequired
};

export default DataPackGrid;
