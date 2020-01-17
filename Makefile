black:
	docker-compose run --rm eventkit black --config /var/lib/eventkit/config/pyproject.toml --check eventkit_cloud

flake8:
	docker-compose run --rm eventkit flake8 --config /var/lib/eventkit/config/setup.cfg eventkit_cloud

lint: black flake8

test:
	docker-compose run --rm -e COVERAGE=True eventkit python manage.py test -v 3 eventkit_cloud
	docker-compose run --rm webpack npm test

conda-install:
	cd conda && docker-compose build --no-cache
	cd conda && docker-compose run --rm conda

build:
	docker-compose build --no-cache

setup:
ifeq ($(OS),Windows_NT)
	docker-compose run --rm eventkit python manage.py runinitial setup
else
	sudo chmod -R g+w .
	mkdir -p exports_download && sudo chown eventkit:eventkit exports_download
	mkdir -p exports_stage && sudo chown eventkit:eventkit exports_stage
	docker-compose run --rm eventkit python manage.py runinitial setup
endif

up:
	docker-compose up -d

down:
	docker-compose down --remove-orphans

logs:
	docker-compose logs -f celery celery-beat eventkit webpack

logs-verbose:
	docker-compose logs -f

clean:
	docker-compose kill
	docker container prune -f
	docker volume prune -f

fresh: clean conda-install build setup up logs

refresh: clean build setup up logs

linux:
ifeq ($(OS),Linux)
	echo $(OS)
else
	echo $(OS)
endif