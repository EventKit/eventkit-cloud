FROM scratch
ARG MKGMAP_VERSION=r3693
ARG SPLITTER_VERSION=r437
ADD ubuntu-xenial-core-cloudimg-amd64-root.tar.gz /

# a few minor docker-specific tweaks
# see https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap
RUN set -xe \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L40-L48
	&& echo '#!/bin/sh' > /usr/sbin/policy-rc.d \
	&& echo 'exit 101' >> /usr/sbin/policy-rc.d \
	&& chmod +x /usr/sbin/policy-rc.d \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L54-L56
	&& dpkg-divert --local --rename --add /sbin/initctl \
	&& cp -a /usr/sbin/policy-rc.d /sbin/initctl \
	&& sed -i 's/^exit.*/exit 0/' /sbin/initctl \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L71-L78
	&& echo 'force-unsafe-io' > /etc/dpkg/dpkg.cfg.d/docker-apt-speedup \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L85-L105
	&& echo 'DPkg::Post-Invoke { "rm -f /var/cache/apt/archives/*.deb /var/cache/apt/archives/partial/*.deb /var/cache/apt/*.bin || true"; };' > /etc/apt/apt.conf.d/docker-clean \
	&& echo 'APT::Update::Post-Invoke { "rm -f /var/cache/apt/archives/*.deb /var/cache/apt/archives/partial/*.deb /var/cache/apt/*.bin || true"; };' >> /etc/apt/apt.conf.d/docker-clean \
	&& echo 'Dir::Cache::pkgcache ""; Dir::Cache::srcpkgcache "";' >> /etc/apt/apt.conf.d/docker-clean \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L109-L115
	&& echo 'Acquire::Languages "none";' > /etc/apt/apt.conf.d/docker-no-languages \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L118-L130
	&& echo 'Acquire::GzipIndexes "true"; Acquire::CompressionTypes::Order:: "gz";' > /etc/apt/apt.conf.d/docker-gzip-indexes \
	\
# https://github.com/docker/docker/blob/9a9fc01af8fb5d98b8eec0740716226fadb3735c/contrib/mkimage/debootstrap#L134-L151
	&& echo 'Apt::AutoRemove::SuggestsImportant "false";' > /etc/apt/apt.conf.d/docker-autoremove-suggests

# enable the universe
RUN sed -i 's/^#\s*\(deb.*universe\)$/\1/g' /etc/apt/sources.list

RUN export PATH=/usr/local/bin:$PATH
RUN echo "PATH=:$PATH" >> /etc/profile.d/path.sh
RUN groupadd eventkit
RUN useradd -g eventkit eventkit
RUN apt-get update
RUN apt-get -y install python-pip
RUN pip install virtualenv
RUN virtualenv /var/lib/eventkit/.virtualenvs/eventkit

RUN apt-get -y install git libpq-dev python-dev gcc g++ software-properties-common
RUN git clone https://gitlab.com/osm-c-tools/osmctools.git /var/lib/eventkit/osmctools
RUN gcc /var/lib/eventkit/osmctools/src/osmupdate.c -o /var/lib/eventkit/osmctools/osmupdate
RUN gcc /var/lib/eventkit/osmctools/src/osmfilter.c -O3 -o /var/lib/eventkit/osmctools/osmfilter
RUN gcc /var/lib/eventkit/osmctools/src/osmconvert.c -lz -O3 -o /var/lib/eventkit/osmctools/osmconvert
RUN cp /var/lib/eventkit/osmctools/osmupdate /var/lib/eventkit/osmctools/osmfilter /var/lib/eventkit/osmctools/osmconvert /usr/local/bin
RUN rm -fr /var/lib/eventkit/osmctools

RUN add-apt-repository -y ppa:ubuntugis/ubuntugis-unstable
RUN apt-get update
RUN apt-get -y install gdal-bin libgdal-dev libgeos-dev libspatialite-dev libspatialite7 libgeos-c1v5 libsqlite3-mod-spatialite osmctools spatialite-bin libspatialite7 libspatialite-dev default-jre zip unzip

RUN mkdir /var/lib/eventkit/tmp
RUN cd /var/lib/eventkit/tmp
RUN git clone https://gitlab.devops.geointservices.io/eventkit/eventkit-cloud.git /var/lib/eventkit/tmp/eventkit-cloud
RUN cd /var/lib/eventkit/tmp/eventkit-cloud
RUN git checkout 8372-UpdateDockerFile
RUN cp -R /var/lib/eventkit/tmp/eventkit-cloud/* /var/lib/eventkit
RUN apt-get -y install libxml2-dev libxslt-dev
RUN export CPLUS_INCLUDE_PATH=/usr/include/gdal &&\
  export C_INCLUDE_PATH=/usr/include/gdal &&\
  /var/lib/eventkit/.virtualenvs/eventkit/bin/pip install -r /var/lib/eventkit/requirements.txt &&\
  /var/lib/eventkit/.virtualenvs/eventkit/bin/pip install -r /var/lib/eventkit/requirements-dev.txt

RUN mkdir /var/lib/eventkit/exports_stage
RUN mkdir /var/lib/eventkit/exports_download
RUN mkdir /var/lib/eventkit/db_dir
RUN chown eventkit:eventkit -R /var/lib/eventkit/
RUN mkdir /var/log/eventkit

RUN chmod 755 /home
RUN chmod 755 /var/lib/eventkit
RUN chmod 755 /var/lib/eventkit
RUN chmod 775 /var/log/eventkit
RUN chown -R eventkit:eventkit /var/lib/eventkit /var/log/eventkit

EXPOSE 80
RUN rm -rf /var/lib/eventkit/tmp

RUN /var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py collectstatic --noinput
RUN /var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py makemigrations

CMD ["/var/lib/eventkit/.virtualenvs/eventkit/bin/python", "/var/lib/eventkit/manage.py", "runserver", "0.0.0.0:80"]
