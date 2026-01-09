import type { Proxmox } from "proxmox-api";
import proxmoxApi from "proxmox-api";

import { fetchWithTrustedCertificatesAsync } from "@homarr/core/infrastructure/http";
import { createLogger } from "@homarr/core/infrastructure/logs";

import { HandleIntegrationErrors } from "../base/errors/decorator";
import type { IntegrationTestingInput } from "../base/integration";
import { Integration } from "../base/integration";
import type { TestingResult } from "../base/test-connection/test-connection-service";
import type { IClusterHealthMonitoringIntegration } from "../interfaces/health-monitoring/health-monitoring-integration";
import type { IIndividualResourceMonitoringIntegration } from "../interfaces/health-monitoring/individual-resource-monitoring-integration";
import type {
  LxcDetails,
  NetworkInterface,
  NodeDetails,
  QemuDetails,
  StorageDetails,
} from "../interfaces/health-monitoring/individual-resource-monitoring-types";
import { ProxmoxApiErrorHandler } from "./proxmox-error-handler";
import type {
  ComputeResourceBase,
  LxcResource,
  NodeResource,
  QemuResource,
  Resource,
  StorageResource,
} from "./proxmox-types";

const logger = createLogger({ module: "proxmoxIntegration" });

@HandleIntegrationErrors([new ProxmoxApiErrorHandler()])
export class ProxmoxIntegration
  extends Integration
  implements IClusterHealthMonitoringIntegration, IIndividualResourceMonitoringIntegration
{
  protected async testingAsync(input: IntegrationTestingInput): Promise<TestingResult> {
    const proxmox = this.getPromoxApi(input.fetchAsync);
    await proxmox.nodes.$get();
    return { success: true };
  }

  public async getClusterInfoAsync() {
    const proxmox = this.getPromoxApi();
    const resources = await proxmox.cluster.resources.$get();

    // logger.info("Found resources in Proxmox cluster", {
    //   total: resources.length,
    //   node: resources.filter((resource) => resource.type === "node").length,
    //   lxc: resources.filter((resource) => resource.type === "lxc").length,
    //   qemu: resources.filter((resource) => resource.type === "qemu").length,
    //   storage: resources.filter((resource) => resource.type === "storage").length,
    // });

    const mappedResources = resources.map(mapResource).filter((resource) => resource !== null);
    return {
      nodes: mappedResources.filter((resource): resource is NodeResource => resource.type === "node"),
      lxcs: mappedResources.filter((resource): resource is LxcResource => resource.type === "lxc"),
      vms: mappedResources.filter((resource): resource is QemuResource => resource.type === "qemu"),
      storages: mappedResources.filter((resource): resource is StorageResource => resource.type === "storage"),
    };
  }

  /**
   * Get detailed information about a specific node
   * Uses Proxmox API endpoint: GET /api2/json/nodes/{node}/status
   */
  public async getNodeDetailsAsync(nodeName: string): Promise<NodeDetails> {
    const proxmox = this.getPromoxApi();
    const nodeStatus = await proxmox.nodes.$(nodeName).status.$get();

    logger.info("Retrieved node details", { nodeName });

    return {
      name: nodeName,
      status: nodeStatus.pveversion ? "online" : "offline",
      isOnline: !!nodeStatus.pveversion,
      cpuModel: nodeStatus.cpuinfo?.model ?? "Unknown",
      cpuCores: nodeStatus.cpuinfo?.cpus ?? 0,
      cpuUtilization: nodeStatus.cpu ?? 0,
      memoryTotal: nodeStatus.memory?.total ?? 0,
      memoryUsed: nodeStatus.memory?.used ?? 0,
      swapTotal: nodeStatus.swap?.total ?? 0,
      swapUsed: nodeStatus.swap?.used ?? 0,
      rootFsTotal: nodeStatus.rootfs?.total ?? 0,
      rootFsUsed: nodeStatus.rootfs?.used ?? 0,
      uptime: nodeStatus.uptime ?? 0,
      loadAverage1: Array.isArray(nodeStatus.loadavg) && typeof nodeStatus.loadavg[0] === "number" ? nodeStatus.loadavg[0] : 0,
      loadAverage5: Array.isArray(nodeStatus.loadavg) && typeof nodeStatus.loadavg[1] === "number" ? nodeStatus.loadavg[1] : 0,
      loadAverage15: Array.isArray(nodeStatus.loadavg) && typeof nodeStatus.loadavg[2] === "number" ? nodeStatus.loadavg[2] : 0,
      version: nodeStatus.pveversion ?? "Unknown",
      kernelVersion: nodeStatus.kversion ?? "Unknown",
      pveVersion: nodeStatus.pveversion ?? "Unknown",
    };
  }

  /**
   * Get detailed information about a specific LXC container
   * Uses Proxmox API endpoints:
   * - GET /api2/json/nodes/{node}/lxc/{vmid}/status/current
   * - GET /api2/json/nodes/{node}/lxc/{vmid}/config
   */
  public async getLxcDetailsAsync(nodeName: string, vmId: number): Promise<LxcDetails> {
    const proxmox = this.getPromoxApi();
    const [status, config] = await Promise.all([
      proxmox.nodes.$(nodeName).lxc.$(vmId).status.current.$get(),
      proxmox.nodes.$(nodeName).lxc.$(vmId).config.$get(),
    ]);

    logger.info("Retrieved LXC details", { nodeName, vmId });

    const networkInterfaces = this.parseNetworkInterfaces(config, "lxc");
    const disks = this.parseDisksConfig(config, "lxc");

    return {
      vmId,
      name: status.name ?? `CT ${vmId}`,
      node: nodeName,
      status: status.status ?? "unknown",
      isRunning: status.status === "running",
      osType: config.ostype as string | undefined,
      hostname: config.hostname as string | undefined,
      cpuCores: config.cores as number,
      cpuUtilization: status.cpu ?? 0,
      memoryTotal: status.maxmem ?? 0,
      memoryUsed: status.mem ?? 0,
      swapTotal: status.maxswap ?? 0,
      swapUsed: status.swap ?? 0,
      diskTotal: status.maxdisk ?? 0,
      diskUsed: status.disk ?? 0,
      uptime: status.uptime ?? 0,
      networkInterfaces,
      disks,
      privileged: config.unprivileged !== 1,
      protected: config.protection === 1,
      tags: config.tags as string | undefined,
      description: config.description as string | undefined,
    };
  }

  /**
   * Get detailed information about a specific QEMU virtual machine
   * Uses Proxmox API endpoints:
   * - GET /api2/json/nodes/{node}/qemu/{vmid}/status/current
   * - GET /api2/json/nodes/{node}/qemu/{vmid}/config
   * - GET /api2/json/nodes/{node}/qemu/{vmid}/agent/get-osinfo (if agent available)
   * - GET /api2/json/nodes/{node}/qemu/{vmid}/snapshot
   */
  public async getQemuDetailsAsync(nodeName: string, vmId: number): Promise<QemuDetails> {
    const proxmox = this.getPromoxApi();
    const [status, config] = await Promise.all([
      proxmox.nodes.$(nodeName).qemu.$(vmId).status.current.$get(),
      proxmox.nodes.$(nodeName).qemu.$(vmId).config.$get(),
    ]);

    logger.info("Retrieved QEMU details", { nodeName, vmId });

    const networkInterfaces = this.parseNetworkInterfaces(config, "qemu");
    const disks = this.parseDisksConfig(config, "qemu");

    // Try to get guest OS info from agent if available
    let guestOsInfo: QemuDetails["guestOsInfo"];
    const agentEnabled = status.agent === 1 || config.agent === 1 || config.agent === "1";
    if (agentEnabled && status.status === "running") {
      try {
        const osInfo = await proxmox.nodes.$(nodeName).qemu.$(vmId).agent["get-osinfo"].$get();
        if (osInfo && osInfo.result) {
          guestOsInfo = {
            name: osInfo.result.name as string | undefined,
            version: osInfo.result.version as string | undefined,
            kernel: osInfo.result["kernel-version"] as string | undefined,
            architecture: osInfo.result.machine as string | undefined,
          };
        }
      } catch (error) {
        logger.debug("Failed to get guest OS info from agent", { nodeName, vmId, error });
      }
    }

    // Try to get snapshot count
    let snapshotCount = 0;
    try {
      const snapshots = await proxmox.nodes.$(nodeName).qemu.$(vmId).snapshot.$get();
      snapshotCount = snapshots ? snapshots.length - 1 : 0; // Exclude current state
    } catch (error) {
      logger.debug("Failed to get snapshot count", { nodeName, vmId, error });
    }

    return {
      vmId,
      name: status.name ?? `VM ${vmId}`,
      node: nodeName,
      status: status.status ?? "unknown",
      isRunning: status.status === "running",
      cpuSockets: (config.sockets as number) ?? 1,
      cpuCores: (config.cores as number) ?? 1,
      cpuType: config.cpu as string | undefined,
      cpuUtilization: status.cpu ?? 0,
      memoryTotal: status.maxmem ?? 0,
      memoryUsed: status.mem ?? 0,
      diskTotal: status.maxdisk ?? 0,
      diskUsed: status.disk ?? 0,
      uptime: status.uptime ?? 0,
      networkInterfaces,
      disks,
      agentEnabled,
      guestOsInfo,
      snapshotCount,
      bootOrder: config.boot as string | undefined,
      vgaType: config.vga as string | undefined,
      biosType: config.bios as string | undefined,
      machineType: config.machine as string | undefined,
      protected: config.protection === 1,
      tags: config.tags as string | undefined,
      description: config.description as string | undefined,
    };
  }

  /**
   * Get detailed information about a specific storage resource
   * Uses Proxmox API endpoints:
   * - GET /api2/json/nodes/{node}/storage/{storage}/status
   * - GET /api2/json/storage (for storage configuration)
   */
  public async getStorageDetailsAsync(nodeName: string, storageName: string): Promise<StorageDetails> {
    const proxmox = this.getPromoxApi();
    const [status, storages] = await Promise.all([
      proxmox.nodes.$(nodeName).storage.$(storageName).status.$get(),
      proxmox.storage.$get(),
    ]);

    logger.info("Retrieved storage details", { nodeName, storageName });

    // Find the storage configuration from the storage list
    const storageConfig = storages.find((s) => s.storage === storageName);

    return {
      id: `${nodeName}:storage/${storageName}`,
      name: storageName,
      node: nodeName,
      status: status.active ? "available" : "unavailable",
      isAvailable: status.active === 1,
      type: status.type ?? "unknown",
      total: status.total ?? 0,
      used: status.used ?? 0,
      available: status.avail ?? 0,
      isShared: storageConfig?.shared === 1,
      path: storageConfig?.path as string | undefined,
      contentTypes: (status.content ?? "").split(",").filter(Boolean),
      enabled: status.enabled !== 0,
      config: storageConfig
        ? {
            server: storageConfig.server as string | undefined,
            export: storageConfig.export as string | undefined,
            share: storageConfig.share as string | undefined,
            vgname: storageConfig.vgname as string | undefined,
            pool: storageConfig.pool as string | undefined,
            thinpool: storageConfig.thinpool as string | undefined,
          }
        : undefined,
    };
  }

  /**
   * Parse network interface configuration from VM/LXC config
   * Supports both QEMU (netN) and LXC (netN) network configs
   */
  private parseNetworkInterfaces(
    config: Record<string, unknown>,
    type: "qemu" | "lxc",
  ): NetworkInterface[] {
    const interfaces: NetworkInterface[] = [];

    for (let i = 0; i < 32; i++) {
      const key = `net${i}`;
      const netConfig = config[key];

      if (!netConfig || typeof netConfig !== "string") continue;

      // Parse network config string
      // Format examples:
      // QEMU: "virtio=XX:XX:XX:XX:XX:XX,bridge=vmbr0"
      // LXC: "name=eth0,bridge=vmbr0,hwaddr=XX:XX:XX:XX:XX:XX,ip=dhcp"
      const parts = netConfig.split(",");
      const configMap: Record<string, string> = {};

      for (const part of parts) {
        const [k, v] = part.split("=");
        if (k && v) {
          configMap[k.trim()] = v.trim();
        }
      }

      const netInterface: NetworkInterface = {
        name: key,
        bridge: configMap.bridge ?? "",
        macAddress:
          type === "qemu"
            ? parts[0]?.split("=")?.[1] // virtio=MAC or e1000=MAC
            : configMap.hwaddr,
        enabled: true,
        model: type === "qemu" ? parts[0]?.split("=")?.[0] : undefined,
      };

      if (type === "lxc") {
        if (configMap.ip && configMap.ip !== "dhcp") {
          netInterface.ipAddress = configMap.ip;
        }
        if (configMap.ip6 && configMap.ip6 !== "dhcp") {
          netInterface.ipv6Address = configMap.ip6;
        }
      }

      interfaces.push(netInterface);
    }

    return interfaces;
  }

  /**
   * Parse disk configuration from VM/LXC config
   */
  private parseDisksConfig(
    config: Record<string, unknown>,
    type: "qemu" | "lxc",
  ): { id: string; storage: string; size: number; mountPoint?: string }[] {
    const disks: { id: string; storage: string; size: number; mountPoint?: string }[] = [];

    if (type === "lxc") {
      // LXC: rootfs and mpN
      const rootfs = config.rootfs;
      if (rootfs && typeof rootfs === "string") {
        const match = rootfs.match(/^([^:]+):([^,]+),?.*size=(\d+)([MGT])?/);
        if (match) {
          const [, storage, , sizeStr, unit] = match;
          const multiplier = unit === "G" ? 1024 * 1024 * 1024 : unit === "M" ? 1024 * 1024 : unit === "T" ? 1024 * 1024 * 1024 * 1024 : 1;
          disks.push({
            id: "rootfs",
            storage: storage ?? "",
            size: parseInt(sizeStr ?? "0") * multiplier,
            mountPoint: "/",
          });
        }
      }

      // Mount points
      for (let i = 0; i < 256; i++) {
        const key = `mp${i}`;
        const mpConfig = config[key];
        if (mpConfig && typeof mpConfig === "string") {
          const match = mpConfig.match(/^([^:]+):([^,]+),?.*mp=([^,]+).*size=(\d+)([MGT])?/);
          if (match) {
            const [, storage, , mountPoint, sizeStr, unit] = match;
            const multiplier = unit === "G" ? 1024 * 1024 * 1024 : unit === "M" ? 1024 * 1024 : unit === "T" ? 1024 * 1024 * 1024 * 1024 : 1;
            disks.push({
              id: key,
              storage: storage ?? "",
              size: parseInt(sizeStr ?? "0") * multiplier,
              mountPoint,
            });
          }
        }
      }
    } else {
      // QEMU: scsiN, ideN, sata N, virtioN
      const diskTypes = ["scsi", "ide", "sata", "virtio"];
      for (const diskType of diskTypes) {
        for (let i = 0; i < 32; i++) {
          const key = `${diskType}${i}`;
          const diskConfig = config[key];
          if (diskConfig && typeof diskConfig === "string") {
            const match = diskConfig.match(/^([^:]+):([^,]+),?.*size=(\d+)([MGT])?/);
            if (match) {
              const [, storage, , sizeStr, unit] = match;
              const multiplier = unit === "G" ? 1024 * 1024 * 1024 : unit === "M" ? 1024 * 1024 : unit === "T" ? 1024 * 1024 * 1024 * 1024 : 1;
              disks.push({
                id: key,
                storage: storage ?? "",
                size: parseInt(sizeStr ?? "0") * multiplier,
              });
            }
          }
        }
      }
    }

    return disks;
  }

  private getPromoxApi(fetchAsync = fetchWithTrustedCertificatesAsync) {
    return proxmoxApi({
      host: this.url("/").host,
      tokenID: `${this.getSecretValue("username")}@${this.getSecretValue("realm")}!${this.getSecretValue("tokenId")}`,
      tokenSecret: this.getSecretValue("apiKey"),
      fetch: fetchAsync,
    });
  }
}

