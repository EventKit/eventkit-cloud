import * as React from 'react';
import withWidth, {isWidthUp} from '@material-ui/core/withWidth';
import GridList from '@material-ui/core/GridList';
import DataPackGridItem from './DataPackGridItem';
import CustomScrollbar from '../common/CustomScrollbar';
import LoadButtons from '../common/LoadButtons';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import {useEffect, useState} from "react";

export interface Props {
    runIds: string[];
    user: Eventkit.Store.User;
    onRunDelete: () => void;
    onRunShare: () => void;
    providers: Eventkit.Provider[];
    range: string;
    handleLoadPrevious: () => void;
    handleLoadNext: () => void;
    loadPreviousDisabled: boolean;
    loadNextDisabled: boolean;
    name: string;
    width: Breakpoint;
    setScrollbar?: (ref: any) => void;
}

export function DataPackGrid(props: Props) {

    const [scrollbar, setScrollbar] = useState(undefined);
    useEffect(() => {
        if (!!scrollbar) {
            props.setScrollbar(scrollbar);
        }
    }, [scrollbar]);

    function getColumns() {
        if (!isWidthUp('md', props.width)) {
            return 2;
        } else if (isWidthUp('xl', props.width)) {
            return 4;
        }
        return 3;
    }


    const spacing = isWidthUp('sm', props.width) ? '10px' : '2px';
    const styles = {
        root: {
            display: 'flex',
            flexWrap: 'wrap' as 'wrap',
            justifyContent: 'space-around',
            marginLeft: spacing,
            marginRight: spacing,
            paddingBottom: spacing,
        },
        gridList: {
            border: '1px',
            width: '100%',
            margin: '0px',
            height: 'auto',
        },
    };

    return (
        <CustomScrollbar
            ref={(instance) => {
                setScrollbar(instance);
            }}
            style={{height: 'calc(100vh - 236px)', width: '100%'}}
        >
            <div style={styles.root} className="qa-div-root">
                <GridList
                    className="qa-DataPackGrid-GridList"
                    cellHeight="auto"
                    style={styles.gridList}
                    spacing={isWidthUp('md', props.width) ? 7 : 2}
                    cols={getColumns()}
                >
                    {props.runIds.map((id, index) => (
                        <DataPackGridItem
                            className="qa-DataPackGrid-GridListItem"
                            runId={id}
                            userData={props.user.data}
                            key={id}
                            onRunDelete={props.onRunDelete}
                            onRunShare={props.onRunShare}
                            providers={props.providers}
                            gridName={props.name}
                            index={index}
                            showFeaturedFlag
                        />
                    ))}
                </GridList>
            </div>
            <LoadButtons
                range={props.range}
                handleLoadPrevious={props.handleLoadPrevious}
                handleLoadNext={props.handleLoadNext}
                loadPreviousDisabled={props.loadPreviousDisabled}
                loadNextDisabled={props.loadNextDisabled}
            />
        </CustomScrollbar>
    )
}


export default withWidth()((DataPackGrid));
