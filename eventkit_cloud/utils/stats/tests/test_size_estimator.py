import math
import statistics
import time
import json
import logging

from eventkit_cloud.tasks.models import ExportTaskRecord
import eventkit_cloud.utils.stats.size_estimator as estimator
import eventkit_cloud.utils.stats.generator as ek_stats

logger = logging.getLogger(__name__)


def compute_estimator_error(task_limit=None, slugs=None, filename=None):
    """
    Runs the current size estimator against previous completed jobs and computes several error metrics
    :param task_limit: Maximum number of tasks to evaluate
    :param slugs: List of slugs defining provider types to evaluate
    :param filename: A file to write out a per-task CSV of task and error info
    :return:
    """
    # Loop through every job and compute the error of the estimate against the actual
    os = None
    geom_cache = {}
    ek_stats.prefetch_geometry_cache(geom_cache)

    records = ExportTaskRecord.objects.filter(result__isnull=False, status='SUCCESS')
    if slugs is not None:
        records = records.filter(export_provider_task__slug__in=slugs)

    records = records.select_related("result", "export_provider_task__run").all()

    if task_limit is not None:
        records = records[:task_limit]

    try:
        if filename:
            os = open(filename, 'w')
            os.write("job_uid, dptr_uid, etr_uid, slug, area(sq.km), size(mb), estimate(mb)," +
                     "error(mb), error(%), description, bbox\n")

        processed_count = 0
        total_count = records.count()

        raw_diffs = []
        perc_diffs = []
        is_lt = 0
        est_time = 0

        for etr in records:
            if processed_count % 100 == 0:
                logger.info('Processed %d of %d completed', processed_count, total_count)
            processed_count += 1

            try:
                if not ek_stats.has_tiles(etr.name):
                    continue

                dptr = etr.export_provider_task
                run = dptr.run
                bbox = geom_cache[run.id]['bbox']

                start_time = time.time()
                estimate, method = estimator.get_size_estimate_slug(dptr.slug, bbox, srs='4326')
                est_time += (time.time() - start_time)

                actual = etr.result.size
            except ValueError:
                continue

            if os:
                os.write("{}, {}, {}, {}, {}, {}, {}, {}, {}, \"{}\", \"{}\"\n".format(
                    run.job.uid, dptr.uid, etr.uid, dptr.slug, ek_stats.get_area_bbox(bbox), actual, estimate,
                    estimate - actual, 100*abs(estimate-actual)/actual, method, json.dumps(bbox)))

            raw_diffs += [actual - estimate]
            perc_diffs += [abs(actual - estimate)/actual]

            if estimate < actual:
                is_lt += 1
    finally:
        if os:
            os.close()

    if len(raw_diffs) > 0:
        sse = sum(map(lambda e: math.pow(e, 2), raw_diffs))
        return {
            'sum_squared_error': sse,
            'mean_squared_error': sse/len(raw_diffs),
            'mean_percentage_error': 100*sum(perc_diffs)/len(perc_diffs),
            'mean_absolute_error': statistics.mean((map(lambda e: abs(e), raw_diffs))),
            'percent_less_than': 100*is_lt/len(raw_diffs),  # % of estimates that were smaller than actual
            'total_time': est_time,
            'time_per_estimate': est_time / len(raw_diffs),
            'total_tests': len(raw_diffs)
        }
    else:
        return {
            'sum_squared_error': math.nan,
            'mean_squared_error': math.nan,
            'mean_percentage_error': math.nan,
            'mean_absolute_error': math.nan,
            'percent_less_than': 0.0,
            'total_time': 0.0,
            'time_per_estimate': math.nan,
            'total_tests': 0
        }


def perf_benchmark(slug='osm', num_iters=500, seed=None):
    """
    Benchmarks the cost (time) of generating size estimates for a particular provider by invoking
    num_iters requests using a series of random bboxes
    :param slug: The slug of the data provider to benchmark
    :param num_iters: The number of requests to make
    :param seed: The seed to the prng generating bboxes
    :return: total_time and time_per_estimate measured in seconds
    """
    import time
    import random

    random.seed(seed)

    # Make sure stats are there, we want to benchmark only live estimation
    ek_stats.get_statistics('provider_type', False)

    start = time.time()
    for i in range(0, num_iters):
        width = random.random() * 0.1
        height = random.random() * 0.1

        w = random.random() * 340.0 - 170.0  # west coord of lower_left corner
        s = random.random() * 160.0 - 80.0

        estimator.get_size_estimate_slug(slug, [w, s, w + width, s + height], srs='4326')

    end = time.time()
    return {
        "total_time": end - start,
        "time_per_estimate": (end - start) / num_iters
    }
