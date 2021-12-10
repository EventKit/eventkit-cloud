FROM condaforge/linux-anvil-comp7

#ENV PATH="/root/miniconda3/bin:$PATH"

# Install libgl here so that we can copy it in the eventkit conda build script.
# RUN yum install mesa-libGL

#RUN curl -L https://repo.continuum.io/miniconda/Miniconda3-py37_4.9.2-Linux-x86_64.sh -o miniconda.sh && \
#    /bin/bash miniconda.sh -b -p $HOME/miniconda3 && \
##    rm miniconda.sh && \
#RUN echo 'root=$(pwd -P)' >> /root/.bashrc && \
#    export root=$root  # && \
#    echo "y" | conda install python=3.9 && \
#    conda config --add channels bioconda && \
#    conda config --add channels conda-forge && \
#    conda config --add channels local && \
#    echo "y" | conda update -n root --all && \
#    echo "y" | conda install "conda-build" "mamba"

COPY ./ /home/conda

CMD ["bash", "./build.sh"]
