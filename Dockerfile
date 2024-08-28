FROM ubuntu:jammy-20240530


RUN groupadd -g 1000 docker && useradd -u 1000 -g 1000 -m eventkit && \
    usermod -a -G docker eventkit && mkdir -p /app/config && chown eventkit:docker /app && \
    mkdir -p /miniforge && chown eventkit:docker /miniforge

RUN apt-get update && apt-get install -y curl

USER eventkit

WORKDIR /app

COPY --chown=eventkit ./requirements-dev.txt ./environment.yml ./pytest.ini ./setup.cfg \
                      ./setup.py ./readme.md ./manage.py ./
COPY --chown=eventkit ./conda ./conda
COPY --chown=eventkit ./config ./config

ENV PATH="/miniforge/envs/conda_env/bin:/miniforge/bin:$PATH"
ENV CURL_CA_BUNDLE="/app/conda/cacert.pem"
ENV REQUESTS_CA_BUNDLE="/app/conda/cacert.pem"

# Install Conda
RUN curl -L https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh -o miniforge.sh && \
    /bin/bash miniforge.sh -b -u -p /miniforge && rm miniforge.sh && \
    \
    conda config --add channels file://app/conda/repo && \
    # TODO: get build to work with strict priority
    conda config --set channel_priority flexible && \
    \
    # Setup certs (might be needed if self-hosting).
    openssl x509 -outform der -in $REQUESTS_CA_BUNDLE -out ./conda/cacert.crt && \
    conda config --set ssl_verify ./conda/cacert.crt && \
    # Create the environment
    conda env create --file ./environment.yml -n conda_env

RUN pip install -r requirements-dev.txt

    # Clean up.
RUN conda clean --yes --all && \
    rm -rf ./conda

COPY --chown=eventkit ./eventkit_cloud ./eventkit_cloud

RUN pip install -e .

CMD ["echo", "This image has no default run command."]
