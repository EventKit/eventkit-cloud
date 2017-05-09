import React, {Component} from 'react';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import RaisedButton from 'material-ui/RaisedButton';

export class SaveButton extends Component {

    constructor(props) {
        super(props);
    };

    render() {
        const styles = {
           button: {height: '35px', width: '200px', boxShadow: 'none', backgroundColor: 'none'},
           label: {lineHeight: '35px', padding: '0px 5px'}
        };
        if(this.props.saved) {
            return (
                <RaisedButton
                    style={styles.button}
                    disabled={true}
                    label={'Saved'}
                    disabledLabelColor={'#fff'}
                    labelStyle={styles.label}
                    disabledBackgroundColor={'#55BA63'}
                >    
                    <NavigationCheck style={{fill: '#fff', verticalAlign: 'middle'}}/>
                </RaisedButton>
            );
        }
        
        else {
            return (
                <RaisedButton
                    disabled={this.props.saveDisabled}
                    disabledLabelColor={'#e2e2e2'}
                    disabledBackgroundColor={'rgba(226,226,226, 0.5'}
                    style={styles.button}
                    label={'Save Changes'}
                    labelColor={'#fff'}
                    labelStyle={styles.label}
                    backgroundColor={'#4498c0'}
                    onClick={this.props.handleSubmit}
                />
            );
        }
    };
};

SaveButton.PropTypes = {
    saved: React.PropTypes.bool,
    saveDisabled: React.PropTypes.bool,
    handleSubmit: React.PropTypes.func.isRequired
}

export default SaveButton;
