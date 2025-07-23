# Ultimate VM (Virtual Machine) Deployment Guide

This guide will walk you through deploying an application on a cloud VM, covering connection, setup, Docker, GitHub integration, environment configuration, running the app, and securing it with Nginx and Let's Encrypt.

---

## 1. Connecting to a VM Instance

You can deploy on various cloud providers like Google Cloud Platform (GCP), AWS EC2, or DigitalOcean. Below are examples for connecting via SSH from your local machine.

### GCP VM Instance
1. **Install Google Cloud CLI:**
   ```bash
   sudo apt-get install google-cloud-sdk
   ```
2. **Authenticate:**
   ```bash
   gcloud auth login
   ```
3. **Connect to VM:**
   ```bash
   gcloud compute ssh <INSTANCE_NAME> --zone <ZONE>
   ```

### AWS EC2 Instance
1. **Download your EC2 key pair (.pem file) and set permissions:**
   ```bash
   chmod 400 <key-pair>.pem
   ```
2. **Connect via SSH:**
   ```bash
   ssh -i <key-pair>.pem ubuntu@<EC2_PUBLIC_IP>
   ```

### DigitalOcean Droplet
1. **Get your Droplet's IP and SSH key ready.**
2. **Connect via SSH:**
   ```bash
   ssh root@<DROPLET_IP>
   ```

---

## 2. Updating the VM & Installing Docker/Docker Compose

### Update the System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Install Docker Compose
```bash
sudo apt-get install -y docker-compose-plugin
```

### Add User to Docker Group (Optional)
```bash
sudo usermod -aG docker $USER
# Log out and log back in for group changes to take effect
```

---

## 3. Testing the Application Locally with Docker/Docker Compose

### What is Docker?
Docker is a platform that allows you to package applications and their dependencies into containers, ensuring consistency across environments.

### Test with Docker
```bash
docker run hello-world
```

### Test with Docker Compose
If you have a `docker-compose.yml` file:
```bash
docker compose up
```

---

## 4. Connecting GitHub Using SSH

1. **Generate SSH Key (if you don't have one):**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press enter to accept defaults
   ```
2. **Start SSH agent and add key:**
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```
3. **Copy the public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy the output
   ```
4. **Add the key to GitHub:**
   - Go to GitHub > Settings > SSH and GPG keys > New SSH key
   - Paste your public key and save
5. **Test the connection:**
   ```bash
   ssh -T git@github.com
   ```

---

## 5. Pulling the GitHub Repository to the VM

```bash
git clone git@github.com:<username>/<repository>.git
cd <repository>
```

---

## 6. Creating a .env File Using Nemo

If you have a desktop environment with Nemo (Linux file manager):
1. Open Nemo: `nemo .`
2. Right-click > New Document > Empty Document
3. Name it `.env` and add your environment variables inside.

Alternatively, via CLI:
```bash
touch .env
nano .env
```

---

## 7. Running the Application

- If using Docker Compose:
  ```bash
  docker compose up -d
  ```
- If using Docker only:
  ```bash
  docker run <options> <image>
  ```

---

## 8. Adding Nginx and Let's Encrypt (example.com)

### Install Nginx
```bash
sudo apt install nginx -y
```

### Configure Nginx for Your App
Edit `/etc/nginx/sites-available/example.com`:
```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://localhost:YOUR_APP_PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the config:
```bash
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Install Certbot and Get SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d example.com -d www.example.com
```

Follow prompts to complete SSL setup. Your site is now secured with HTTPS!

---

**Congratulations! Your application is now deployed, running, and secured on your VM.**
