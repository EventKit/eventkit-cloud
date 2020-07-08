import * as React from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';
import { PopoverOrigin } from '@material-ui/core/Popover';

export interface Props {
    className?: string;
    children: any;
    value: any;
    anchorOrigin?: {
        vertical: PopoverOrigin['vertical'];
        horizontal: PopoverOrigin['horizontal'];
    };
    transformOrigin?: {
        vertical: PopoverOrigin['vertical'];
        horizontal: PopoverOrigin['horizontal'];
    };
    MenuListProps?: object;
    style?: object;
    underlineStyle?: object;
}

export interface ChildProps {
    onClick: (...args: any) => any;
}

export interface State {
    anchor: null | HTMLElement;
}
export class DropDownMenu extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.state = {
            anchor: null,
        };
    }

    private handleOpen(e: React.MouseEvent<HTMLElement>) {
        this.setState({ anchor: e.currentTarget });
    }

    private handleClose() {
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
                position: 'absolute' as 'absolute',
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
                    {this.props.children.map((child: React.ReactElement<ChildProps>) => {
                        // we need to add in our handle close function for every child onClick
                        if (!React.isValidElement(child)) { return null; }

                        return React.cloneElement(child, {
                            ...child.props,
                            onClick: (...args: any) => {
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

export default DropDownMenu;
