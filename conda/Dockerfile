FROM cloudfoundry/cflinuxfs2:1.46.0

WORKDIR /root

RUN apt-get update && apt-get install -y groff groff-base && \
    curl -L https://repo.continuum.io/miniconda/Miniconda2-latest-Linux-x86_64.sh -o miniconda.sh && \
    /bin/bash miniconda.sh -b -p $HOME/miniconda2 && \
    rm miniconda.sh && \
    echo 'export PATH="$HOME/miniconda2/bin:$PATH"' >> /root/.bashrc && \
    echo 'root=$(pwd -P)' >> /root/.bashrc && \
    export root=$root && \
    export PATH="$HOME/miniconda2/bin:$PATH" && \
    conda install conda-build && conda update conda-build && \
    conda config --add channels local && \
    conda config --add channels conda-forge && \
    conda config --add channels bioconda && \
    echo "y" | conda update -n root --all && \
    conda config --add channels local

COPY ./ /root/

CMD ["bash", "./build.sh"]



