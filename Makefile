dco = $(or ${DCO}, docker-compose)

black:
	docker-compose run --rm eventkit black --config /var/lib/eventkit/config/pyproject.toml --check /home/eventkit/miniconda3/envs/eventkit-cloud/lib/python3.6/site-packages/eventkit_cloud

flake8:
	docker-compose run --rm eventkit flake8 --config /var/lib/eventkit/config/setup.cfg eventkit_cloud