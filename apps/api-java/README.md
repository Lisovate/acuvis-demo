# acuvis-demo-api (Java)

URL shortener API in Java — Spring Boot 3 + Spring Data JPA + jjwt for tokens.
Mirrors the TypeScript port under `apps/api` (on `main`) so reviewers can
compare Acuvis's review across language stacks.

## Stack

- **Spring Boot 3.3** (Java 21, virtual threads enabled)
- **Spring Data JPA** with SQLite + Hibernate community dialect
- **jjwt** for JWT issue/verify
- **Spring Security Crypto** (BCryptPasswordEncoder) for user passwords

## Running

```sh
cd apps/api-java
./mvnw spring-boot:run
```

Defaults to port 4000. SQLite file at `data/app.sqlite`, auto-created.

## Endpoints

- `POST /auth/register` — create a user
- `POST /auth/login` — issue JWT
- `POST /links` — create short link (auth required)
- `GET /links` — list caller's links (auth required)
- `GET /{slug}` — redirect to the long URL
