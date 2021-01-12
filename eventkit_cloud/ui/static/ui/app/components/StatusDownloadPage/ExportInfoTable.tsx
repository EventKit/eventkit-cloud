import * as React from 'react';
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

export class ExportInfoTable extends React.Component<Props, {}> {
    render() {
        const { dataPack } = this.props;
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
                    {moment(dataPack.started_at).format('M/D/YY h:mma')}
                </CustomTableRow>
                <CustomTableRow
                    title="Finished"
                >
                    {dataPack.finished_at === null ? 'Currently Processing...' : moment(dataPack.finished_at).format('M/D/YY h:mma')}
                </CustomTableRow>
            </div>
        );
    }
}

export default ExportInfoTable;
