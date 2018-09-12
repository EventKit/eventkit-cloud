import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';

export class LoadButtons extends React.Component {
    constructor(props) {
        super(props);
        this.setWidth = this.setWidth.bind(this);
        this.self = React.createRef();
        this.state = {
            width: window.innerWidth,
        };
    }

    componentDidMount() {
        this.setWidth();
    }

    componentDidUpdate() {
        this.setWidth();
    }

    setWidth() {
        const width = this.self.current.clientWidth;
        if (width !== this.state.width) {
            this.setState({ width });
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const range = this.props.range ? this.props.range.split('/') : null;
        const inlineStyles = {
            container: {
                textAlign: 'center',
                paddingBottom: '10px',
                margin: '0px 10px',
                position: 'relative',
                height: '46px',
                ...this.props.style,
            },
            range: this.state.width < 768 ?
                {
                    color: colors.text_primary,
                    lineHeight: '36px',
                    fontSize: '12px',
                }
                :
                {
                    display: 'inline-block',
                    position: 'absolute',
                    color: colors.text_primary,
                    lineHeight: '36px',
                    right: '10px',
                    fontSize: '12px',
                },
        };

        return (
            <div style={inlineStyles.container} ref={this.self}>
                <div style={{ display: 'inline-block' }}>
                    {this.props.handleLoadLess ?
                        <Button
                            className="qa-LoadButtons-RaisedButton-showLess'"
                            variant="contained"
                            color="secondary"
                            style={{ minWidth: '145px', margin: '5px 2.5px' }}
                            disabled={this.props.loadLessDisabled}
                            onClick={this.props.handleLoadLess}
                        >
                            Show Less
                            <KeyboardArrowUp />
                        </Button>
                        :
                        null
                    }
                    <Button
                        className="qa-LoadButtons-RaisedButton-showLess"
                        variant="contained"
                        color="secondary"
                        style={{ minWidth: '145px', margin: '5px 2.5px' }}
                        disabled={this.props.loadMoreDisabled}
                        onClick={this.props.handleLoadMore}
                    >
                        Show More
                        <KeyboardArrowDown />
                    </Button>
                </div>
                <div className="qa-LoadButtons-range" id="range" style={inlineStyles.range}>
                    {range ? `${range[0]} of ${range[1]}` : ''}
                </div>
            </div>
        );
    }
}

LoadButtons.propTypes = {
    style: PropTypes.object,
    range: PropTypes.string.isRequired,
    handleLoadLess: PropTypes.func,
    handleLoadMore: PropTypes.func.isRequired,
    loadLessDisabled: PropTypes.bool,
    loadMoreDisabled: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
};

LoadButtons.defaultProps = {
    style: {},
    handleLoadLess: undefined,
    loadLessDisabled: false,
};

export default withTheme()(LoadButtons);
