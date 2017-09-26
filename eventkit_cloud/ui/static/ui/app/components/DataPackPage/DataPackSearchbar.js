import React, {PropTypes} from 'react'
import TextField from 'material-ui/TextField';

class DataPackSearchbar extends React.Component {
    constructor(props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleKeyDown(event) {
        if(event.key == 'Enter') {
            const text = event.target.value || '';
            this.props.onSearchSubmit(text);
        }
    }

    handleChange(event, value) {
        const text = value || '';
        this.props.onSearchChange(text);
    }

    render() {
        const styles = {
            container: {
                color: 'white',
                height: '36px', 
                width: '100%', 
                backgroundColor: '#16212f',
                lineHeight: '36px'
            },
            hint: {
                color: '#5a5a5a',
                height: '36px',
                lineHeight: 'inherit',
                bottom: '0px',
                paddingLeft: '5px'
            },
            input: {
                color: '#cacaca',
                paddingLeft: '5px'
            },
            underline: {
                borderBottom: '1px solid #5a5a5a', 
                bottom: '0px'
            },
            underlineFocus: {
                borderBottom: '2px solid #4498c0', 
                bottom: '0px'
            }
        };

        return (
            <TextField
                className={'qa-DataPackSearchBar-TextField'}
                style={styles.container}
                hintText={'Search DataPacks'}
                hintStyle={styles.hint}
                inputStyle={styles.input}
                onChange={this.handleChange}
                underlineStyle={styles.underline}
                underlineFocusStyle={styles.underlineFocus}
                onKeyDown={this.handleKeyDown}
            />
        );
    }
}

DataPackSearchbar.propTypes = {
    onSearchChange: React.PropTypes.func,
    onSearchSubmit: React.PropTypes.func,
};

export default DataPackSearchbar;
