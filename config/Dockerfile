FROM cloudfoundry/cflinuxfs2:1.46.0


RUN groupadd -g 880 eventkit && useradd -u 8800 -g 880 -m eventkit && \
    mkdir -p /var/lib/eventkit && chown eventkit:eventkit /var/lib/eventkit

USER eventkit

WORKDIR /var/lib/eventkit

COPY --chown=eventkit ./environment-dev.yml /var/lib/eventkit/environment-dev.yml 
COPY --chown=eventkit ./conda /var/lib/eventkit/conda
COPY --chown=eventkit ./eventkit_cloud /var/lib/eventkit/eventkit_cloud

ENV PATH="/home/eventkit/miniconda2/bin:$PATH"

RUN curl -L https://repo.continuum.io/miniconda/Miniconda2-latest-Linux-x86_64.sh -o miniconda.sh && \
    /bin/bash miniconda.sh -b -p "/home/eventkit/miniconda2" && \
    rm miniconda.sh && \
    echo "y" | conda update -n root --all && \
    conda config --add channels local && \
    conda config --add channels file://var/lib/eventkit/conda/repo

RUN conda env create --file environment-dev.yml

COPY --chown=eventkit ./scripts/wait-for-postgis.sh /var/lib/eventkit/scripts/wait-for-postgis.sh

ENTRYPOINT ["bash", "./scripts/wait-for-postgis.sh"]

CMD ["echo", "This image has no default run command."]
