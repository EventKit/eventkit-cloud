import subprocess
import sys
from concurrent import futures


def check_code():
    commands = [
                "docker-compose run --rm -T eventkit black --check --diff eventkit_cloud",
                "docker-compose run --rm -T eventkit flake8 eventkit_cloud",
                "docker-compose run --rm -T eventkit mypy eventkit_cloud",
                "docker-compose run --rm -T eventkit isort --check eventkit_cloud",
                "docker-compose run --rm -T -e COVERAGE=True -e COVERAGE_THRESHOLD=70 eventkit python manage.py test --noinput eventkit_cloud",
                "docker-compose run --rm -T webpack npm test"
                ]

    executor = futures.ThreadPoolExecutor()

    futures_list = [
        executor.submit(
            subprocess.run,
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True
        )
        for command in commands
    ]

    exit_code = 0
    while futures_list:
        finished_futures = []
        for index, future in enumerate(futures_list):
            if future.done():
                result = future.result()
                if result.returncode:
                    exit_code = 1
                    print(f"The command: {result.args} failed with code: {result.returncode}...")
                    if result.stdout:
                        sys.stdout.write(result.stdout.decode())
                    if result.stderr:
                        sys.stderr.write(result.stderr.decode())
                else:
                    print(f"The command: {result.args} completed successfully.")
                finished_futures.append(index)
        for finished_future_index in finished_futures:
            futures_list.pop(finished_future_index)
    if exit_code:
        print("There were failures in the tests.")
    exit(exit_code)


if __name__ == "__main__":
    check_code()
