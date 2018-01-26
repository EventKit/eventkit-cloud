import React, { Component, PropTypes } from 'react';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import CircularProgress from 'material-ui/CircularProgress';
import CustomScrollbar from '../CustomScrollbar';

export class GroupsDropDownMenu extends Component {
    constructor(props) {
        super(props);
        this.scrollToTop = this.scrollToTop.bind(this);
    }

    scrollToTop() {
        if (this.props.open && this.scrollbar) {
            this.scrollbar.scrollToTop();
        }
    }

    render() {
        const styles = {
            loadingBackground: {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.05)',
                zIndex: 1001,
            },
            loading: {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
            },
        };

        return (
            <Popover
                style={{ overflowY: 'hidden' }}
                open={this.props.open}
                anchorEl={this.props.anchorEl}
                anchorOrigin={this.props.anchorOrigin}
                targetOrigin={this.props.targetOrigin}
                onRequestClose={this.props.onClose}
                className="qa-GroupsDropDownMenu-Popover"
            >
                {this.props.loading ?
                    <div style={styles.loadingBackground}>
                        <CircularProgress
                            color="#4598bf"
                            style={styles.loading}
                            className="qa-GroupsDropDownMenu-loading"
                        />
                    </div>
                    :
                    null
                }
                <Menu
                    autoWidth={false}
                    style={{ width: this.props.width }}
                    listStyle={{ paddingTop: '0px', paddingBottom: '0px', width: this.props.width }}
                    className="qa-GroupsDropDownMenu-Menu"
                >
                    <CustomScrollbar
                        autoHeight
                        autoHeightMax={300}
                        style={{ maxWidth: this.props.width }}
                        ref={(instance) => { this.scrollbar = instance; }}
                        className="qa-GroupsDropDownMenu-CustomScrollbar"
                    >
                        <div>
                            {this.props.children}
                        </div>
                    </CustomScrollbar>
                </Menu>
            </Popover>
        );
    }
}

GroupsDropDownMenu.defaultProps = {
    loading: false,
    anchorEl: null,
    anchorOrigin: { horizontal: 'right', vertical: 'top' },
    targetOrigin: { horizontal: 'right', vertical: 'top' },
    children: null,
    width: 320,
};

GroupsDropDownMenu.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    anchorEl: PropTypes.object,
    anchorOrigin: PropTypes.shape({
        horizontal: PropTypes.string,
        vertical: PropTypes.string,
    }),
    targetOrigin: PropTypes.shape({
        horizontal: PropTypes.string,
        vertical: PropTypes.string,
    }),
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    width: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
    ]),
};

export default GroupsDropDownMenu;
