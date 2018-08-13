import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { GridList, GridTile } from 'material-ui';

export class InfoGrid extends Component {
    render() {
        const styles = {
            title: {
                textAlign: 'center',
                ...this.props.titleStyle,
            },
            item: {
                wordWrap: 'break-word',
                ...this.props.itemStyle,
            },
        };

        return (
            <div>
                <h3 style={styles.title}><strong>{this.props.title}</strong></h3>
                <GridList cellHeight="auto" padding={12}>
                    {this.props.items.map(item => (
                        <GridTile
                            key={item.title}
                            style={styles.item}
                        >
                            <strong>{item.title}:</strong>
                            &nbsp;{item.body}
                        </GridTile>
                    ))}
                </GridList>
            </div>
        );
    }
}

InfoGrid.defaultProps = {
    titleStyle: {},
    itemStyle: {},
};

InfoGrid.propTypes = {
    title: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        body: PropTypes.string,
    })).isRequired,
    titleStyle: PropTypes.object,
    itemStyle: PropTypes.object,
};

export default InfoGrid;
