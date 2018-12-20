import time
import datetime


def get_eta_estimate(data_provider_task):
    # try:
    #     provider = DataProvider.objects.select_related("export_provider_type").get(slug=data_provider_task.slug)
    # except ObjectDoesNotExist:
    #     raise ValueError("Provider slug '{}' is not valid".format(data_provider_task.slug))
    provider = data_provider_task

    if supports_mapproxy(provider):
        return get_mapproxy_eta_estimate(data_provider_task)
    else:
        return get_default_eta_estimate(data_provider_task)


def supports_mapproxy(provider):
    """
    :param provider: The DataProvider to test
    :return: True if the DataProvider exports a tilegrid of raster data
    """
    type_name = provider.export_provider_type.type_name
    return type_name == 'wms' or type_name == 'wmts' or type_name == 'tms' or "arcgis-raster"


def get_mapproxy_eta_estimate(data_provider_task):
    # TODO: How do we listen to the Seeder's Progress??
    return 0


def get_default_eta_estimate(data_provider_task):
    return 0


class ETA(object):
    def __init__(self):
        self.last_tick_start = time.time()
        self.progress = 0.0
        self.ticks = 10000
        self.tick_duration_sums = 0.0
        self.tick_duration_divisor = 0.0
        self.tick_count = 0

    def update(self, progress):
        self.progress = progress
        missing_ticks = (self.progress * self.ticks) - self.tick_count
        if missing_ticks:
            tick_duration = (time.time() - self.last_tick_start) / missing_ticks

            while missing_ticks > 0:
                # reduce the influence of older measurements
                self.tick_duration_sums *= 0.999
                self.tick_duration_divisor *= 0.999

                self.tick_count += 1

                self.tick_duration_sums += tick_duration
                self.tick_duration_divisor += 1

                missing_ticks -= 1

            self.last_tick_start = time.time()

    def eta_string(self):
        timestamp = self.eta()
        if timestamp is None:
            return 'N/A'
        try:
            return time.strftime('%Y-%m-%d-%H:%M:%S-%Z', time.localtime(timestamp))
        except (ValueError, OSError): # OSError since Py 3.3
            # raised when time is out of range (e.g. year > 2038)
            return 'N/A'

    def eta_datetime(self):
        return datetime.datetime.fromtimestamp(self.eta(), datetime.timezone.utc)

    def eta(self):
        if not self.tick_count:
            return

        remaining_ticks = self.ticks - self.tick_count
        avg_tick_duration = self.tick_duration_sums/self.tick_duration_divisor

        return self.last_tick_start + (avg_tick_duration * remaining_ticks)

    def __str__(self):
        return self.eta_string()
