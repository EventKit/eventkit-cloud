import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CustomScrollbar from '../CustomScrollbar';

export class UserLicense extends Component {
    constructor(props) {
        super(props);
        this.handleToggle = this.handleToggle.bind(this);
        this.state = { expanded: false };
    }

    handleToggle() {
        this.setState(state => ({ expanded: !state.expanded }));
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            card: {
                boxShadow: 'none',
                marginBottom: '10px',
                border: this.props.checked ? `1px solid ${colors.secondary}` : `1px solid ${colors.warning}`,
            },
            checkbox: {
                width: '24px',
                height: '24px',
                verticalAlign: 'middle',
                marginRight: '10px',
            },
            cardText: {
                border: `2px solid ${colors.secondary}`,
                padding: '0px',
            },
            expand: {
                width: '24px',
                height: '24px',
                float: 'right',
                transform: 'rotate(0deg)',
                transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            },
        };

        if (this.state.expanded) {
            styles.expand.transform = 'rotate(180deg)';
        }

        return (
            <Card
                className="qa-UserLicense-Card"
                style={styles.card}
            >
                <CardHeader
                    className="qa-UserLicense-CardHeader"
                    style={{ backgroundColor: colors.secondary, padding: '16px' }}
                    title={
                        <div>
                            <Checkbox
                                className="qa-UserLicense-Checkbox"
                                style={styles.checkbox}
                                checked={this.props.checked}
                                onChange={(e, v) => { this.props.onCheck(this.props.license.slug, v); }}
                                color="primary"
                                disabled={this.props.disabled}
                            />
                            <span className="qa-UserLicense-agreement" style={{ lineHeight: '24px' }}>
                                {'I agree to the '}<strong>{this.props.license.name}</strong>
                            </span>
                            <IconButton
                                onClick={this.handleToggle}
                                color="primary"
                                style={styles.expand}
                                className="qa-UserLicense-expand"
                            >
                                <ExpandMoreIcon />
                            </IconButton>
                        </div>
                    }
                />
                <Collapse in={this.state.expanded}>
                    <CardContent className="qa-UserLicense-CardText" style={styles.cardText}>
                        <CustomScrollbar style={{ height: '200px', width: '100%' }}>
                            <div className="qa-UserLicense-licenseText" style={{ padding: '16px', whiteSpace: 'pre-wrap' }}>
                                <a href={`/api/licenses/${this.props.license.slug}/download`}>- Download this license text -</a>
                                <br />
                                <br />
                                {this.props.license.text}
                            </div>
                        </CustomScrollbar>
                    </CardContent>
                </Collapse>
            </Card>
        );
    }
}

UserLicense.propTypes = {
    license: PropTypes.shape({
        slug: PropTypes.string,
        name: PropTypes.string,
        text: PropTypes.string,
    }).isRequired,
    checked: PropTypes.bool.isRequired,
    onCheck: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(UserLicense);
