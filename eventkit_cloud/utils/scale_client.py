import abc


class ScaleClient(abc.ABC):
    """Scale Client Interface"""

    def run_task(self, name, command, disk_in_mb=None, memory_in_mb=None, app_name=None):
        pass

    def get_running_tasks(self, app_name: str = None, names: str = None) -> dict:
        pass

    def get_running_tasks_memory(self, app_name: str) -> int:
        pass
