import React, {PropTypes} from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

export class DataPackSortDropDown extends React.Component {

    constructor(props) {
        super(props);
    }

    getPx(item) {
        if(window.innerWidth <= 575) {
            const values = { labelFontSize: '12px', itemFontSize: '10px', labelRightPadding: '24px'}
            return values[item]
        }
        else if (window.innerWidth <= 767) {
            const values = {labelFontSize: '13px', itemFontSize: '11px', labelRightPadding: '24px'}
            return values[item]
        }
        else if (window.innerWidth <= 991) {
            const values = {labelFontSize: '14px', itemFontSize: '12px', labelRightPadding: '26px'}
            return values[item]
        }
        else if(window.innerWidth <= 1199) {
            const values = {labelFontSize: '15px', itemFontSize: '13px', labelRightPadding: '28px'}
            return values[item]
        }
        else {
            const values = {labelFontSize: '16px', itemFontSize: '14px', labelRightPadding: '30px'}
            return values[item]
        }
    }

    render() {
        const styles = {
            dropDown: {
                height: '30px',
                lineHeight: '30px',
                float: 'right',
            },
            item: {
                fontSize: this.getPx('itemFontSize'),
            },
            icon: {
                height: '30px',
                width: '30px',
                padding: '0px',
                fill: '#4498c0',
                right: '2px',
            },
            label: {
                lineHeight: '30px', 
                color: '#4498c0', 
                paddingLeft: 0,
                paddingRight: this.getPx('labelRightPadding'),
                fontSize: this.getPx('labelFontSize')
            },
            list: {
                paddingTop: '5px', 
                paddingBottom: '0px',
            },
            selectedItem: {
                color: '#4498c0'
            },
            underline: {
                display: 'none'
            }
        };

        return (
            <DropDownMenu
                autoWidth={true}
                style={styles.dropDown}
                iconStyle={styles.icon}
                listStyle={styles.list}
                labelStyle={styles.label} 
                value={this.props.value}
                onChange={this.props.handleChange}
                underlineStyle={styles.underline}
                selectedMenuItemStyle={styles.selectedItem}
            >
                <MenuItem style={styles.item} innerDivStyle={{padding: '0px 14px'}} value={'-started_at'} primaryText={"Newest"}/>
                <MenuItem style={styles.item} innerDivStyle={{padding: '0px 14px'}} value={'started_at'} primaryText={"Oldest "}/>
                <MenuItem style={styles.item} innerDivStyle={{padding: '0px 14px'}} value={'job__name'} primaryText={"Name (A-Z)"}/>
                <MenuItem style={styles.item} innerDivStyle={{padding: '0px 14px'}} value={'-job__name'} primaryText={"Name (Z-A)"}/>
            </DropDownMenu>
        );
    }
}


DataPackSortDropDown.propTypes = {
    handleChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired
};

export default DataPackSortDropDown;
