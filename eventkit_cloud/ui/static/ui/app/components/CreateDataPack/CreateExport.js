import React, { PropTypes } from 'react';
import AppBar from 'material-ui/AppBar';
import Help from 'material-ui/svg-icons/action/help';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import BreadcrumbStepper from './BreadcrumbStepper';

export class CreateExport extends React.Component {
    constructor(props) {
        super(props);
        this.handleWalkthroughReset = this.handleWalkthroughReset.bind(this);
        this.handleWalkthroughClick = this.handleWalkthroughClick.bind(this);
        this.state = {
            walkthroughClicked: false,
        };
    }

    handleWalkthroughReset() {
        this.setState({ walkthroughClicked: false });
    }

    handleWalkthroughClick() {
        this.setState({ walkthroughClicked: true });
    }


    render() {
        const pageTitle = (<div style={{ display: 'inline-block', paddingRight: '10px' }}>Create DataPack </div>);
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
                height: '35px',
            },
            tourButton: {
                color: '#4598bf',
                cursor: 'pointer',
                display: 'inline-block',
                marginLeft: '10px',
            },
            tourIcon: {
                color: '#4598bf',
                cursor: 'pointer',
                height: '18px',
                width: '18px',
                verticalAlign: 'middle',
                marginRight: '5px',
                marginBottom: '5px',
            },
        };

        const iconElementRight = (
            <EnhancedButton
                onClick={this.handleWalkthroughClick}
                style={styles.tourButton}
            >
                <Help
                    style={styles.tourIcon}
                />
                Page Tour
            </EnhancedButton>
        );

        return (
            <div>
                <AppBar
                    style={styles.appBar}
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconStyleRight={{ marginTop: '2px' }}
                    iconElementRight={iconElementRight}
                    iconElementLeft={<p style={{ display: 'none' }} />}
                />
                <BreadcrumbStepper
                    router={this.props.router}
                    routes={this.props.routes}
                    walkthroughClicked={this.state.walkthroughClicked}
                    onWalkthroughReset={this.handleWalkthroughReset}
                />
                <div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

CreateExport.defaultProps = {
    children: null,
};

CreateExport.propTypes = {
    children: PropTypes.oneOf([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
        PropTypes.string,
    ]),
    router: PropTypes.object.isRequired,
    routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default CreateExport;
