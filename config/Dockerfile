FROM cloudfoundry/cflinuxfs2:1.46.0


RUN groupadd -g 880 eventkit && useradd -u 8800 -g 880 -m eventkit && \
    mkdir -p /var/lib/eventkit && chown eventkit:eventkit /var/lib/eventkit

USER eventkit

WORKDIR /var/lib/eventkit

COPY --chown=eventkit ./requirements-dev.txt /var/lib/eventkit/requirements-dev.txt
COPY --chown=eventkit ./environment-dev.yml /var/lib/eventkit/environment-dev.yml
COPY --chown=eventkit ./conda /var/lib/eventkit/conda

ENV PATH="/home/eventkit/miniconda3/bin:$PATH"

RUN curl -L https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh -o miniconda.sh && \
    /bin/bash miniconda.sh -b -p "/home/eventkit/miniconda3" && \
    rm miniconda.sh && \
    echo "y" | conda update -n root --all && \
    conda config --add channels local && \
    conda config --add channels file://var/lib/eventkit/conda/repo && \
    conda env create --file environment-dev.yml python=3.5 && \
    conda clean --yes --all && \
    /home/eventkit/miniconda3/envs/eventkit-cloud/bin/python \
    /home/eventkit/miniconda3/envs/eventkit-cloud/bin/manage.py collectstatic && \
    rm -rf /var/lib/eventkit/conda

ENTRYPOINT ["bash", "/home/eventkit/miniconda3/envs/eventkit-cloud/lib/python3.5/site-packages/scripts/wait-for-postgis.sh"]

CMD ["echo", "This image has no default run command."]
