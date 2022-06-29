import logging

from eventkit_cloud.utils.scaling.scale_client import ScaleClient

logger = logging.getLogger(__file__)


class Dummy(ScaleClient):
    """Scale Client Interface"""

    def run_task(self, name, command, disk_in_mb=None, memory_in_mb=None, app_name=None):
        logger.info("Dummy client called with run_task(%s, %s)", name, command)

    def get_running_tasks(self, app_name: str = None, names: str = None) -> dict:
        logger.info("Dummy client called with get_running_tasks(%s, %s)", app_name, names)
        result = {"resources": [], "pagination": {"total_results": 0}}
        return result

    def get_running_tasks_memory(self, app_name: str) -> int:
        logger.info("Dummy client called with get_running_tasks_memory(%s)", app_name)
        return 0

    def terminate_task(self, task_name: str):
        logger.info("Dummy client called with terminate_task(%s)", task_name)
        exit(0)
