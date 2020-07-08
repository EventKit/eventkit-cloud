// import PropTypes from 'prop-types';
import * as React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import DropDownMenu from '../common/DropDownMenu';

const NAME_LOOKUP = {
    '-job__featured': 'Featured',
    '-started_at': 'Newest',
    started_at: 'Oldest',
    job__name: 'Name (A-Z)',
    '-job__name': 'Name (Z-A)',
};

export interface Props {
    handleChange: (value: string) => void;
    value: string;
}

export class DataPackSortDropDown extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(value: string) {
        this.props.handleChange(value);
    }

    render() {
        const styles = {
            item: {
                fontSize: '12px',
                padding: '0px 24px',
                height: '32px',
            },
        };

        return (
            <DropDownMenu
                className="qa-DataPackSortDropDown-Menu"
                value={NAME_LOOKUP[this.props.value]}
                style={{ height: '30px', lineHeight: '30px' }}
            >
                <MenuItem
                    key="featured"
                    className="qa-DataPackSortDropDown-MenuItem-featured"
                    style={styles.item}
                    selected={this.props.value === '-job__featured'}
                    onClick={() => this.handleChange('-job__featured')}
                >
                    Featured
                </MenuItem>
                <MenuItem
                    key="newest"
                    className="qa-DataPackSortDropDown-MenuItem-newest"
                    style={styles.item}
                    selected={this.props.value === '-started_at'}
                    onClick={() => this.handleChange('-started_at')}
                >
                    Newest
                </MenuItem>
                <MenuItem
                    key="oldest"
                    className="qa-DataPackSortDropDown-MenuItem-oldest"
                    style={styles.item}
                    selected={this.props.value === 'started_at'}
                    onClick={() => this.handleChange('started_at')}
                >
                    Oldest
                </MenuItem>
                <MenuItem
                    key="nameAZ"
                    className="qa-DataPackSortDropDown-MenuItem-nameAZ"
                    style={styles.item}
                    selected={this.props.value === 'job__name'}
                    onClick={() => this.handleChange('job__name')}
                >
                    Name (A-Z)
                </MenuItem>
                <MenuItem
                    key="nameZA"
                    className="qa-DataPackSortDropDown-MenuItem-nameZA"
                    style={styles.item}
                    onClick={() => this.handleChange('-job__name')}
                    selected={this.props.value === '-job__name'}
                >
                    Name (Z-A)
                </MenuItem>
            </DropDownMenu>
        );
    }
}

export default DataPackSortDropDown;
