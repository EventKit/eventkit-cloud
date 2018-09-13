import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import Help from '@material-ui/icons/Help';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
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
        const { colors } = this.props.theme.eventkit;

        const styles = {
            tourButton: {
                color: colors.primary,
                cursor: 'pointer',
                display: 'inline-block',
            },
            tourIcon: {
                cursor: 'pointer',
                height: '18px',
                width: '18px',
                verticalAlign: 'middle',
                marginRight: '5px',
            },
        };

        const iconElementRight = (
            <ButtonBase
                onClick={this.handleWalkthroughClick}
                style={styles.tourButton}
            >
                <Help
                    style={styles.tourIcon}
                />
                Page Tour
            </ButtonBase>
        );

        return (
            <div>
                <PageHeader
                    title="Create DataPack"
                >
                    {iconElementRight}
                </PageHeader>
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
    theme: PropTypes.object.isRequired,
};

export default withTheme()(CreateExport);
