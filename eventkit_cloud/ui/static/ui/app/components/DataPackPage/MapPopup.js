import React, {PropTypes, Component} from 'react';
import Clear from 'material-ui/svg-icons/content/clear';
import {Card} from 'material-ui/Card';
import ArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';
import Dot from 'material-ui/svg-icons/av/fiber-manual-record';
import moment from 'moment';

export class MapPopup extends Component {
    constructor(props) {
        super(props);
        this.showMore = this.showMore.bind(this);
        this.state = {
            showMore: false
        }
    }

    showMore() {
        this.setState({showMore: !this.state.showMore});
    }

    render() {
        const styles = {
            popupHeader: {
                width: '100%', 
                height: '100%', 
                padding: '10px 10px 5px', 
                color: '#4598bf'
            },
            popupNameContainer: {
                display: 'inline-block', 
                verticalAlign: 'middle', 
                height: '22px', 
                width: 'calc(100% - 20px)'
            },
            popupName: {
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap', 
                fontSize: '18px'
            },
            closeButtonContainer: {
                display: 'inline-block', 
                verticalAlign: 'middle', 
                height: '22px', 
                float: 'right'
            },
            closeButton: {
                height: '20px', 
                width: '20px', 
                fill: '#4598bf', 
                cursor: 'pointer'
            },
            buttonLabel: {
                display: 'inline-block', 
                height: '20px', 
                verticalAlign: 'middle', 
                lineHeight: '19px'
            },
            buttonIcon: {
                fill: '#4598bf', 
                height: '20px', 
                width: '20px', 
                verticalAlign: 'middle'
            },
            buttonStyle: {
                height: '25px', 
                fontSize: '12px', 
                color: '#4598bf', 
                lineHeight: '25px'
            },
            event: {
                width: '100%',
                height: '100%', 
                padding: '5px 10px', 
                color: 'grey', 
                fontSize: '14px', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap'
            },
            actions: {
                width: '100%', 
                height: '100%', 
                padding: '5px 10px 0px', 
                color: 'grey'
            },
            showMoreIcon: {
                width: '18px', 
                height: '18px', 
                color: '#4598bf', 
                verticalAlign: 'bottom'
            },
            dot: {
                color: '#ce4427', 
                backgroundColor: 'white',
                 border: '1px solid #4598bf', 
                 borderRadius: '100%', 
                 height: '14px', 
                 width: '14px', 
                 verticalAlign: 'middle', 
                 marginRight: '5px'
            },
            moreInfo: {
                width: '100%', 
                height: '100%', 
                padding: '10px 10px 10px', 
                color: 'grey'
            }
        };
        
        return (
            <Card className={'qa-MapPopup-Card'} containerStyle={{padding: '10px', zIndex: 10}}>
                <div id="popup-header" style={styles.popupHeader}>
                    <div className={'qa-MapPopup-div-name'} id="popup-name-container" style={styles.popupNameContainer}>
                        <div id="popup-name" style={styles.popupName}>
                            <a href={`/status/${this.props.featureInfo.job.uid}`} style={{color: '#4598bf'}}>
                                <Dot style={styles.dot}/>
                                <strong>{this.props.featureInfo.name}</strong>
                            </a>
                        </div>
                    </div>
                    <div className={'qa-MapPopup-close'} id="close-button-container" style={styles.closeButtonContainer}>
                        <Clear
                            className={'qa-MapPopup-Clear'}
                            style={styles.closeButton} 
                            onClick={this.props.handlePopupClose}
                        />
                    </div>
                </div>
                <div  className={'qa-MapPopup-event'} id="popup-event" style={styles.event}>
                    Event: {this.props.featureInfo.job.event}                                    
                </div>
                <div id="popup-actions" style={styles.actions}>
                    <div style={{display: 'inline-block', margin: 'auto', width: '100%'}}>
                        <div  className={'qa-MapPopup-div-detailsUrl'} style={{display: 'inline-block', height: '22px', marginLeft: '15px', float: 'right'}}>
                            <a id='details-url' href={this.props.detailUrl} style={{color: '#4598bf'}}>
                                Go To Detail and Downloads
                            </a>
                        </div>
                        <div  className={'qa-MapPopup-div-zoomTo'} style={{display: 'inline-block', height: '22px', marginLeft: '15px', float: 'right'}}>
                            <a id='zoom-to' onClick={this.props.handleZoom} style={{textDecoration: 'none', cursor: 'pointer', color: '#4598bf'}}>
                                Zoom To Selection
                            </a>
                        </div>
                        <div  className={'qa-MapPopup-div-showMore'} style={{display: 'inline-block', height: '22px', float: 'left'}}>
                            <div id='show-more' onClick={this.showMore} style={{textDecoration: 'none', cursor: 'pointer', color: '#4598bf'}}>
                                {this.state.showMore ? 'Show Less' : 'Show More' }
                                {this.state.showMore ? <ArrowUp style={styles.showMoreIcon}/> : <ArrowDown style={styles.showMoreIcon}/>}
                            </div>
                        </div>
                    </div>
                </div>
                
                {this.state.showMore? 
                    <div  className={'qa-MapPopup-div-moreInfo'} id="moreInfo" style={styles.moreInfo}>
                        {this.props.featureInfo.job.description ? <div style={{margin: '5px 0px'}}>Description: {this.props.featureInfo.job.description}</div>: null}
                        {this.props.featureInfo.created_at ? <div style={{margin: '5px 0px'}}>Created at: {moment(this.props.featureInfo.created_at).format('YYYY-MM-DD')}</div>: null}
                        {this.props.featureInfo.expiration ? <div style={{margin: '5px 0px'}}>Expiration: {moment(this.props.featureInfo.expiration).format('YYYY-MM-DD')}</div>: null}
                        {this.props.featureInfo.user ? <div style={{margin: '5px 0px'}}>Owner: {this.props.featureInfo.user}</div>: null}
                    </div>
                : null}
            </Card>
        )      
    }
}

MapPopup.propTypes = {
    featureInfo: PropTypes.object,
    detailUrl: PropTypes.string,
    handleZoom: PropTypes.func,
    handlePopupClose: PropTypes.func,
};

export default MapPopup;
