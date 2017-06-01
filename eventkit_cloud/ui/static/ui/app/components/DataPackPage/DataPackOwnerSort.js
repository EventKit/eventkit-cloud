import React, {PropTypes} from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

export class DataPackOwnerSort extends React.Component {

    constructor(props) {
        super(props);
    }

    getLabelFontSize() {
        if(window.innerWidth <= 575) {
            return '12px';
        }
        else if (window.innerWidth <= 767) {
            return '13px';
        }
        else if (window.innerWidth <= 991) {
            return '14px';
        }
        else if(window.innerWidth <= 1199) {
            return '15px';
        }
        else {
            return '16px';
        }
    }

    getItemFontSize() {
        if(window.innerWidth <= 575) {
            return '10px';
        }
        else if (window.innerWidth <= 767) {
            return '11px';
        }
        else if (window.innerWidth <= 991) {
            return '12px';
        }
        else if(window.innerWidth <= 1199) {
            return '13px';
        }
        else {
            return '14px';
        }
    }

    render() {
        const styles = {
            dropDown: {
                height: '30px',
                lineHeight: '35px',
                float: 'left',
            },
            item: {
                fontSize: this.getItemFontSize(),
            },
            icon: {
                height: '30px', 
                width: '30px', 
                padding: '0px', 
                marginRight: '5px', 
                fill: '#4498c0'
            },
            label: {
                lineHeight: '30px', 
                color: '#4498c0', 
                paddingLeft: '5px',
                fontSize: this.getLabelFontSize(),
                fontWeight: 'bold'
            },
            list: {
                paddingTop: '5px', 
                paddingBottom: '0px'
            },
            underline: {
                borderTopColor: '#4498c0', 
                marginLeft: '0px'
            },
            selected: {
                color: '#4498c0'
            }
        };

        return (
            <DropDownMenu 
                style={styles.dropDown}
                labelStyle={styles.label} 
                iconStyle={styles.icon}
                listStyle={styles.list}
                selectedMenuItemStyle={styles.selected} 
                underlineStyle={styles.underline}            
                value={this.props.value}
                onChange={this.props.handleChange}>
                <MenuItem style={styles.item} value={1} primaryText={"All DataPacks"} />
                <MenuItem style={styles.item} value={2} primaryText={"My DataPacks"} />
            </DropDownMenu>
        );
    }
}


DataPackOwnerSort.propTypes = {
    value: PropTypes.number.isRequired,
    handleChange: PropTypes.func.isRequired
};

export default DataPackOwnerSort;
