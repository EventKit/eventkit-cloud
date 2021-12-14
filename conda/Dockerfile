FROM condaforge/linux-anvil-comp7

#ENV PATH="/root/miniconda3/bin:$PATH"

# Install libgl here so that we can copy it in the eventkit conda build script.
RUN yum -y install mesa-libGL tar wget

RUN source /opt/conda/etc/profile.d/conda.sh && \
    conda activate && \
    conda update conda && \
    conda config --add channels bioconda && \
    conda config --add channels conda-forge && \
    conda config --add channels local && \
    echo "y" | conda install "conda-build" "mamba" && \
    conda clean -tiy && \
    rm -rf /opt/conda/pkgs

COPY ./ /home/conda

CMD ["bash", "./build.sh"]
