import GridList from '@material-ui/core/GridList';
import GridTile from '@material-ui/core/GridListTile';

export interface Props {
    title: any;
    items: Array<{
        title: string;
        body: string;
    }>;
    titleStyle?: object;
    itemStyle?: object;
}

export const InfoGrid = (props: Props) => {
    const styles = {
        title: {
            textAlign: 'center' as 'center',
            ...props.titleStyle,
        },
        item: {
            wordWrap: 'break-word' as 'break-word',
            ...props.itemStyle,
        },
    };

    return (
        <div>
            <h3 style={styles.title}><strong>{props.title}</strong></h3>
            <GridList cellHeight="auto" spacing={12}>
                {props.items.map(item => (
                    <GridTile
                        key={item.title}
                        style={styles.item}
                    >
                        <strong>{item.title}:&nbsp;</strong>
                        <span>{item.body}</span>
                    </GridTile>
                ))}
            </GridList>
        </div>
    );
};

export default InfoGrid;
