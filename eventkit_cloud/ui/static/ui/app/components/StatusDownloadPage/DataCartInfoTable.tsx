import * as React from 'react';
import * as moment from 'moment';
import CustomTableRow from '../CustomTableRow';

export interface Props {
    dataPack: {
        uid: string;
        user: string;
        started_at: string;
        finished_at: string;
    };
}

export class DataCartInfoTable extends React.Component<Props, {}> {
    render() {
        return (
            <div>
                <CustomTableRow
                    title="Run By"
                    data={this.props.dataPack.user}
                />
                <CustomTableRow
                    title="Run Id"
                    data={this.props.dataPack.uid}
                />
                <CustomTableRow
                    title="Started"
                    data={moment(this.props.dataPack.started_at).format('M/D/YY h:mma')}
                />
                <CustomTableRow
                    title="Finished"
                    data={this.props.dataPack.finished_at === null ?
                        'Currently Processing...' : moment(this.props.dataPack.finished_at).format('M/D/YY h:mma')
                    }
                />
            </div>
        );
    }
}

export default DataCartInfoTable;
