black:
	docker-compose run --rm eventkit black --config /var/lib/eventkit/config/pyproject.toml --check eventkit_cloud

flake8:
	docker-compose run --rm eventkit flake8 --config /var/lib/eventkit/config/setup.cfg eventkit_cloud
