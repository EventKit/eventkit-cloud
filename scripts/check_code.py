import subprocess
import sys
from concurrent import futures


def check_code():
    commands = [
                "docker-compose run --rm -T eventkit black --check --diff eventkit_cloud\n",
                "docker-compose run --rm -T eventkit flake8 eventkit_cloud\n",
                "docker-compose run --rm -T eventkit mypy eventkit_cloud\n",
                "docker-compose run --rm -T eventkit isort --check eventkit_cloud\n",
                "docker-compose run --rm -T -e COVERAGE=True -e COVERAGE_THRESHOLD=70 eventkit python manage.py test eventkit_cloud\n",
                "docker-compose run --rm -T webpack npm test\n"
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
    futures.wait(futures_list)

    results = [ftr.result() for ftr in futures_list]
    for result in results:
        if result.returncode:
            print(f"The command: {result.args} failed with code: {result.returncode}...")
            if result.stdout:
                sys.stdout.write(result.stdout.decode())
            if result.stderr:
                sys.stderr.write(result.stderr.decode())


if __name__ == "__main__":
    check_code()
