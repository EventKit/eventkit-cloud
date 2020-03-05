
import React  from 'react';
import {createStyles, Theme, withTheme, withStyles} from '@material-ui/core/styles';
import { MenuItem } from 'react-bootstrap-typeahead';
import ActionRoom from '@material-ui/icons/Room';
import IrregularPolygon from '../icons/IrregularPolygon';;

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    icon: {
        height: '40px',
        width: '40px',
        padding: '0px',
        verticalAlign: 'middle',
        color: theme.eventkit.colors.text_primary,
    },
    iconDiv: {
        width: '45px',
    },
    text: {
        color: theme.eventkit.colors.text_primary,
        minHeight: '20px',
        whiteSpace: 'normal',
    },
    source: {
        color: theme.eventkit.colors.text_primary,
        background: theme.eventkit.colors.secondary,
        padding: '1px 4px',
        borderRadius: '2px',
    },
});


interface Props {
    result: any;
    index: number;
    theme: any;
    classes: { [className: string]: string; }
}

export function TypeaheadMenuItem(props: Props) {
    function createDescription(result: any) {
        const description = [];
        if (result.province) description.push(result.province);
        if (result.region) description.push(result.region);
        if (result.country) description.push(result.country);
        return description.join(', ');
    }

    const { result, index, classes } = props;
    const source = (result) ? result.source : '';

    let icon = null;
    if (result && result.geometry && result.geometry.type) {
        icon = result.geometry.type === 'Point'
            ? <ActionRoom className={`qa-TypeaheadMenuItem-ActionRoom ${classes.icon}`} />
            : <IrregularPolygon className={`qa-TypeaheadMenuItem-IrregularPolygon ${classes.icon}`} />;
    }

    return (
        <MenuItem
            option={result}
            position={index}
            className="menuItem"
        >
            <div className="row">
                <div className={`qa-TypeaheadMenuItem-icon-div ${classes.iconDiv}`}>
                    {icon}
                </div>
                <div style={{ flex: '1' }}>
                    <div className={`qa-TypeaheadMenuItem-name ${classes.text}`}>
                        <strong>{result.name}</strong>
                    </div>
                    <div className={`qa-TypeaheadMenuItem-description ${classes.text}`}>
                        {createDescription(result)}
                    </div>
                </div>
                { !!result.source && (
                    <div style={{ paddingLeft: '6px' }}>
                        <strong className={`qa-TypeaheadMenuItem-source ${classes.source}`}>
                            {source}
                        </strong>
                    </div>
                )}
            </div>
        </MenuItem>
    );
}

export default withTheme()(withStyles<any, any>(jss)(TypeaheadMenuItem));
