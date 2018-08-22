import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Drawer from '@material-ui/core/Drawer';
import PermissionFilter from './PermissionsFilter';
import StatusFilter from './StatusFilter';
import DateFilter from './DateFilter';
import FilterHeader from './FilterHeader';
import CustomScrollbar from '../CustomScrollbar';
import ProvidersFilter from './ProvidersFilter';

export class FilterDrawer extends Component {
    constructor(props) {
        super(props);
        this.getDefaultState = this.getDefaultState.bind(this);
        this.handleFilterApply = this.handleFilterApply.bind(this);
        this.handleFilterClear = this.handleFilterClear.bind(this);
        this.handlePermissionsChange = this.handlePermissionsChange.bind(this);
        this.handleProvidersChange = this.handleProvidersChange.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleMinDate = this.handleMinDate.bind(this);
        this.handleMaxDate = this.handleMaxDate.bind(this);
        this.state = this.getDefaultState();
    }

    getDefaultState() {
        return {
            permissions: {
                value: '',
                groups: {},
                members: {},
            },
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            providers: {},
        };
    }

    handleFilterApply() {
        this.props.onFilterApply(this.state);
    }

    handleFilterClear() {
        this.setState(this.getDefaultState());
        this.props.onFilterClear();
    }

    handlePermissionsChange(permissions) {
        this.setState({ permissions: { ...this.state.permissions, ...permissions } });
    }

    handleStatusChange(stateChange) {
        let { status } = this.state;
        status = Object.assign(status, stateChange);
        this.setState({ status });
    }

    handleProvidersChange(slug, isSelected) {
        const { providers } = this.state;
        if (isSelected) {
            providers[slug] = true;
        } else {
            delete providers[slug];
        }

        this.setState({ providers });
    }

    handleMinDate(e) {
        this.setState({ minDate: e.target.value });
    }

    handleMaxDate(e) {
        this.setState({ maxDate: e.target.value });
    }

    render() {
        const styles = {
            containerStyle: {
                backgroundColor: '#fff',
                top: '221px',
                height: window.innerHeight - 221,
                overflowY: 'hidden',
                overflowX: 'hidden',
                width: '250px',
            },
        };

        return (
            <Drawer
                className="qa-FilterDrawer-Drawer"
                variant="persistent"
                anchor="right"
                open={this.props.open}
                PaperProps={{ style: styles.containerStyle }}
                SlideProps={{
                    unmountOnExit: true,
                }}
            >
                <CustomScrollbar>
                    <FilterHeader
                        onApply={this.handleFilterApply}
                        onClear={this.handleFilterClear}
                    />
                    <PermissionFilter
                        onChange={this.handlePermissionsChange}
                        permissions={this.state.permissions}
                        groups={this.props.groups}
                        members={this.props.members}
                    />
                    <StatusFilter
                        onChange={this.handleStatusChange}
                        completed={this.state.status.completed}
                        submitted={this.state.status.submitted}
                        incomplete={this.state.status.incomplete}
                    />
                    <DateFilter
                        onMinChange={this.handleMinDate}
                        onMaxChange={this.handleMaxDate}
                        minDate={this.state.minDate}
                        maxDate={this.state.maxDate}
                    />
                    <ProvidersFilter
                        onChange={this.handleProvidersChange}
                        providers={this.props.providers}
                        selected={this.state.providers}
                    />
                </CustomScrollbar>
            </Drawer>
        );
    }
}

FilterDrawer.propTypes = {
    onFilterApply: PropTypes.func.isRequired,
    onFilterClear: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    members: PropTypes.arrayOf(PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            date_joined: PropTypes.string,
            last_login: PropTypes.string,
        }),
        accepted_licenses: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    })).isRequired,
};

export default FilterDrawer;
