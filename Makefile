COMPOSE_DEV := docker-compose -f docker-compose.dev.yml
COMPOSE_PROD := docker-compose -f docker-compose.prod.yml

up: dev-up
prod: prod-up

dev-up:
	$(COMPOSE_DEV) up -d

dev-down:
	$(COMPOSE_DEV) down

prod-up:
	$(COMPOSE_PROD) up --build -d

prod-down:
	$(COMPOSE_PROD) down

restart:
	$(COMPOSE_DEV) down && $(COMPOSE_DEV) up -d

prod-restart:
	$(COMPOSE_PROD) down && $(COMPOSE_PROD) up --build -d

clean:
	$(COMPOSE_DEV) down -v --remove-orphans
	$(COMPOSE_PROD) down -v --remove-orphans
	docker builder prune -a -f

migrate-dev:
	docker exec -it concert_backend npx prisma migrate dev

migrate-prod:
	docker exec -it concert_backend npx prisma migrate deploy

seed:
	docker exec -it concert_backend npx prisma db seed

db-shell:
	docker exec -it concert_postgres psql -U admin -d concert_db

sh-be:
	docker exec -it concert_backend sh

sh-fe:
	docker exec -it concert_frontend sh

logs-be:
	docker logs -f concert_backend

logs-fe:
	docker logs -f concert_frontend

logs:
	docker-compose logs -f

ps:
	docker-compose ps
