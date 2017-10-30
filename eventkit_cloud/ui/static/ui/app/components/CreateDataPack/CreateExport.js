import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import AppBar from 'material-ui/AppBar'
import {endTour} from '../../actions/exportsActions'
import BreadcrumbStepper from '../BreadcrumbStepper'
import Help from 'material-ui/svg-icons/action/help';

export class CreateExport extends React.Component {

    constructor() {
        super()
        this.handleWalkthroughReset = this.handleWalkthroughReset.bind(this);
        this.handleWalkthroughClick = this.handleWalkthroughClick.bind(this);
        this.state = {
            walkthroughClicked : false
        }
    }

    handleWalkthroughReset() {
        this.setState({walkthroughClicked: false})
        this.props.endTour();
    }

    handleWalkthroughClick() {
        this.setState({walkthroughClicked: true})
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.tour == true ){
            this.handleWalkthroughClick();
        }
    }

    render() {
        const pageTitle = <div style={{display: 'inline-block', paddingRight: '10px'}}>Create DataPack</div>
        //const pageTitle = <span>Create DataPack<Info onTouchTap={this.handleWalkthroughClick.bind(this)} style={{color: 'white', paddingLeft:'10px', paddingTop:'10px', width:'24px', cursor:'pointer'}}/></span>
        const styles = {
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
            },
            pageTitle: {
                fontSize: '18px', 
                lineHeight: '35px', 
                paddingLeft: '10px',
                height: '35px'
            }
        }

        return (
            <div>
                <AppBar 
                    style={styles.appBar} 
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconStyleRight={{marginTop: '2px'}}
                    iconElementLeft={<p style={{display: 'none'}}/>}
                />
                <BreadcrumbStepper
                    walkthroughClicked={this.state.walkthroughClicked}
                    onWalkthroughReset={this.handleWalkthroughReset}/>
                <div >
                    {this.props.children}
                </div>

        </div>
        );
    }
}
CreateExport.propTypes = {
    tour: PropTypes.string.isRequired,
};
function mapStateToProps(state) {
    return {
        tour: state.tour,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        endTour: () => {
            dispatch(endTour());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CreateExport);
