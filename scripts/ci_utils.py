import json
import logging
import os
import subprocess
from concurrent.futures import ALL_COMPLETED, ThreadPoolExecutor, wait

import requests
import yaml

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


def run_subprocess(command, shell=True, cwd=None):
    current_working_directory = cwd or os.getcwd()
    try:
        result = subprocess.run(
            command,
            shell=shell,
            cwd=current_working_directory,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )
        return result
    except subprocess.CalledProcessError as cpe:
        logger.error("There was an error calling %s", command)
        logger.error(f"Called from: {current_working_directory}")
        logger.error(f"stdout: {cpe.stdout}")
        logger.error(f"stderr: {cpe.stderr}")
        raise cpe


def pull_and_rename_docker_image(image: str):
    image_name, image_tag = image.split(":")
    logger.info(f"Pulling image {image}")
    run_subprocess(
        f"docker login -u {os.getenv('CI_REGISTRY_USER')} -p {os.getenv('CI_REGISTRY_PASSWORD')} {os.getenv('CI_REGISTRY')} && docker pull {os.getenv('CI_REGISTRY_PATH').rstrip('/')}/{image_name}:{image_tag}"
    )
    run_subprocess(
        f"docker tag {os.getenv('CI_REGISTRY_PATH').rstrip('/')}/{image_name}:{image_tag} {image_name}:{image_tag}"
    )
    logger.info(f"Locally tagged {image}")


def setup_eventkit():
    logger.info("Pulling images...")
    run_subprocess("cp /etc/ssl/certs/cacert.pem ./conda/cacert.pem")
    with open("docker-compose.yml", "r") as _docker_compose_file:
        docker_compose = yaml.safe_load(_docker_compose_file)
    if not docker_compose:
        raise Exception("Could not load docker-compose file.")
    images = list(set([service["image"] for name, service in docker_compose["services"].items()]))
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(pull_and_rename_docker_image, image) for image in images]
        wait(futures, return_when=ALL_COMPLETED)


if __name__ == "__main__":
    setup_eventkit()
