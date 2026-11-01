# Code runner on Oracle Cloud's free tier (AIIN-105)

Runs candidates' Python, Java, C++, JavaScript, TypeScript and C# for $0, on our own server.

**Why Piston on the small AMD server.** Judge0's and Piston's published images are built for Intel/AMD only, so they won't run on Oracle's free Arm servers. The free AMD server is small (1 GB of memory, a fraction of one CPU). Judge0 needs a database, Redis and older Linux settings, so it doesn't fit. Piston is one container with no database, so it does.

**Expect:** fine for a handful of candidates at once. Measured on this server: Python and JavaScript under a second, Java and C++ 2–4 seconds, TypeScript about 10 (interviews only). If it gets busy, move the same setup to a paid server (about $5 a month): the app only needs a new address.

---

## 1. Create the Oracle Cloud account (you)

1. Go to https://www.oracle.com/cloud/free/ and choose **Start for free**.
2. **Home region:** this can never be changed. Pick the one closest to where the app's server code runs. In Vercel, check **Project → Settings → Functions → Function Region**. The default is Washington, D.C., so pick **US East (Ashburn)**. For Mumbai, pick **India West (Mumbai)**.
3. A card is needed to verify you. Always Free resources aren't charged.
4. Optional: upgrade to **Pay As You Go**. Always Free stays free, and Oracle no longer reclaims a server it considers idle. Only do this if you'll avoid creating paid resources.

## 2. Create the server (you)

**Compute → Instances → Create instance**, then:

| Setting | Value |
|---|---|
| Name | `code-runner` |
| Image | **Canonical Ubuntu 24.04** (not Oracle Linux) |
| Shape | **VM.Standard.E2.1.Micro** (AMD, "Always Free-eligible") — not Ampere/Arm |
| Networking | Create a new virtual cloud network, with a **public IPv4 address** |
| SSH keys | **Generate a key pair for me**, and download the private key |

Choose **Create**, wait until it shows **Running**, and note the **Public IP address**.

**Open ports 80 and 443:**
1. On the instance page, open its **Subnet**, then its **Default Security List**.
2. Choose **Add Ingress Rules**:
   - Source CIDR `0.0.0.0/0`
   - Protocol TCP
   - Destination port range `80,443`

Port 2000 (Piston itself) stays closed. Only the HTTPS proxy is public.

## 3. Set up the server (you, by copy and paste)

Connect from your Mac (replace the key path and IP):

```bash
chmod 600 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_PUBLIC_IP
```

Then run each block on the server.

**Swap**, because 1 GB of memory isn't enough for Java:
```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Firewall.** Oracle's Ubuntu image rejects every port but SSH. These rules must come before its reject rule, hence position 4:
```bash
sudo iptables -I INPUT 4 -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 4 -p tcp --dport 80 -j ACCEPT
sudo netfilter-persistent save
```

**Docker:**
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && exit
```
Reconnect with the same `ssh` command.

**Piston.** It listens only on the server itself. Runs get 10 seconds (and 10 of CPU), 256 MB and 64 KB of output, with no network access. Java compiles inside its run, and the CPU is small, so 5 seconds isn't enough:
```bash
mkdir -p ~/piston/packages && cd ~/piston
cat > compose.yaml <<'EOF'
services:
  api:
    image: ghcr.io/engineer-man/piston
    restart: always
    privileged: true
    ports: ["127.0.0.1:2000:2000"]
    volumes: ["./packages:/piston/packages"]
    tmpfs: ["/tmp:exec"]
    environment:
      PISTON_RUN_TIMEOUT: 10000
      PISTON_RUN_CPU_TIME: 10000
      PISTON_COMPILE_TIMEOUT: 30000
      PISTON_COMPILE_CPU_TIME: 30000
      PISTON_RUN_MEMORY_LIMIT: 268435456
      PISTON_OUTPUT_MAX_SIZE: 65536
      PISTON_DISABLE_NETWORKING: "true"
      PISTON_MAX_CONCURRENT_JOBS: 2
EOF
docker compose up -d
```

**Languages.** This installs the newest version of each. It takes 10–20 minutes, because C++ is a large download. Piston restarts when a download from GitHub times out, so the loop waits for it and tries again:
```bash
sudo apt-get install -y jq
up() { for i in $(seq 1 60); do curl -s -m 5 localhost:2000/api/v2/runtimes >/dev/null && return 0; sleep 3; done; return 1; }
for lang in python java gcc node typescript mono; do
  for try in 1 2 3 4; do
    up || continue
    v=$(curl -s -m 60 localhost:2000/api/v2/packages | jq -r --arg l "$lang" '[.[] | select(.language==$l) | .language_version] | sort_by(split(".") | map(tonumber? // 0)) | last')
    [ -n "$v" ] && [ "$v" != null ] || { sleep 10; continue; }
    echo "Installing $lang $v (try $try)"
    curl -s -m 900 -X POST localhost:2000/api/v2/packages -H 'Content-Type: application/json' -d "{\"language\":\"$lang\",\"version\":\"$v\"}" | grep -q '"version"' && break
    sleep 10
  done
done
curl -s localhost:2000/api/v2/runtimes | jq -r '.[] | "\(.language) \(.version)"'
```
The last line should list python, java, c++, javascript, typescript and csharp.

**Faster Java.** A lighter garbage collector and compiler halve Java's start-up on this CPU:
```bash
sudo sed -i 's|^java $filename|java -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss8m $filename|' ~/piston/packages/java/*/run
```

**HTTPS with a secret token.** `sslip.io` gives the IP a free hostname, so HTTPS works without buying a domain:
```bash
sudo apt-get install -y caddy
TOKEN=$(openssl rand -hex 32)
HOST="$(curl -s ifconfig.me | tr . -).sslip.io"
sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
$HOST {
    @run {
        path /api/v2/execute
        header X-Auth-Token $TOKEN
    }
    handle @run {
        reverse_proxy 127.0.0.1:2000
    }
    respond 401
}
EOF
sudo systemctl reload caddy
echo "RUNNER_URL=https://$HOST"
echo "RUNNER_TOKEN=$TOKEN"
```
The last two lines are the two settings the app needs. Keep the token private, and don't paste it into a chat. Only running code is reachable from outside: installing languages and everything else is refused.

## 4. Connect the app

1. Add the two lines to `.env.local` in the project folder, so the code runner can be checked locally first.
2. In Vercel, under **Project → Settings → Environment Variables**, add the same two values for **Production**.

## Looking after it

- **Is it up?** Run this on the server:
  ```bash
  docker compose -f ~/piston/compose.yaml ps
  ```
- **Restart it:**
  ```bash
  docker compose -f ~/piston/compose.yaml restart
  ```
- **Update it**, once a month:
  ```bash
  sudo apt-get update && sudo apt-get upgrade -y
  cd ~/piston && docker compose pull && docker compose up -d
  ```
- **When it's down**, the app says the checker isn't available, and JavaScript still runs in the browser. Nothing breaks.
