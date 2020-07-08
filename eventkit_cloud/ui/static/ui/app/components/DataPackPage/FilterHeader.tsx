import * as React from 'react';
import Button from '@material-ui/core/Button';

export interface Props {
    onApply: () => void;
    onClear: () => void;
}

export class FilterHeader extends React.Component<Props, {}> {
    render() {
        const styles = {
            drawerHeader: {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                paddingLeft: '10px',
                paddingRight: '10px',
                paddingBottom: '5px',
            },
        };
        return (
            <div className="qa-FilterHeader-div" style={styles.drawerHeader}>
                <Button
                    className="qa-FilterHeader-Button-apply"
                    style={{ minWidth: 'none', borderRadius: '0px', textTransform: 'none' }}
                    color="primary"
                    variant="contained"
                    onClick={this.props.onApply}
                >
                    Apply
                </Button>
                <Button
                    className="qa-FilterHeader-Button-clear"
                    style={{ minWidth: 'none', textTransform: 'none' }}
                    color="primary"
                    variant="text"
                    onClick={this.props.onClear}
                >
                    Clear All
                </Button>
            </div>
        );
    }
}

export default FilterHeader;
