FROM cloudfoundry/cflinuxfs2:1.46.0

WORKDIR /root

ENV PATH="/root/miniconda3/bin:$PATH"

RUN apt-get update && apt-get install -y groff groff-base libcairo2-dev libpango1.0-dev libgif-dev && \
    curl -L https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh -o miniconda.sh && \
    /bin/bash miniconda.sh -b -p $HOME/miniconda3 && \
    rm miniconda.sh && \
    echo 'root=$(pwd -P)' >> /root/.bashrc && \
    export root=$root && \
    echo "y" | conda install python=3.5 && \
    conda config --add channels local && \
    conda config --add channels conda-forge && \
    conda config --add channels bioconda && \
    echo "y" | conda update -n root --all && \
    # because there is a bug in the latest version when indexing
    echo "y" | conda install --force "conda-build=3.0.9"

COPY ./ /root/

CMD ["bash", "./build.sh"]
