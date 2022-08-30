ifeq ($(OS),Windows_NT)     # is Windows_NT on XP, 2000, 7, Vista, 10...
    detected_OS := Windows
else
    detected_OS := $(shell uname 2>/dev/null || echo Unknown)
endif

black:
	docker-compose run --rm eventkit black --check --diff eventkit_cloud

black-format:
	docker-compose run --rm eventkit black eventkit_cloud

flake8:
	docker-compose run --rm eventkit flake8 eventkit_cloud

mypy:
	docker-compose run --rm eventkit mypy eventkit_cloud

isort:
	docker-compose run --rm eventkit isort --check eventkit_cloud

isort-format:
	docker-compose run --rm eventkit isort eventkit_cloud

lint: black flake8 isort mypy

test-back:
	docker-compose run --rm -e COVERAGE=True eventkit python manage.py test -v 3 eventkit_cloud

test-front:
	docker-compose run --rm webpack npm test

test: test-back test-front

install-hooks:
ifeq ($(detected_OS),Windows)
	cp hooks/pre-commit .git/hooks/pre-commit
else
	ln -s -f ${CURDIR}/hooks/pre-commit ${CURDIR}/.git/hooks/pre-commit
endif

initial:
ifeq ($(detected_OS),Linux)
	sudo groupadd -g 880 eventkit || echo "Group eventkit already exists."
	sudo useradd -u 8800 -g 880 -m eventkit || echo "User eventkit already exists."
	sudo usermod -a -G eventkit ${USER}
	sudo chown -R ${USER}:eventkit .
	sudo chmod -R g+rw .
endif

# Only run this command if you want to completely rebuild your conda dependencies.
conda-install:
	cd conda && docker-compose build --no-cache
	cd conda && docker-compose run --rm conda

# Run this command if you want to rebuild all of your docker images.
build:
ifeq ($(detected_OS),Linux)
	echo $(detected_OS)
	sudo chmod -R g+rw .
	docker-compose build --no-cache
else
	docker-compose build --no-cache
endif

# This command will migrate your database, setup caches and load initial data.
setup:
ifeq ($(detected_OS),Linux)
	sudo chmod -R g+rw .
	mkdir -p exports_stage && sudo chown eventkit:eventkit exports_stage
	mkdir -p coverage && sudo chown eventkit:eventkit coverage
	docker-compose run --rm eventkit python manage.py runinitial setup
else
	docker-compose run --rm eventkit python manage.py runinitial setup
endif

up:
	docker-compose up -d

down:
	docker-compose down --remove-orphans

restart:
	docker-compose restart

# Runs the more commonly used logs.
logs:
	docker-compose logs -f celery eventkit webpack

# Runs all of the logs for all containers.
logs-verbose:
	docker-compose logs -f

# All of the commands below this line are destructive and will completely remove your current development environment.

clean:
	docker-compose down -v

# This is the command that you'll want to use in order to setup from scratch.
fresh: initial install-hooks clean conda-install build setup up logs

# Run this command if you want to rebuild everything except for the conda dependencies.
refresh: initial install-hooks clean build setup up logs

check:
	python scripts/check_code.py

add-providers:
	docker-compose run --rm eventkit python scripts/update_providers.py adhoc/fixture.json
image:
	docker-compose build eventkit
check_code: image black-format
bring_up: image
	docker-compose up -d