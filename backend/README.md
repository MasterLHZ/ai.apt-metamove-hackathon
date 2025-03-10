
# backend

## requirements
    ffmpeg
    redis
    python3.10

## install 
```bash
    python3 -m venv aiapt
    source aiapt/bin/activate
    pip3 install -r requirement.txt
```

## start

```bash
    vi .env
```

```bash
    REDIS_HOST=<your redis host>
    FLUX_API_KEY=<your flux api key>
    OPENROUTER_API_KEY=<your openrouter api key>
    FISH_KEY=<your fish key>
    X_CLIENT_ID=<your x client id>
    X_CLIENT_SECRET=<your x client secret>
    NODE_URL=<your node url>
    ADMIN_PRIVATE_KEY=<your admin private key>
    CONTRACT_ADDRESS=<your contract address>
```
```bash
   python3 schedule_api.py
```

