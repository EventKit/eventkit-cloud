import React, { PropTypes, Component } from 'react';
import Drawer from 'material-ui/Drawer';
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
            published: null,
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

    handlePermissionsChange(event, value) {
        this.setState({ published: value });
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

    handleMinDate(e, date) {
        this.setState({ minDate: date });
    }

    handleMaxDate(e, date) {
        this.setState({ maxDate: date });
    }

    render() {
        const styles = {
            containerStyle: {
                backgroundColor: '#fff',
                top: '221px',
                height: window.innerHeight - 221,
                overflowY: 'hidden',
                overflowX: 'hidden',
            },
        };

        return (
            <Drawer
                className="qa-FilterDrawer-Drawer"
                width={250}
                openSecondary
                open={this.props.open}
                containerStyle={styles.containerStyle}
            >
                <CustomScrollbar>
                    <FilterHeader
                        onApply={this.handleFilterApply}
                        onClear={this.handleFilterClear}
                    />
                    <PermissionFilter
                        onChange={this.handlePermissionsChange}
                        valueSelected={this.state.published}
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
};

export default FilterDrawer;
