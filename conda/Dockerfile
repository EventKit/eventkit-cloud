FROM cloudfoundry/cflinuxfs3:0.196.0

WORKDIR /root

ENV PATH="/root/miniconda3/bin:$PATH"

# Install libgl here so that we can copy it in the eventkit conda build script.
RUN apt-get update && apt-get install -y libgl1-mesa-glx

ENV PATH="$HOME/miniconda3:$PATH"

RUN curl -L https://repo.continuum.io/miniconda/Miniconda3-py39_4.12.0-Linux-x86_64.sh -o miniconda.sh && \
    /bin/bash miniconda.sh -b -p $HOME/miniconda3 && \
    rm miniconda.sh && \
    echo 'root=$(pwd -P)' >> /root/.bashrc && \
    export root=$root && \
    conda config --remove channels defaults && \
    conda config --add channels conda-forge && \
    conda config --add channels local && \
    echo "y" | conda install python=3.10 && \
    conda init bash && \
    echo "y" | conda install "conda-build=3.22.0"

COPY ./ /root/

# Setup certs (might be needed if self-hosting).
ENV CURL_CA_BUNDLE="/root/cacert.pem"
ENV REQUESTS_CA_BUNDLE="/root/cacert.pem"
RUN openssl x509 -outform der -in $REQUESTS_CA_BUNDLE -out /root/cacert.crt && \
    conda config --set ssl_verify /root/cacert.crt

CMD ["bash", "./build.sh"]
