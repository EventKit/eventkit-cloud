import BaseDialog from "../Dialog/BaseDialog";
import * as React from 'react';
import Button from "@material-ui/core/Button";
import CustomTableRow from "../CustomTableRow";
import moment from "moment";
import CustomTextField from "../CustomTextField";
import {createStyles, Theme, withStyles} from "@material-ui/core";
import {useState} from "react";
import {Dispatch} from "react";
import {SetStateAction} from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    classes: { [className: string]: string };
}

function NoFlexRow(props: React.PropsWithChildren<any>) {
    const passThroughProps = { ...props };
    passThroughProps.children = undefined;
    return (
        <CustomTableRow
            {...passThroughProps}
            dataStyle={{ display: 'block' }}
        >
            {props.children}
        </CustomTableRow>
    );
}

export function RequestDataSource(props: Props) {
    const { open, onClose, classes } = props;

    const [name, setName] = useState(undefined);
    const [url, setUrl] = useState(undefined);
    const [description, setDescription] = useState(undefined);

    function onChange(e: React.ChangeEvent<HTMLInputElement>, setter: Dispatch<SetStateAction<any>>) {
        setter(e.target.value);
    }

    if (!open) {
        return null;
    }
    return (
        <BaseDialog
            show
            title="Request Data Source"
            onClose={onClose}
            actions={[(
                <Button
                    key="close"
                    variant="contained"
                    color="primary"
                    onClick={props.onClose}
                >
                    Submit
                </Button>
            )]}
        >
            <div
                id="mainHeading"
                className={`qa-RequestDataSource-heading ${classes.heading}`}
            >
                Please provide as much detail as possible.
            </div>
            <NoFlexRow
                title="Source name"
            >
                <CustomTextField
                    className={`qa-RequestDataSource-input-name ${classes.textField}`}
                    id="Name"
                    name="sourceName"
                    onChange={(e) => onChange(e, setName)}
                    placeholder="Source Name"
                    InputProps={{ className: classes.input }}
                    fullWidth
                    maxLength={100}
                />
            </NoFlexRow>
            <NoFlexRow
                title="Source Link (URL)"
            >
                <CustomTextField
                    className={`qa-RequestDataSource-input-url ${classes.textField}`}
                    id="url"
                    name="sourceUrl"
                    onChange={(e) => onChange(e, setUrl)}
                    placeholder="Source Name"
                    InputProps={{ className: classes.input }}
                    fullWidth
                    maxLength={256}
                />
            </NoFlexRow>
            <NoFlexRow
                title="Description"
            >
                <CustomTextField
                    className={`qa-RequestDataSource-input-description ${classes.textField}`}
                    id="description"
                    name="sourceDescription"
                    onChange={(e) => onChange(e, setDescription)}
                    placeholder="Source Name"
                    InputProps={{ className: classes.input }}
                    fullWidth
                    maxLength={1000}
                />
            </NoFlexRow>
        </BaseDialog>
    );
}

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    textField: {
        backgroundColor: theme.eventkit.colors.secondary,
    },
    input: {
        fontSize: '16px',
        paddingLeft: '5px',
        paddingRight: '50px',
    },
    heading: {
        fontSize: '18px',
        fontWeight: 'bold',
        paddingBottom: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        lineHeight: '25px',
    },
});


export default withStyles(jss)(RequestDataSource);
