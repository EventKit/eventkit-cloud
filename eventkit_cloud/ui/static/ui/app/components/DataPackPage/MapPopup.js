import React, {PropTypes, Component} from 'react';
import Clear from 'material-ui/svg-icons/content/clear';
import Forward from 'material-ui/svg-icons/content/forward';
import ZoomIn from 'material-ui/svg-icons/action/zoom-in';
import {Card} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

export class MapPopup extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const styles = {
            buttonLabel: {display: 'inline-block', height: '20px', verticalAlign: 'middle', lineHeight: '19px'},
            buttonIcon: {fill: '#4598bf', height: '20px', width: '20px', verticalAlign: 'middle'},
            buttonStyle: {height: '25px', fontSize: '12px', color: '#4598bf', lineHeight: '25px'},
            event: {width: '100%', height: '100%', padding: '5px 10px', color: 'grey', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}
        };
        
        return (
            <Card containerStyle={{padding: '0px'}}>
                <div id="popup-header" style={{width: '100%', height: '100%', padding: '10px 10px 5px', color: '#4598bf'}}>
                    <div id="popup-name-container" style={{display: 'inline-block', verticalAlign: 'middle', height: '22px', width: 'calc(100% - 20px)'}}>
                        <div id="popup-name" style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '16px'}}>
                            <strong>{this.props.name}</strong>
                        </div>
                    </div>
                    <div id="close-button-container" style={{display: 'inline-block', verticalAlign: 'middle', height: '22px', float: 'right'}}>
                        <Clear 
                            style={{height: '20px', width: '20px', fill: 'grey', cursor: 'pointer'}} 
                            onClick={this.props.handlePopupClose}
                        />
                    </div>
                </div>
                <div id="popup-event" style={styles.event}>
                    {this.props.event}                                    
                </div>
                <div id="popup-actions" style={{width: '100%', height: '100%', padding: '5px 10px 10px', color: 'grey'}}>
                    <div style={{height: '22px'}}>
                        <FlatButton
                            labelStyle={{height: '25px'}}
                            backgroundColor={'whitesmoke'}
                            style={styles.buttonStyle}
                            href={this.props.detailUrl}
                        >
                            <Forward style={styles.buttonIcon}/>
                            <div style={styles.buttonLabel}>Go to detail</div>
                        </FlatButton>
                        <FlatButton
                            labelStyle={{height: '25px'}}
                            backgroundColor={'whitesmoke'}
                            style={{...styles.buttonStyle, float: 'right'}}
                            onClick={this.props.handleZoom}
                        >
                            <ZoomIn style={styles.buttonIcon}/>
                            <div style={styles.buttonLabel}>Zoom To</div>
                        </FlatButton>
                    </div>
                </div>
            </Card>
        )      
    }
}

MapPopup.propTypes = {
    name: PropTypes.string,
    event: PropTypes.string,
    detailUrl: PropTypes.string,
    handleZoom: PropTypes.func,
    handlePopupClose: PropTypes.func,
};

export default MapPopup;
