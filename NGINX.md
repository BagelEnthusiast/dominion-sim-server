# nginx

For installing on Debian (Linode)

```bash
sudo apt-get update

# update libs or install might fail
apt-get update

# install nginx
sudo apt install nginx
systemctl restart nginx

sudo apt install certbot
sudo apt install certbot python3-certbot-nginx
```

## nginx

Example server

```conf
server {
  server_name domserver.mrluckywaffles.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
  }
}
```

## certbot

Get instructions https://certbot.eff.org/instructions

```bash
# Follow prompts
certbot --nginx
```

## to change URL later

1. register domain via DNS (use subdomain)
2. point subdomain to Linode IP address `dominion-server.nathan.com`
3. edit `/etc/nginx/sites-enabled/dominion-server` and replace the `server_name`
4. `systemctl restart nginx`
5. `certbot --nginx`