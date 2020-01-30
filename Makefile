ifeq ($(OS),Windows_NT)     # is Windows_NT on XP, 2000, 7, Vista, 10...
    detected_OS := Windows
else
    detected_OS := $(shell uname 2>/dev/null || echo Unknown)
endif

black:
	docker-compose run --rm eventkit black --config /var/lib/eventkit/config/pyproject.toml --check eventkit_cloud

flake8:
	docker-compose run --rm eventkit flake8 --config /var/lib/eventkit/config/setup.cfg eventkit_cloud

lint: black flake8

test:
	docker-compose run --rm -e COVERAGE=True eventkit python manage.py test -v 3 eventkit_cloud
	docker-compose run --rm webpack npm test

initial:
ifeq ($(detected_OS),Linux)
	sudo groupadd -g 880 eventkit || echo "Group eventkit already exists."
	sudo useradd -u 8800 -g 880 -m eventkit || echo "User eventkit already exists."
	sudo usermod -a -G eventkit ${USER}
	sudo chown -R ${USER}:eventkit .
endif

conda-install:
	cd conda && docker-compose build --no-cache
	cd conda && docker-compose run --rm conda

build:
ifeq ($(detected_OS),Linux)
	echo $(detected_OS)
	sudo chmod -R g+rw .
	docker-compose build --no-cache
else
	docker-compose build --no-cache
endif

setup:
ifeq ($(detected_OS),Linux)
	sudo chmod -R g+rw .
	mkdir -p exports_download && sudo chown eventkit:eventkit exports_download
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

logs:
	docker-compose logs -f celery celery-beat eventkit webpack

logs-verbose:
	docker-compose logs -f

# All of the commands below this line are destructive and will completely remove your current development environment.

clean:
	docker-compose down -v

fresh: initial clean conda-install build setup up logs

refresh: initial clean build setup up logs
