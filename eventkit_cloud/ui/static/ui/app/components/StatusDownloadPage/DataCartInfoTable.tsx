import { Component } from 'react';
import moment from 'moment';
import CustomTableRow from '../common/CustomTableRow';

export interface Props {
    dataPack: {
        uid: string;
        user: string;
        started_at: string;
        finished_at: string;
    };
}

export class DataCartInfoTable extends Component<Props, {}> {
    render() {
        const { dataPack } = this.props;
        let finishedAt = 'Not Started';
        if (dataPack.started_at) {
            finishedAt = dataPack.finished_at
                ? moment(dataPack.finished_at).format('M/D/YY h:mma') : 'Currently Processing...';
        }
        return (
            <div>
                <CustomTableRow
                    title="Run By"
                >
                    {this.props.dataPack.user}
                </CustomTableRow>
                <CustomTableRow
                    title="Run Id"
                >
                    {this.props.dataPack.uid}
                </CustomTableRow>
                <CustomTableRow
                    title="Started"
                >
                    {dataPack.started_at
                        ? moment(dataPack.started_at).format('M/D/YY h:mma') : "Not Started"}

                </CustomTableRow>
                <CustomTableRow
                    title="Finished"
                >
                    {finishedAt}
                </CustomTableRow>
            </div>
        );
    }
}

export default DataCartInfoTable;
