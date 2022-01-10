FROM condaforge/linux-anvil-comp7


# Install libgl here so that we can copy it in the eventkit conda build script.
RUN yum -y install mesa-libGL tar wget

COPY ./ /home/conda

CMD ["bash", "./build.sh"]
