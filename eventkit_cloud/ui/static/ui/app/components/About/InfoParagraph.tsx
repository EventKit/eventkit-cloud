export interface Props {
    title: any;
    body: any;
    titleStyle?: object;
    bodyStyle?: object;
}

export const InfoParagraph = (props: Props) => {
    const styles = {
        title: {
            textAlign: 'center' as 'center',
            ...props.titleStyle,
        },
        body: {
            marginBottom: '30px',
            ...props.bodyStyle,
        },
    };

    if (!props.title || !props.body) {
        return null;
    }

    return (
        <div className="qa-InfoParagraph-title">
            <h3 style={styles.title}><strong>{props.title}</strong></h3>
            <div id={props.title} style={styles.body} className="qa-InfoParagraph-body">
                {props.body}
            </div>
        </div>
    );
};

export default InfoParagraph;
