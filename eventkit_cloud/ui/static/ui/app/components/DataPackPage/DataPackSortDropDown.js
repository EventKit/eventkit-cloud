import PropTypes from 'prop-types';
import React from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

export class DataPackSortDropDown extends React.Component {
    render() {
        const styles = {
            dropDown: {
                height: '30px',
                lineHeight: '30px',
                marginRight: '10px',
            },
            item: {
                fontSize: window.innerWidth > 575 ? '12px' : '11px',
            },
            icon: {
                padding: 0,
                fill: '#4498c0',
                position: 'inline-block',
                verticalAlign: 'top',
                top: 0,
                right: 0,
                width: 20,
                height: 24,
                margin: 3,
            },
            label: {
                lineHeight: '30px',
                color: '#4498c0',
                paddingLeft: 0,
                paddingRight: 32,
                height: '30px',
                display: 'inline-block',
                padding: 0,
                fontSize: window.innerWidth > 575 ? '14px' : '12px',
            },
            list: {
                paddingTop: '5px',
                paddingBottom: '0px',
            },
            selectedItem: {
                color: '#4498c0',
            },
            underline: {
                margin: '0px',
                borderTopColor: '#4498c0',
            },
        };

        return (
            <DropDownMenu
                className="qa-DataPackSortDropDown-DropDownMenu"
                autoWidth
                style={styles.dropDown}
                iconStyle={styles.icon}
                listStyle={styles.list}
                labelStyle={styles.label}
                value={this.props.value}
                onChange={this.props.handleChange}
                underlineStyle={styles.underline}
                selectedMenuItemStyle={styles.selectedItem}
            >
                <MenuItem
                    className="qa-DataPackSortDropDown-MenuItem-featured"
                    style={styles.item}
                    innerDivStyle={{ padding: '0px 14px' }}
                    value="-job__featured"
                    primaryText="Featured"
                />
                <MenuItem
                    className="qa-DataPackSortDropDown-MenuItem-newest"
                    style={styles.item}
                    innerDivStyle={{ padding: '0px 14px' }}
                    value="-started_at"
                    primaryText="Newest"
                />
                <MenuItem
                    className="qa-DataPackSortDropDown-MenuItem-oldest"
                    style={styles.item}
                    innerDivStyle={{ padding: '0px 14px' }}
                    value="started_at"
                    primaryText="Oldest "
                />
                <MenuItem
                    className="qa-DataPackSortDropDown-MenuItem-nameAZ"
                    style={styles.item}
                    innerDivStyle={{ padding: '0px 14px' }}
                    value="job__name"
                    primaryText="Name (A-Z)"
                />
                <MenuItem
                    className="qa-DataPackSortDropDown-MenuItem-nameZA"
                    style={styles.item}
                    innerDivStyle={{ padding: '0px 14px' }}
                    value="-job__name"
                    primaryText="Name (Z-A)"
                />
            </DropDownMenu>
        );
    }
}


DataPackSortDropDown.propTypes = {
    handleChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
};

export default DataPackSortDropDown;
