
import React, {Component, PropTypes} from 'react';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ContentClear from 'material-ui/svg-icons/content/clear';

export class DrawBoxButton extends Component {

    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        if(this.props.buttonState == 'SELECTED') {
            this.props.setAllButtonsDefault();
            this.props.handleCancel();
        }
        else if(this.props.buttonState == 'DEFAULT') {
            this.props.setBoxButtonSelected();
            this.props.updateMode('MODE_DRAW_BBOX')

        }
    }

    render() {
        const state = this.props.buttonState;
        const styles = {
            buttonName: {
                fontSize: '.5em',
                width: '50px',
                height: '12px',
                color: '#4498c0',
                bottom: '0',
            },
            drawButtonGeneral: {
                height: '50px',
                width: '50px',
                borderTop: '1px solid #e6e6e6',
                borderRight: 'none',
                borderLeft: 'none',
                borderBottom: 'none',
                margin: 0,
                padding: 0,
                backgroundColor: '#fff',
                outline: 'none'
            }
        }

        const DEFAULT_ICON = <div id='default_icon'>
                <ImageCropSquare style={{fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div style={styles.buttonName}>BOX</div>
            </div>

        const INACTIVE_ICON = <div id='inactive_icon'>
                <ImageCropSquare style={{opacity: 0.4, fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div style={{...styles.buttonName, opacity: 0.4}}>BOX</div>
            </div>

        const SELECTED_ICON = <div id='selected_icon'>
                <ContentClear style={{fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div style={styles.buttonName}>BOX</div>
            </div>

        return (
            <button style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {state == 'DEFAULT' ? DEFAULT_ICON : state == 'INACTIVE' ? INACTIVE_ICON : SELECTED_ICON}
            </button>
        )
    };
}

DrawBoxButton.propTypes = {
    buttonState: PropTypes.string,
    updateMode: PropTypes.func,
    setBoxButtonSelected: PropTypes.func,
    setAllButtonsDefault: PropTypes.func,
    handleCancel: PropTypes.func
}

export default DrawBoxButton;

