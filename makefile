ifneq (,$(wildcard .env.local))
    include .env.local
    export
endif

all:
	@echo "Usage: make app.test name=<name>"
	@echo "Available commands:"
	@echo "  app.local-build"
	@echo "  app.local.db-build"
	@echo "  app.rebuild"
	@echo "  app.live-rebuild"
	@echo "  app.restart-live"
	@echo "  app.restart"
	@echo "  app.down"
	@echo "  app.container"

app.down: check-docker-cont
	@echo "Stopping service: $(name)..."
	@docker stop $(name)
	@docker rm $(name)

app.compose.down: check.docker.compose-stack
	@echo "Stopping docker compose stack: $(stack-name)..."
	@docker compose -p $(stack-name) down

app.local.db-build:
	@docker compose -f ./docker/local.db.yml build --no-cache --force-rm
	@docker compose -f ./docker/local.db.yml up -d

app.prisma-seed: check-docker-cont
	@CONTAINER_ID=$$(docker ps --filter "name=$(name)" -q); \
	if [ -z "$$CONTAINER_ID" ]; then \
		echo "No running container found for service: $(name)"; \
		exit 1; \
	fi; \
	docker exec -t $$CONTAINER_ID /bin/sh -c "npx prisma db seed"
	@echo "Successfully initialized for service: $(name)"

app.local.build:
	@docker compose -f ./docker/local.app.yml build --no-cache --force-rm
	@docker compose -f ./docker/local.app.yml up -d

app.build.comp.local.service: check-docker-comp-service
	@docker build -f ./docker/local.app.yml --no-cache $(service-name) 

check-docker-comp-service:
ifndef service-name
	$(error service-name is undefined. Use: make "<command>" service-name=<service-name>)	
endif

check-docker-cont:
ifndef name
	$(error name is undefined. Use: make "<command>" name=<name>)
endif


check.docker.compose-stack:
ifndef stack-name
	$(error DOCKER_COMPOSE_STACK is undefined. Use: make "<command>" DOCKER_COMPOSE_STACK=<DOCKER_COMPOSE_STACK>)
endif

check.prisma-migrate-file:
ifndef PRISMA_MIGRATE_FILE
	$(error MIGRATION_FILE is undefined. Use: make "<command>" MIGRATION_FILE=<migration_file>) 
endif
