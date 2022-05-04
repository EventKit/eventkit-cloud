import ImageList from '@mui/material/ImageList';
import DataPackGridItem from './DataPackGridItem';
import CustomScrollbar from '../common/CustomScrollbar';
import LoadButtons from '../common/LoadButtons';
import { Breakpoint } from '@mui/material/styles';
import {useEffect, useState} from "react";
import useMediaQuery from '@mui/material/useMediaQuery';

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;

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
        if (!useMediaQuery(this.props.theme.breakpoints.up('md'))) {
            return 2;
        } else if (useMediaQuery(this.props.theme.breakpoints.up('xl'))) {
            return 4;
        }
        return 3;
    }


    const spacing = useMediaQuery(this.props.theme.breakpoints.up('sm')) ? '10px' : '2px';
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
                <ImageList
                    className="qa-DataPackGrid-ImageList"
                    rowHeight="auto"
                    style={styles.gridList}
                    gap={useMediaQuery(this.props.theme.breakpoints.up('md')) ? 7 : 2}
                    cols={getColumns()}
                >
                    {props.runIds.map((id, index) => (
                        <DataPackGridItem
                            className="qa-DataPackGrid-ImageListItem"
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
                </ImageList>
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
