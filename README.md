# Deployment
1. Install Docker & Docker Compose
2. Run following command to build images
```
    docker compose build --no-cache
```
3. Run following command to deploy containers
```
    docker compose up -d
```
4. Check status containers
```
    docker ps
```
5. View log of specific container
```
    docker logs -f [container_name]
```