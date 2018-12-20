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
        e.stopPropagation();
        this.props.onOpen();
        this.setState({ anchor: e.currentTarget });
    }

    handleClose(e) {
        if (e) e.stopPropagation();
        this.props.onClose();
        this.setState({ anchor: null });
    }

    render() {
        return ([
            <IconButton
                key="button"
                className={this.props.className || 'qa-IconMenu-IconButton'}
                style={{
                    width: '36px',
                    height: '36px',
                    verticalAlign: 'initial',
                    ...this.props.style,
                }}
                onClick={this.handleOpen}
                disabled={this.props.disabled}
                color={this.props.color}
            >
                {this.props.icon || <NavigationMoreVert className="qa-IconMenu-icon" color="primary" />}
            </IconButton>,
            <Menu
                key="menu"
                className="qa-IconMenu-Menu"
                anchorEl={this.state.anchor}
                open={Boolean(this.state.anchor)}
                onClose={this.handleClose}
                getContentAnchorEl={undefined}
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
                style={this.props.menuStyle}
            >
                {this.props.children.map((child) => {
                    // we need to add in our handle close function for every child onClick

                    if (!React.isValidElement(child)) { return null; }

                    return React.cloneElement(child, {
                        ...child.props,
                        onClick: (e, ...args) => {
                            e.stopPropagation();
                            this.handleClose();
                            child.props.onClick(e, ...args);
                        },
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
    menuStyle: {},
    style: {},
    icon: undefined,
    disabled: false,
    color: undefined,
    className: undefined,
    onOpen: () => {},
    onClose: () => {},
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
    menuStyle: PropTypes.object,
    style: PropTypes.object,
    icon: PropTypes.node,
    disabled: PropTypes.bool,
    color: PropTypes.string,
    className: PropTypes.string,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
};

export default IconMenu;
