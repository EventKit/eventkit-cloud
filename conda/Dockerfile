FROM ubuntu:jammy-20240530

WORKDIR /root

ENV PATH="/root/miniforge/bin:$PATH"

# Install libgl here so that we can copy it in the eventkit conda build script.
RUN apt-get update && apt-get install -y libgl1-mesa-glx curl

ENV PATH="$HOME/miniforge:$PATH"

RUN curl -L https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh -o miniforge.sh && \
    /bin/bash miniforge.sh -b -p $HOME/miniforge && \
    rm miniforge.sh && \
    echo 'root=$(pwd -P)' >> /root/.bashrc && \
    export root=$root && \
    conda config --add channels conda-forge && \
    conda config --add channels local && \
    echo "y" | conda install python=3.10 && \
    conda init bash && \
    echo "y" | conda install "conda-build"

COPY ./ /root/

# Setup certs (might be needed if self-hosting).
ENV CURL_CA_BUNDLE="/root/cacert.pem"
ENV REQUESTS_CA_BUNDLE="/root/cacert.pem"
RUN openssl x509 -outform der -in $REQUESTS_CA_BUNDLE -out /root/cacert.crt && \
    conda config --set ssl_verify /root/cacert.crt

CMD ["bash", "./build.sh"]
