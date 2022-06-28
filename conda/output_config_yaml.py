import os
import re
import subprocess
import sys

import yaml


def dump_conda_config_yaml(output_dir='.', requirements_file=None):
    """
    This function inspects the conda list for files that aren't local (i.e. file) and downloads them to the output dir.
    :return: None
    """
    requirements_deps = {}
    if requirements_file:
        if os.path.isfile(requirements_file):
            with open(requirements_file, 'r') as req_file:
                for line in req_file.readlines():
                    dep_split = line.split("==")
                    if not dep_split:
                        continue
                    dep_name = dep_split[0].replace("-", "_").strip()
                    if len(dep_split) == 1:
                        requirements_deps[dep_name] = None
                    else:
                        requirements_deps[dep_name] = f"=={dep_split[1].strip()}"
        else:
            raise Exception("No requirement found at %s", requirements_file)
    installed_deps = {}
    config_file_path = os.path.join(output_dir, "conda_build_config.yaml")
    if os.path.isfile(config_file_path):
        print(f"Updating file at {config_file_path}")
        with open(config_file_path, 'r') as config_file:
            installed_deps = yaml.safe_load(config_file.read())
    else:
        print(f"No existing conda_build_config.yaml found at {config_file_path}")
    conda_list_cmd = "conda list"
    result_list = subprocess.run(conda_list_cmd, shell=True, stdout=subprocess.PIPE)
    installed_deps.update(
        # Conda doesn't allow '-' so just sub it out, it is likely not a conda dep anyway.
        {dep['name'].replace("-", "_").replace(".", "_"): [f"{dep['version']}"] for dep in
         clean_output(clean_stdout(result_list.stdout, "\n"))})
    # Ensure the specified requirements are used.
    for req_name, req_version in requirements_deps.items():
        if req_version:
            installed_deps[req_name] = req_version
    with open(config_file_path, 'w') as config_file:
        yaml.dump(installed_deps, config_file)


def clean_output(output):
    objects = []
    lines = [re.split(r'\s+', line) for line in output[0:]]
    fields = {}
    # This may need to change if some request doesn't have a name column.
    while lines and "name" not in fields:
        fields = [field.strip().lower() for field in lines.pop(0)]
    # Get rid of random # from output
    fields = fields[1:]
    for line in lines:
        objects.append(dict(zip(fields, line)))
    return objects


def clean_stdout(text: bytes, split: str = None):
    cleaned_text = text.decode().strip()
    if split:
        cleaned_text = [value.strip() for value in cleaned_text.split(split) if value]
    return cleaned_text


if __name__ == "__main__":
    file_path = "."
    requirements_file = None
    if len(sys.argv) == 2:
        file_path = sys.argv[1]
    if len(sys.argv) == 3:
        requirements_file = sys.argv[2]
    dump_conda_config_yaml(file_path, requirements_file)
