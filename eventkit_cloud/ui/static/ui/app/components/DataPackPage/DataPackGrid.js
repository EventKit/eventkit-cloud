import React, { PropTypes, Component } from 'react';
import { GridList } from 'material-ui/GridList';
import DataPackGridItem from './DataPackGridItem';
import CustomScrollbar from '../CustomScrollbar';
import LoadButtons from './LoadButtons';
import { userIsDataPackAdmin } from '../../utils/generic';

export class DataPackGrid extends Component {
    getColumns() {
        if (window.innerWidth <= 800) {
            return 2;
        } else if (window.innerWidth > 1200) {
            return 4;
        }
        return 3;
    }

    render() {
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            gridList: {
                border: '1px',
                width: '100%',
                margin: '0px',
                height: 'auto',
            },
        };

        return (
            <CustomScrollbar style={{ height: window.innerWidth > 525 ? window.innerHeight - 236 : window.innerHeight - 225, width: '100%' }}>
                <div style={styles.root}>
                    <GridList
                        className="qa-DataPackGrid-GridList"
                        cellHeight="auto"
                        style={styles.gridList}
                        padding={window.innerWidth >= 768 ? 7 : 2}
                        cols={this.getColumns()}
                    >
                        {this.props.runs.map((run) => {
                            const admin = userIsDataPackAdmin(this.props.user.data.user, run.job.permissions, this.props.groups);
                            return (
                                <DataPackGridItem
                                    className="qa-DataPackGrid-GridListItem"
                                    run={run}
                                    user={this.props.user}
                                    key={run.uid}
                                    onRunDelete={this.props.onRunDelete}
                                    providers={this.props.providers}
                                    openShare={this.props.openShare}
                                    adminPermission={admin}
                                />
                            );
                        })}
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
        );
    }
}

DataPackGrid.propTypes = {
    runs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    providers: PropTypes.array.isRequired,
    range: PropTypes.string.isRequired,
    handleLoadLess: PropTypes.func.isRequired,
    handleLoadMore: PropTypes.func.isRequired,
    loadLessDisabled: PropTypes.bool.isRequired,
    loadMoreDisabled: PropTypes.bool.isRequired,
    openShare: PropTypes.func.isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
};

export default DataPackGrid;
