import time
import datetime


class ETA(object):
    """
    Generates an estimate time for completion of an abstract task based on the rate of progress. As update is called
    this class will track how fast a task is progressing and then extrapolate to determine a completion time. This
    assumes that progression is smoothly defined and that the rate of progress is also smooth.

    Based on mapproxy implementation for ETA
    """
    def __init__(self, task_uid=None, start_time=time.time(), debug_os=None):
        self.task_uid = task_uid
        self.start_time = start_time
        self.last_tick_start = start_time
        self.progress = 0.0
        self.ticks = 10000
        self.tick_duration_sums = 0.0
        self.tick_duration_divisor = 0.0
        self.tick_count = 0
        self.debug_os = debug_os

        if self.debug_os is not None:
            self.debug_os.write('task_uid, progress, elapsed_time(sec), timestamp, est_finish,'
                                'timestamp_utc, est_finish_utc, message\n')

    def update(self, progress, dbg_msg=''):
        """
        :param progress: A percentage in decimal [0.0-1.0]
        :param dbg_msg: Text written to the "message" column of the debug csv, iff debug_os != None
        """
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

        if self.debug_os is not None:
            curr_time = time.time()
            self.debug_os.write('{}, {}, {}, {}, {}, {}, {}, {}\n'.format(
                                self.task_uid, self.progress, self.elapsed_time(current_time=curr_time),
                                curr_time, self.eta(),
                                datetime.datetime.fromtimestamp(curr_time, datetime.timezone.utc), self.eta_datetime(),
                                dbg_msg))

    def eta_string(self):
        """
        :return: String representation (e.g. 2018-12-21-21:23:31-UTC), or 'N/A' if no current estimate
        """
        timestamp = self.eta()
        if timestamp is None:
            return 'N/A'
        try:
            return time.strftime('%Y-%m-%d-%H:%M:%S-%Z', time.localtime(timestamp))
        except (ValueError, OSError): # OSError since Py 3.3
            # raised when time is out of range (e.g. year > 2038)
            return 'N/A'

    def eta_datetime(self):
        """
        :return: ETA represented as a datetime object, or None if no current estimate
        """
        timestamp = self.eta()
        if timestamp is None:
            return

        return datetime.datetime.fromtimestamp(self.eta(), datetime.timezone.utc)

    def eta(self):
        """
        :return: ETA represented as float defined by Python's time module, or None if no current estimate
        """
        if not self.tick_count:
            return

        remaining_ticks = self.ticks - self.tick_count
        avg_tick_duration = self.tick_duration_sums/self.tick_duration_divisor

        return self.last_tick_start + (avg_tick_duration * remaining_ticks)

    def elapsed_time(self, current_time=time.time()):
        """
        :return: The amount of time that has passed since the ETA starting time in seconds
        """
        return current_time - self.start_time

    def __str__(self):
        """
        :return: See eta_string
        """
        return self.eta_string()
