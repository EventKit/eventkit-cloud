import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import CustomTableRow from '../CustomTableRow';
import PermissionsData from './PermissionsData';
import ExpirationData from './ExpirationData';

export class DataPackStatusTable extends Component {
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
                            members={this.props.members}
                            groups={this.props.groups}
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

DataPackStatusTable.defaultProps = {
    minDate: null,
    maxDate: null,
    statusColor: null,
    statusFontColor: null,
    adminPermissions: false,
};

DataPackStatusTable.propTypes = {
    status: PropTypes.string.isRequired,
    expiration: PropTypes.string.isRequired,
    permissions: PropTypes.shape({
        value: PropTypes.oneOf([
            'PUBLIC',
            'PRIVATE',
            'SHARED',
        ]),
        groups: PropTypes.objectOf(PropTypes.string),
        members: PropTypes.objectOf(PropTypes.string),
    }).isRequired,
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
    handleExpirationChange: PropTypes.func.isRequired,
    handlePermissionsChange: PropTypes.func.isRequired,
    statusColor: PropTypes.string,
    statusFontColor: PropTypes.string,
    members: PropTypes.arrayOf(PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
        }),
        groups: PropTypes.arrayOf(PropTypes.number),
    })).isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    adminPermissions: PropTypes.bool,
    user: PropTypes.shape({
        user: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
};

export default withTheme()(DataPackStatusTable);
