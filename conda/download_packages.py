import requests
import subprocess
import os


def download_packages(output_dir='.'):
    """
    This function inspects the conda list for files that aren't local (i.e. file) and downloads them to the output dir.
    :return: None
    """
    conda_list_cmd = "conda list --explicit"
    result_list = subprocess.Popen(conda_list_cmd, shell=True, stdout=subprocess.PIPE)
    for line in result_list.stdout:
        package = line.decode().rstrip("\n")
        if package.startswith("https://"):
            file_output = os.path.join(output_dir, os.path.basename(package))
            print(f"Downloading {package} to {file_output}")
            response = requests.get(package, allow_redirects=True, stream=True)
            with open(file_output, 'wb') as fd:
                for chunk in response.iter_content(chunk_size=256):
                    fd.write(chunk)

if __name__ == "__main__":
    download_packages()