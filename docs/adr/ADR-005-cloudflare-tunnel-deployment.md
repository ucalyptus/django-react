# ADR-005: Cloudflare Tunnel for Deployment (not CF Workers)

**Date:** 2026-06-23
**Status:** Accepted

## Context

The Django application needed to be reachable at `mychoice.ucalyptus.me` (a subdomain on the `ucalyptus.me` zone managed in Cloudflare). The backend runs on an Ubuntu EC2 peer instance behind a private IP with no inbound security group rules open to the internet. A deployment mechanism was needed that avoids opening inbound ports, manages TLS, and integrates with the existing `ucalyptus.me` Cloudflare zone.

## Decision

Use a **Cloudflare Tunnel** (`cloudflared`) daemon running as a systemd service on the Ubuntu EC2 peer. The tunnel authenticates outbound to Cloudflare's edge, and a route in `~/.cloudflared/config.yml` maps `mychoice.ucalyptus.me` → `http://localhost:8000` (the gunicorn socket).

The tunnel is added as an `ingress` entry in the same `config.yml` that serves other subdomains (`technews.ucalyptus.me`, etc.), so no new daemon process is needed — only a new route block and a CNAME DNS record pointing `mychoice` to the tunnel's UUID.

## Alternatives Considered

| Option | Reason not chosen |
|--------|------------------|
| **Cloudflare Workers** | Workers execute JavaScript or WebAssembly at the edge; Python WSGI/ASGI applications cannot run there without a full rewrite. Not viable for Django |
| **Direct EC2 exposure (Nginx + Let's Encrypt)** | Requires opening TCP/443 inbound in the security group, managing SSL certificate renewal (cron + certbot), and configuring Nginx as a reverse proxy — significantly more operational surface area |
| **AWS Elastic Load Balancer (ELB/ALB)** | Adds per-hour and per-LCU costs, requires ACM certificate provisioning, and introduces another AWS resource to manage; disproportionate for a single-server single-subdomain deployment |
| **Ngrok** | Paid for custom domains and persistent URLs; tunnel URL changes on free plan restart |

## Consequences

**Positive:**
- **Zero inbound firewall rules:** the EC2 security group has no ports open to the internet; all traffic enters via the outbound-initiated tunnel
- **No TLS certificate management:** Cloudflare terminates TLS at the edge using a certificate it provisions and renews automatically; gunicorn only handles plain HTTP on localhost
- **DDoS protection and WAF** at the Cloudflare edge are available at no additional configuration cost
- **Reuses existing infrastructure:** the tunnel and `cloudflared` service are already running for other subdomains; adding `mychoice` is a two-line config change
- **DNS is automatic:** a CNAME record is created in the Cloudflare zone when the tunnel route is added; no manual DNS entry needed

**Negative / Trade-offs:**
- **Availability tied to EC2 uptime:** if the Ubuntu peer instance stops, the Django process stops and the tunnel drops; there is no automatic failover or health check restart beyond systemd's `Restart=on-failure`
- **Cloudflare dependency:** the site is unreachable if Cloudflare's tunnel service has an outage, even if the EC2 instance is healthy
- **Latency through CF edge:** all requests traverse Cloudflare's nearest PoP, adding one network hop compared to direct EC2 access (typically <5 ms overhead from regional PoPs)
- **Single point of failure at gunicorn:** gunicorn must be running and bound to port 8000; a process crash is not self-healing without a process supervisor (systemd or supervisor) monitoring it
