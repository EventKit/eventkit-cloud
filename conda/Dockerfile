FROM cloudfoundry/cflinuxfs3:0.196.0

WORKDIR /root

ENV PATH="/root/miniconda3/bin:$PATH"

RUN curl -L https://repo.continuum.io/miniconda/Miniconda3-py37_4.8.3-Linux-x86_64.sh -o miniconda.sh && \
    /bin/bash miniconda.sh -b -p $HOME/miniconda3 && \
    rm miniconda.sh && \
    echo 'root=$(pwd -P)' >> /root/.bashrc && \
    export root=$root && \
    echo "y" | conda install python=3.7 && \
    conda config --add channels bioconda && \
    conda config --add channels conda-forge && \
    conda config --add channels local && \
    echo "y" | conda update -n root --all && \
    echo "y" | conda install "conda-build"

COPY ./ /root/

CMD ["bash", "./build.sh"]
