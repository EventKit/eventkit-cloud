FROM cloudfoundry/cflinuxfs3:0.196.0

WORKDIR /root

ENV PATH="/root/miniconda3/bin:$PATH"

# Install libgl here so that we can copy it in the eventkit conda build script.
RUN apt-get update && apt-get install -y libgl1-mesa-glx

RUN curl -L https://repo.continuum.io/miniconda/Miniconda3-py39_4.9.2-Linux-x86_64.sh -o miniconda.sh && \
    /bin/bash miniconda.sh -b -p $HOME/miniconda3 && \
    rm miniconda.sh && \
    echo 'root=$(pwd -P)' >> /root/.bashrc && \
    export root=$root && \
    conda config --remove channels defaults && \
    conda config --add channels conda-forge && \
    conda config --add channels local && \
    echo "y" | conda install python=3.10 && \
    conda init bash && \
    echo "y" | conda install "conda-build=3.21.9"

COPY ./ /root/

CMD ["bash", "./build.sh"]
