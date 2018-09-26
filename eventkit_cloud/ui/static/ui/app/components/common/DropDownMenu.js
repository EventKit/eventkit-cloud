import PropTypes from 'prop-types';
import React from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';

export class DropDownMenu extends React.Component {
    constructor(props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.state = {
            anchor: null,
        };
    }

    handleOpen(e) {
        this.setState({ anchor: e.currentTarget });
    }

    handleClose() {
        this.setState({ anchor: null });
    }

    render() {
        const styles = {
            label: {
                display: 'inherit',
                alignItems: 'inherit',
                justifyContent: 'inherit',
            },
            underline: {
                borderTop: '1px solid #4598bf',
                position: 'absolute',
                bottom: '1px',
                left: 5,
                right: 5,
                ...this.props.underlineStyle,
            },
        };

        return (
            <div style={{ display: 'inline-block', height: '30px' }}>
                <Button
                    className="qa-DropDownMenu-Button"
                    style={{
                        textTransform: 'none',
                        padding: '0px 0px 0px 5px',
                        ...this.props.style,
                    }}
                    color="primary"
                    onClick={this.handleOpen}
                >
                    <div style={styles.label}>
                        <span className="qa-DropDownMenu-label">{this.props.value}</span>
                        <ArrowDropDown color="primary" />
                        <div style={styles.underline} className="qa-DropDownMenu-underline" />
                    </div>
                </Button>
                <Menu
                    className="qa-DropDownMenu-Menu"
                    anchorEl={this.state.anchor}
                    open={Boolean(this.state.anchor)}
                    onClose={this.handleClose}
                    MenuListProps={{ style: { padding: '5px 0px' }, ...this.props.MenuListProps }}
                    getContentAnchorEl={null}
                    anchorOrigin={this.props.anchorOrigin}
                    transformOrigin={this.props.transformOrigin}
                >
                    {this.props.children.map((child) => {
                        // we need to add in our handle close function for every child onClick
                        if (!React.isValidElement(child)) { return null; }

                        return React.cloneElement(child, {
                            ...child.props,
                            onClick: (...args) => {
                                this.handleClose();
                                child.props.onClick(args);
                            },
                        });
                    })}
                </Menu>
            </div>
        );
    }
}

DropDownMenu.defaultProps = {
    anchorOrigin: {
        vertical: 'top',
        horizontal: 'left',
    },
    transformOrigin: {
        vertical: 'top',
        horizontal: 'left',
    },
    MenuListProps: {},
    style: {},
    underlineStyle: {},
};

DropDownMenu.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]).isRequired,
    anchorOrigin: PropTypes.shape({
        vertical: PropTypes.string,
        horizontal: PropTypes.string,
    }),
    transformOrigin: PropTypes.shape({
        vertical: PropTypes.string,
        horizontal: PropTypes.string,
    }),
    MenuListProps: PropTypes.object,
    style: PropTypes.object,
    underlineStyle: PropTypes.object,
};

export default DropDownMenu;
