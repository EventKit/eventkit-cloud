import json
import os
import sys

import requests
from ci_utils import run_subprocess


def get_git_sha():
    sha = run_subprocess("git rev-parse HEAD").stdout.decode().strip()
    return sha


def post_status(status, user, token):
    git_sha = get_git_sha()
    r = requests.post(
        f"https://api.github.com/repos/eventkit/eventkit-cloud/statuses/{git_sha}",
        data=json.dumps(status),
        auth=(user, token),
        headers={"accept": "application/vnd.github.v3+json"},
    )
    r.raise_for_status()


def get_status(state, message):
    return {"state": state, "description": message, "context": "ci/gitlab"}


if __name__ == "__main__":
    status = get_status(sys.argv[1], sys.argv[2])
    post_status(status, os.getenv("GITHUB_USER"), os.getenv("GITHUB_TOKEN"))
