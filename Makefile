black:
	docker-compose run --rm eventkit black --config /var/lib/eventkit/config/pyproject.toml --check eventkit_cloud

flake8:
	docker-compose run --rm eventkit flake8 --config /var/lib/eventkit/config/setup.cfg eventkit_cloud

lint: black flake8

conda-install:
	cd conda
	docker-compose build --no-cache
	docker-compose run --rm conda

build:
	docker-compose build --no-cache

setup:
	mkdir -p exports_download && sudo chown eventkit:eventkit exports_download
	mkdir -p exports_stage && sudo chown eventkit:eventkit exports_stage
	docker-compose run --rm eventkit python manage.py runinitial setup

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
