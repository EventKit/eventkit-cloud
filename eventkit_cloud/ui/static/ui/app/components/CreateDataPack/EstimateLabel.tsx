import { CircularProgress, Typography, withTheme } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { isWidthUp } from '@material-ui/core/withWidth';
import withWidth from '@material-ui/core/withWidth/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import { formatMegaBytes, getDuration } from '../../utils/generic';
import InfoDialog from '../Dialog/InfoDialog';

export interface Props {
    show: boolean;
    step: number;
    sizeEstimate: number;
    timeEstimate: number;
    isCollectingEstimates: boolean;
    exportInfo: Eventkit.Store.ExportInfo;
    width: Breakpoint;
}

function EstimateLabel(props: Props) {
    // function that will return nf (not found) when the provided estimate is undefined
    const get = (estimate, nf = 'unknown') => ((estimate) ? estimate.toString() : nf);
    const {
        step, sizeEstimate, timeEstimate, isCollectingEstimates, exportInfo,
    } = props;

    function areProvidersSelected() {
        return Object.keys(exportInfo.providers).length > 0;
    }

    const isSmallScreen = () => !isWidthUp('sm', props.width);

    function haveUnknownEstimate() {
        const providerSlugs = exportInfo.providers.map((provider) => provider.slug);
        const infoEntries = Object.entries(exportInfo.providerInfo);
        return infoEntries.filter(([slug]) => providerSlugs.indexOf(slug) !== -1).some(
            ([, providerInfo]) => { // leading comma is not a mistake
                if (providerInfo) {
                    const { estimates } = providerInfo;
                    if (estimates) {
                        if (!estimates.time || !estimates.time.value) {
                            return true;
                        }
                        if (!estimates.size || !estimates.size.value) {
                            return true;
                        }
                    } else {
                        return true;
                    }
                }
                return false;
            },
        );
    }

    function checkEstimates() {
        return sizeEstimate > 0 || timeEstimate > 0;
    }

    const [dateString, setDateString] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        const estimateInSeconds = timeEstimate;
        setDuration(getDuration(estimateInSeconds));

        // get the current time, add the estimate (in seconds) to it to get the date time of completion
        const dateEstimate = new Date();
        dateEstimate.setSeconds(dateEstimate.getSeconds() + estimateInSeconds);
        // month of completion in short hand format, upper cased March -> MAR,  January -> JAN
        const monthShort = dateEstimate.toLocaleDateString('default', { month: 'short' }).toUpperCase();
        // Standard time of day based on users locale settings. Options used to omit seconds.
        const timeOfDay = dateEstimate.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
        // Date of completion in the format 1-JAN-2019 12:32 PM
        setDateString(`${dateEstimate.getDate()}-${monthShort}-${dateEstimate.getFullYear()} ${timeOfDay}`);
    }, [timeEstimate]);

    function formatEstimate() {
        if (!areProvidersSelected()) {
            return 'Select providers to get estimate';
        }

        if (isCollectingEstimates) {
            return (
                <span>
                    Getting calculations...
                    <CircularProgress size={25} />
                </span>
            );
        }

        if (checkEstimates()) {
            const sizeString = formatMegaBytes(sizeEstimate);
            const separator = (sizeString && duration) ? ' - ' : '';
            const endingIndicator = haveUnknownEstimate() ? '+' : ''; // If any unknown estimates, add a + char
            if (isSmallScreen()) {
                // Secondary estimate shown in parenthesis (<duration in days hours minutes> - <size>)
                return `${get(duration, '')}${separator}${get(sizeString, 'size unknown')} ${endingIndicator}`;
            }
            // Secondary estimate shown in parenthesis (<duration in days hours minutes> - <size>)
            const secondary = ` ( ${get(duration, '')}${separator}${get(sizeString, 'size unknown')}) ${endingIndicator}`;
            return `${get(dateString)}${get(secondary, '')}`;
        }
        return 'No estimates found';
    }

    if (!props.show || (!areProvidersSelected() && step === 0)) {
        return null;
    }
    return (
        <div style={{
            textAlign: 'center',
            position: 'absolute',
            marginLeft: isSmallScreen() ? '24px' : 'auto',
            marginRight: 'auto',
            left: '0',
            right: isSmallScreen() ? 'auto' : '0',
            bottom: '0',
            marginBottom: '5px',
            pointerEvents: 'none',
        }}
        >

            <div style={{ display: 'inline-flex', marginTop: '-20px' }}>
                <Typography
                    style={{
                        fontSize: '0.9em',
                        color: 'yellow',
                    }}
                >
                    <strong style={{ textAlign: 'center' }}>ETA</strong>: {formatEstimate()}
                </Typography>
                <InfoDialog
                    title="Estimate Information"
                    className="qa-Estimate-Info-Icon"
                    iconProps={{
                        color: 'primary',
                        style: {
                            cursor: 'pointer',
                            verticalAlign: 'middle',
                            marginLeft: '10px',
                            height: '18px',
                            width: '18px',
                            pointerEvents: 'auto',
                        },
                    }}
                >
                    <div
                        id="mainHeading"
                        style={{
                            paddingBottom: '15px',
                            flexWrap: 'wrap',
                        }}
                    >
                        {checkEstimates() ? (
                            <strong>
                                <div>
                                    ETA: {dateString}
                                </div>
                                <div>
                                    Duration: {get(duration, '')}
                                </div>
                                <div>
                                    Size: {get(formatMegaBytes(sizeEstimate), 'size unknown')}
                                </div>
                            </strong>

                        ) : (
                            <div>
                                Please select providers to get an estimate.
                            </div>
                        )}
                    </div>
                    <p>
                        EventKit calculates estimates intelligently by examining previous DataPack jobs. These
                        values
                        represent the sum total estimate for all selected DataSources.
                    </p>
                    <p>Estimates for a Data Source are calculated by looking at the size of and time to complete
                        previous DataPacks
                        created using the specified Data Source(s). These estimates can vary based on
                        availability
                        of
                        data for past jobs and the specified AOI. Larger AOIs will tend to take a longer time to
                        complete
                        and result in larger DataPacks.
                    </p>
                </InfoDialog>
            </div>
        </div>
    );
}

export default withWidth()(withTheme(EstimateLabel));
