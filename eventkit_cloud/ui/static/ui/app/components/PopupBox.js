import React, {Component} from 'react';
import ContentClear from 'material-ui/svg-icons/content/clear';

export class PopupBox extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const styles = {
            container: {
               position: 'absolute',
               top: '180px',
               left: '25%',
               width: '50%',
               backgroundColor: '#fff',
               zIndex: 1,
               maxWidth: '600px',
               minWidth: '200px',
               maxHeight: '550px',
               textAlign: 'center' 
            },
            titlebar: {
                height: '45px',
                width: '100%',
                textAlign: 'left'
            },
            title: {
                lineHeight: '45px',
                marginLeft: '5%',
            },
            exit: {
                border: 'none',
                backgroundColor: '#fff',
                float: 'right',
                marginRight: '5%',
                marginTop: '8px',
                padding: '0px',
                width: '24px',
                height: '24px',
                outline: 'none'
            },
            body: {
                height: '100%',
                width: '100%',
                padding: '0% 5%'
            },
            footer: {
                height: '45px',
                width: '100%',
                bottom: '0px'
            }
        }
        return (
            <div>
                {this.props.show ? 
                <div style={styles.container} className={'qa-PopupBox-container'}>
                    <div style={styles.titlebar} className={'qa-PopupBox-titlebar'}>
                        <span style={styles.title} className={'qa-PopupBox-title'}>
                            <strong>{this.props.title}</strong>
                        </span>
                        <button onClick={this.props.onExit} style={styles.exit} className={'qa-PopupBox-exit'}>
                            <ContentClear style={{color: '#4498c0'}}/>
                        </button>
                    </div>
                    <div style={styles.body} className={'qa-PopupBox-body'}>
                        {this.props.children}
                    </div>
                    <div style={styles.footer} className={'qa-PopupBox-footer'}/>
                </div>
                : null}
            </div>
        )
    }
}

PopupBox.propTypes = {
    show: React.PropTypes.bool,
    title: React.PropTypes.string,
    onExit: React.PropTypes.func,
}

export default PopupBox;
