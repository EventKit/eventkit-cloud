FROM ubuntu:jammy-20240530


RUN groupadd -g 880 eventkit && useradd -u 8800 -g 880 -m eventkit && groupadd -g 1001 docker && \
    usermod -a -G docker eventkit && mkdir -p /var/lib/eventkit/config && chown eventkit:eventkit /var/lib/eventkit

RUN apt-get update && apt-get install -y curl

USER eventkit

WORKDIR /var/lib/eventkit

COPY --chown=eventkit ./requirements-dev.txt ./environment.yml ./pytest.ini ./setup.cfg \
                      ./setup.py ./readme.md ./manage.py ./
COPY --chown=eventkit ./conda ./conda
COPY --chown=eventkit ./config ./config

ENV PATH="/home/eventkit/miniforge/envs/conda_env/bin:/home/eventkit/miniforge/bin:$PATH"
ENV CURL_CA_BUNDLE="/var/lib/eventkit/conda/cacert.pem"
ENV REQUESTS_CA_BUNDLE="/var/lib/eventkit/conda/cacert.pem"

# Install Conda
RUN curl -L https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh -o miniforge.sh && \
    /bin/bash miniforge.sh -b -p $HOME/miniforge && \
    rm miniforge.sh && \
    \
    conda config --add channels file://var/lib/eventkit/conda/repo && \
    # TODO: get build to work with strict priority
    conda config --set channel_priority flexible && \
    \
    # Setup certs (might be needed if self-hosting).
    openssl x509 -outform der -in $REQUESTS_CA_BUNDLE -out ./conda/cacert.crt && \
    conda config --set ssl_verify ./conda/cacert.crt && \
    # Create the environment
    conda env create --file ./environment.yml -n conda_env&& \
    pip install -r requirements-dev.txt && \
    SECRET_KEY=temp_secret_key python manage.py collectstatic --no-input && \
    \
    # Clean up.
    conda clean --yes --all && \
    rm -rf ./conda

COPY --chown=eventkit ./eventkit_cloud ./eventkit_cloud

RUN pip install -e .

ENTRYPOINT ["bash", "scripts/wait-for-postgis.sh"]

CMD ["echo", "This image has no default run command."]
