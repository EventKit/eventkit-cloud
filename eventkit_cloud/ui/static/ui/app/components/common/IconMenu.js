import PropTypes from 'prop-types';
import React, { Component } from 'react';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import NavigationMoreVert from '@material-ui/icons/MoreVert';

export class IconMenu extends Component {
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
        return ([
            <IconButton
                key="button"
                className="qa-IconMenu-IconButton"
                style={{
                    width: '36px',
                    height: '36px',
                    verticalAlign: 'initial',
                    ...this.props.style,
                }}
                onClick={this.handleOpen}
            >
                <NavigationMoreVert className="qa-IconMenu-NavigationMoreVert" color="primary" />
            </IconButton>,
            <Menu
                key="menu"
                className="qa-IconMenu-Menu"
                anchorEl={this.state.anchor}
                open={Boolean(this.state.anchor)}
                onClose={this.handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                    ...this.props.anchorOrigin,
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                    ...this.props.transformOrigin,
                }}
                MenuListProps={{
                    style: { padding: '0px' },
                    ...this.props.MenuListProps,
                }}
            >
                {this.props.children.map((child, ix) => {
                    // we need to add in our handle close function for every child onClick

                    if (!React.isValidElement(child)) { return null; }

                    return React.cloneElement(child, {
                        onClick: (...args) => {
                            this.handleClose();
                            child.props.onClick(args);
                        },
                        key: child.props.key || `${child.type}-${ix}`,
                    });
                })}
            </Menu>,
        ]);
    }
}

IconMenu.defaultProps = {
    anchorOrigin: {},
    transformOrigin: {},
    MenuListProps: {},
    style: {},
};

IconMenu.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
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
};

export default IconMenu;
