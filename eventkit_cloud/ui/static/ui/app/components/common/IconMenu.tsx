import * as React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import NavigationMoreVert from '@material-ui/icons/MoreVert';
import { PopoverOrigin } from '@material-ui/core/Popover';
import { PropTypes } from '@material-ui/core';

export interface Props {
    className?: string;
    children: any;
    anchorOrigin?: {
        vertical: PopoverOrigin['vertical'];
        horizontal: PopoverOrigin['horizontal'];
    };
    transformOrigin?: {
        vertical: PopoverOrigin['vertical'];
        horizontal: PopoverOrigin['horizontal'];
    };
    MenuListProps?: object;
    menuStyle?: object;
    style?: object;
    icon?: React.ReactElement<any>;
    disabled?: boolean;
    color?: PropTypes.Color;
    onOpen?: () => void;
    onClose?: () => void;
}

export interface ChildProps {
    onClick: (...args: any) => any;
}

export interface State {
    anchor: null | HTMLElement;
}

export class IconMenu extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.state = {
            anchor: null,
        };
    }

    private handleOpen(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        if (this.props.onOpen) {
            this.props.onOpen();
        }
        this.setState({ anchor: e.currentTarget });
    }

    private handleClose(e?: React.MouseEvent<HTMLElement>) {
        if (e) {
            e.stopPropagation();
        }
        if (this.props.onClose) {
            this.props.onClose();
        }
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
                {this.props.children.map((child: React.ReactElement<ChildProps>) => {
                    // we need to add in our handle close function for every child onClick

                    if (!React.isValidElement(child)) { return null; }

                    return React.cloneElement(child, {
                        ...child.props,
                        onClick: (e: React.MouseEvent<HTMLElement>, ...args: any) => {
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

export default IconMenu;
