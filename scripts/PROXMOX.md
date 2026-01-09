# Homarr ProxmoxVE Installation Script

This script provides an automated installation of Homarr on ProxmoxVE containers using the community-scripts framework.

## Overview

The `proxmox-install.sh` script is designed to be used with the [ProxmoxVE Community Scripts](https://github.com/community-scripts/ProxmoxVE) framework. It automates the deployment of Homarr on ProxmoxVE LXC containers.

## Features

- **Automated Installation**: Sets up Homarr with all required dependencies
- **Service Management**: Configures systemd services for Homarr, Redis, and Nginx
- **Update Functionality**: Built-in update mechanism to upgrade to the latest release
- **Optimized Configuration**: Pre-configured with recommended resource allocations

## Requirements

- ProxmoxVE host with community-scripts framework
- Debian 13 LXC container (recommended)
- Minimum resources:
  - CPU: 2 cores
  - RAM: 1024 MB
  - Disk: 8 GB

## Installation

### Using the Script Directly

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/Magnusri/homarr/main/scripts/proxmox-install.sh)"
```

### Manual Deployment

1. Create a new LXC container in ProxmoxVE
2. Download and run the script:
   ```bash
   wget https://raw.githubusercontent.com/Magnusri/homarr/main/scripts/proxmox-install.sh
   chmod +x proxmox-install.sh
   ./proxmox-install.sh
   ```

## Configuration

### Default Settings

The script uses the following default configuration:

- **OS**: Debian 13
- **CPU**: 2 cores
- **RAM**: 1024 MB
- **Disk**: 8 GB
- **Container Type**: Unprivileged
- **Network Port**: 7575

### Service Layout

After installation, the following services will be running:

- **Homarr Web UI**: Port 3000 (internal)
- **WebSocket Server**: Port 3001 (internal)
- **Nginx Reverse Proxy**: Port 7575 (external)
- **Redis Server**: Internal data cache
- **Cron Jobs Service**: Background task processor

## Accessing Homarr

After successful installation, access Homarr at:

```
http://<container-ip>:7575
```

## Updates

To update an existing Homarr installation, simply re-run the script:

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/Magnusri/homarr/main/scripts/proxmox-install.sh)"
```

The script will:
1. Detect the existing installation
2. Stop all services
3. Download the latest release
4. Update configurations
5. Restart services

## File Locations

- **Application**: `/opt/homarr/`
- **Data Directory**: `/appdata/`
  - Database: `/appdata/db/`
  - Redis Data: `/appdata/redis/`
  - Certificates: `/appdata/trusted-certificates/`
- **Configuration**: `/opt/homarr.env`
- **Systemd Service**: `/etc/systemd/system/homarr.service`
- **Nginx Config**: `/etc/nginx/templates/nginx.conf`
- **Redis Config**: `/etc/redis/redis.conf`

## Architecture

The installation creates a complete Homarr stack:

```
┌─────────────────────────────────────┐
│        Nginx (Port 7575)            │
│         Reverse Proxy               │
└───────────┬─────────────────────────┘
            │
            ├──────────────┬──────────┐
            │              │          │
            ▼              ▼          ▼
    ┌──────────┐   ┌──────────┐  ┌──────────┐
    │ Next.js  │   │WebSocket │  │  Tasks   │
    │Port 3000 │   │Port 3001 │  │  Server  │
    └────┬─────┘   └────┬─────┘  └────┬─────┘
         │              │             │
         └──────────────┴─────────────┘
                        │
                        ▼
                  ┌──────────┐
                  │  Redis   │
                  │  Cache   │
                  └──────────┘
```

## Troubleshooting

### Service Status

Check service status:
```bash
systemctl status homarr
systemctl status redis-server
systemctl status nginx
```

### View Logs

```bash
journalctl -u homarr -f
journalctl -u redis-server -f
```

### Restart Services

```bash
systemctl restart homarr
systemctl restart redis-server
systemctl restart nginx
```

### Database Issues

If you encounter database issues, check the DB configuration:
```bash
cat /opt/homarr.env | grep DB_
```

## Fork Notice

This script is configured to install from the **Magnusri/homarr** fork instead of the upstream homarr-labs/homarr repository. This allows for custom features and modifications specific to this fork.

## License

MIT License - See [LICENSE](../LICENSE) file for details.

## Support

For issues specific to this ProxmoxVE script, please open an issue in the [Magnusri/homarr](https://github.com/Magnusri/homarr) repository.

For general ProxmoxVE community-scripts support, visit [community-scripts/ProxmoxVE](https://github.com/community-scripts/ProxmoxVE).
