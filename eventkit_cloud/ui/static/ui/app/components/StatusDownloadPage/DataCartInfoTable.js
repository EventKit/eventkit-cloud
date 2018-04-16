import React, { PropTypes, Component } from 'react';
import moment from 'moment';
import DataPackTableRow from './DataPackTableRow';

export class DataCartInfoTable extends Component {
    render() {
        return (
            <div style={{ marginTop: '-5px', marginLeft: '-5px' }}>
                <DataPackTableRow
                    title="Run By"
                    data={this.props.dataPack.user}
                />
                <DataPackTableRow
                    title="Run Id"
                    data={this.props.dataPack.uid}
                />
                <DataPackTableRow
                    title="Started"
                    data={moment(this.props.dataPack.started_at).format('h:mm:ss a, MMMM Do YYYY')}
                />
                <DataPackTableRow
                    title="Finished"
                    data={this.props.dataPack.finished_at === null ? 'Currently Processing...' : moment(this.props.dataPack.finished_at).format('h:mm:ss a, MMMM Do YYYY')}
                />
            </div>
        );
    }
}

DataCartInfoTable.propTypes = {
    dataPack: PropTypes.shape({
        uid: PropTypes.string,
        user: PropTypes.string,
        started_at: PropTypes.string,
        finished_at: PropTypes.string,
    }).isRequired,
};

export default DataCartInfoTable;
