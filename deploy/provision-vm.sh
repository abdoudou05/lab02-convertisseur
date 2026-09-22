#!/usr/bin/env bash
# Provisionnement de la VM Ubuntu 24.04 (execute une fois par l'administrateur via SSH).
# Equivalent de cloud-init.yaml. Aucun secret : seulement la cle PUBLIQUE de deploiement.
#   scp deploy/convertisseur.service deploy/nginx-convertisseur.conf deploy/provision-vm.sh azureuser@VM:/tmp/
#   ssh azureuser@VM 'bash /tmp/provision-vm.sh'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
DEPLOY_PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGAd5+Gu3ArDA0xPcdTsD2hqyhwo6WtK3V7PZxNSy1yJ github-actions-deploy'

# 1. Paquets : NGINX, Certbot, mises a jour de securite automatiques, Node.js 22
sudo apt-get update -qq
sudo apt-get install -y -qq nginx certbot python3-certbot-nginx curl unattended-upgrades
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y -qq nodejs

# 2. Compte de deploiement (sans mot de passe, cle SSH seulement)
id deploy >/dev/null 2>&1 || sudo useradd -m -s /bin/bash deploy
sudo passwd -l deploy
sudo install -d -m700 -o deploy -g deploy /home/deploy/.ssh
echo "$DEPLOY_PUBKEY" | sudo tee /home/deploy/.ssh/authorized_keys >/dev/null
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Durcissement SSH : cles seulement, pas de root, deux comptes autorises
printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin no\nMaxAuthTries 3\nAllowUsers azureuser deploy\n' \
  | sudo tee /etc/ssh/sshd_config.d/10-durcissement.conf >/dev/null
sudo sshd -t && sudo systemctl restart ssh

# 4. sudo limite : deploy peut seulement redemarrer le service et lire ses journaux
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart convertisseur, /usr/bin/systemctl status convertisseur, /usr/bin/journalctl -u convertisseur *' \
  | sudo tee /etc/sudoers.d/deploy >/dev/null
sudo chmod 440 /etc/sudoers.d/deploy
sudo visudo -cf /etc/sudoers.d/deploy

# 5. Dossier de l'application, service systemd et site NGINX
sudo install -d -o deploy -g deploy /opt/convertisseur /opt/convertisseur/releases
sudo install -m644 /tmp/convertisseur.service /etc/systemd/system/convertisseur.service
sudo install -m644 /tmp/nginx-convertisseur.conf /etc/nginx/sites-available/convertisseur
sudo ln -sfn /etc/nginx/sites-available/convertisseur /etc/nginx/sites-enabled/convertisseur
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl enable --now nginx && sudo systemctl reload nginx
sudo systemctl daemon-reload && sudo systemctl enable convertisseur

# 6. Certificat Let's Encrypt + redirection HTTP -> HTTPS (le DNS doit deja pointer vers la VM)
sudo certbot --nginx -d convertisseur.abdou.contact --non-interactive --agree-tos \
  --register-unsafely-without-email --redirect
