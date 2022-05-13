import { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import CustomTableRow from '../common/CustomTableRow';
import PermissionsData from './PermissionsData';
import ExpirationData from './ExpirationData';

export interface Props {
    className?: string;
    status: string;
    expiration: string;
    permissions: Eventkit.Permissions;
    minDate: Date;
    maxDate: Date;
    handleExpirationChange: (date: Date) => void;
    handlePermissionsChange: (permissions: Eventkit.Permissions) => void;
    statusColor: string;
    statusFontColor: string;
    adminPermissions: boolean;
    user: Eventkit.User;
    job: Eventkit.Job;
}

export class DataPackStatusTable extends Component<Props, {}> {
    static defaultProps = {
        minDate: null,
        maxDate: null,
        statusColor: null,
        statusFontColor: null,
        adminPermissions: false,
    };

    render() {
        return (
            <div>
                <CustomTableRow
                    className="qa-DataPackTableRow-Export"
                    title="Export"
                    titleStyle={{ backgroundColor: this.props.statusColor }}
                    dataStyle={{
                        backgroundColor: this.props.statusColor,
                        color: this.props.statusFontColor,
                    }}
                >
                    {this.props.status}
                </CustomTableRow>
                <CustomTableRow
                    title="Expires"
                >
                    <ExpirationData
                        user={this.props.user}
                        expiration={this.props.expiration}
                        minDate={this.props.minDate}
                        maxDate={this.props.maxDate}
                        adminPermissions={this.props.adminPermissions}
                        handleExpirationChange={this.props.handleExpirationChange}
                    />
                </CustomTableRow>
                <CustomTableRow
                    title="Permissions"
                    dataStyle={{ flexWrap: 'wrap', padding: '5px 10px' }}
                >
                    <PermissionsData
                        user={this.props.user}
                        permissions={this.props.permissions}
                        adminPermissions={this.props.adminPermissions}
                        handlePermissionsChange={this.props.handlePermissionsChange}
                        job={this.props.job}
                    />
                </CustomTableRow>
            </div>
        );
    }
}

export default withTheme(DataPackStatusTable);
