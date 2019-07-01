import * as React from 'react';
import { withTheme } from '@material-ui/core/styles';
import CustomTableRow from '../CustomTableRow';
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
}

export class DataPackStatusTable extends React.Component<Props, {}> {
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
                    data={this.props.status}
                    titleStyle={{ backgroundColor: this.props.statusColor }}
                    dataStyle={{
                        backgroundColor: this.props.statusColor,
                        color: this.props.statusFontColor,
                    }}
                />
                <CustomTableRow
                    title="Expires"
                    data={
                        <ExpirationData
                            user={this.props.user}
                            expiration={this.props.expiration}
                            minDate={this.props.minDate}
                            maxDate={this.props.maxDate}
                            adminPermissions={this.props.adminPermissions}
                            handleExpirationChange={this.props.handleExpirationChange}
                        />
                    }
                />
                <CustomTableRow
                    title="Permissions"
                    dataStyle={{ flexWrap: 'wrap', padding: '5px 10px' }}
                    data={
                        <PermissionsData
                            user={this.props.user}
                            permissions={this.props.permissions}
                            adminPermissions={this.props.adminPermissions}
                            handlePermissionsChange={this.props.handlePermissionsChange}
                        />
                    }
                />
            </div>
        );
    }
}

export default withTheme()(DataPackStatusTable);
