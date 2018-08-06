import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import { withStyles } from '@material-ui/core/styles';

export class LoadButtons extends React.Component {
    constructor(props) {
        super(props);
        this.setWidth = this.setWidth.bind(this);
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
        // eslint-disable-next-line react/no-find-dom-node
        const width = ReactDOM.findDOMNode(this).offsetWidth;
        if (width !== this.state.width) {
            this.setState({ width });
        }
    }

    render() {
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
                    color: '#a59c9c',
                    lineHeight: '36px',
                    fontSize: '12px',
                }
                :
                {
                    display: 'inline-block',
                    position: 'absolute',
                    color: '#a59c9c',
                    lineHeight: '36px',
                    right: '10px',
                    fontSize: '12px',
                },
        };

        const { classes } = this.props;

        return (
            <div style={inlineStyles.container}>
                <div style={{ display: 'inline-block' }}>
                    {this.props.handleLoadLess ?
                        <Button
                            className="qa-LoadButtons-RaisedButton-showLess'"
                            classes={{ root: classes.root }}
                            variant="contained"
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
                        classes={{ root: classes.root }}
                        variant="contained"
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
    classes: PropTypes.object.isRequired,

};

LoadButtons.defaultProps = {
    style: {},
    handleLoadLess: undefined,
    loadLessDisabled: false,
};

const classStyles = {
    root: {
        minWidth: '145px',
        margin: '5px 2.5px',
        backgroundColor: '#e5e5e5',
        color: '#4498c0',
        '&:disabled': {
            backgroundColor: '#e5e5e5',
            color: 'rgba(0, 0, 0, 0.3)',
        },
    },
};

export default withStyles(classStyles)(LoadButtons);