const mapResource = (resource: Proxmox.clusterResourcesResources): Resource | null => {
  switch (resource.type) {
    case "node":
      return mapNodeResource(resource);
    case "lxc":
    case "qemu":
      return mapVmResource(resource);
    case "storage":
      return mapStorageResource(resource);
  }

  return null;
};

const mapComputeResource = (resource: Proxmox.clusterResourcesResources): Omit<ComputeResourceBase<string>, "type"> => {
  return {
    id: resource.id,
    cpu: {
      utilization: resource.cpu ?? 0,
      cores: resource.maxcpu ?? 0,
    },
    memory: {
      used: resource.mem ?? 0,
      total: resource.maxmem ?? 0,
    },
    storage: {
      used: resource.disk ?? 0,
      total: resource.maxdisk ?? 0,
      read: (resource.diskread as number | null) ?? null,
      write: (resource.diskwrite as number | null) ?? null,
    },
    network: {
      in: (resource.netin as number | null) ?? null,
      out: (resource.netout as number | null) ?? null,
    },
    haState: resource.hastate ?? null,
    isRunning: resource.status === "running" || resource.status === "online",
    name: resource.name ?? "",
    node: resource.node ?? "",
    status: resource.status ?? (resource.type === "node" ? "offline" : "stopped"),
    uptime: resource.uptime ?? 0,
  };
};

const mapNodeResource = (resource: Proxmox.clusterResourcesResources): NodeResource => {
  return {
    type: "node",
    ...mapComputeResource(resource),
    name: resource.node ?? "",
  };
};

const mapVmResource = (resource: Proxmox.clusterResourcesResources): LxcResource | QemuResource => {
  return {
    type: resource.type as "lxc" | "qemu",
    vmId: resource.vmid ?? 0,
    ...mapComputeResource(resource),
  };
};

const mapStorageResource = (resource: Proxmox.clusterResourcesResources): StorageResource => {
  return {
    id: resource.id,
    type: "storage",
    name: resource.storage ?? "",
    node: resource.node ?? "",
    isRunning: resource.status === "available",
    status: resource.status ?? "offline",
    storagePlugin: resource.storage ?? "",
    total: resource.maxdisk ?? 0,
    used: resource.disk ?? 0,
    isShared: resource.shared === 1,
  };
};
