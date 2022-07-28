import abc
from typing import Optional

from eventkit_cloud.utils.scaling import types as scale_types


class ScaleClient(abc.ABC):
    """Scale Client Interface"""

    def run_task(
        self,
        name: str,
        command: str,
        disk_in_mb: Optional[int] = None,
        memory_in_mb: Optional[int] = None,
        app_name: Optional[str] = None,
    ) -> scale_types.TaskResource:
        pass

    def get_running_tasks(self, app_name: str = None, names: str = None) -> scale_types.ListTaskResponse:
        pass

    def get_running_tasks_memory(self, app_name: str) -> int:
        pass

    def terminate_task(self, task_name: str):
        pass
