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
    const nodeStatus = (await proxmox.nodes.$(nodeName).status.$get()) as Record<string, unknown>;

    logger.info("Retrieved node details", { nodeName });

    const pveversion = typeof nodeStatus.pveversion === "string" ? nodeStatus.pveversion : undefined;
    const kversion = typeof nodeStatus.kversion === "string" ? nodeStatus.kversion : undefined;
    const cpuinfo = nodeStatus.cpuinfo as { model?: string; cpus?: number } | undefined;
    const cpu = typeof nodeStatus.cpu === "number" ? nodeStatus.cpu : 0;
    const memory = nodeStatus.memory as { total?: number; used?: number } | undefined;
    const swap = nodeStatus.swap as { total?: number; used?: number } | undefined;
    const rootfs = nodeStatus.rootfs as { total?: number; used?: number } | undefined;
    const uptime = typeof nodeStatus.uptime === "number" ? nodeStatus.uptime : 0;
    const loadavg = Array.isArray(nodeStatus.loadavg) ? nodeStatus.loadavg : [];

    return {
      name: nodeName,
      status: pveversion ? "online" : "offline",
      isOnline: !!pveversion,
      cpuModel: cpuinfo?.model ?? "Unknown",
      cpuCores: cpuinfo?.cpus ?? 0,
      cpuUtilization: cpu,
      memoryTotal: memory?.total ?? 0,
      memoryUsed: memory?.used ?? 0,
      swapTotal: swap?.total ?? 0,
      swapUsed: swap?.used ?? 0,
      rootFsTotal: rootfs?.total ?? 0,
      rootFsUsed: rootfs?.used ?? 0,
      uptime,
      loadAverage1: typeof loadavg[0] === "number" ? loadavg[0] : 0,
      loadAverage5: typeof loadavg[1] === "number" ? loadavg[1] : 0,
      loadAverage15: typeof loadavg[2] === "number" ? loadavg[2] : 0,
      version: pveversion ?? "Unknown",
      kernelVersion: kversion ?? "Unknown",
      pveVersion: pveversion ?? "Unknown",
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
    const [statusRaw, configRaw] = await Promise.all([
      proxmox.nodes.$(nodeName).lxc.$(vmId).status.current.$get(),
      proxmox.nodes.$(nodeName).lxc.$(vmId).config.$get(),
    ]);

    const status = statusRaw as Record<string, unknown>;
    const config = configRaw as Record<string, unknown>;

    logger.info("Retrieved LXC details", { nodeName, vmId });

    const networkInterfaces = this.parseNetworkInterfaces(config, "lxc");
    const disks = this.parseDisksConfig(config, "lxc");

    const statusName = typeof status.name === "string" ? status.name : undefined;
    const statusStatus = typeof status.status === "string" ? status.status : "unknown";
    const statusCpu = typeof status.cpu === "number" ? status.cpu : 0;
    const statusMaxmem = typeof status.maxmem === "number" ? status.maxmem : 0;
    const statusMem = typeof status.mem === "number" ? status.mem : 0;
    const statusMaxswap = typeof status.maxswap === "number" ? status.maxswap : 0;
    const statusSwap = typeof status.swap === "number" ? status.swap : 0;
    const statusMaxdisk = typeof status.maxdisk === "number" ? status.maxdisk : 0;
    const statusDisk = typeof status.disk === "number" ? status.disk : 0;
    const statusUptime = typeof status.uptime === "number" ? status.uptime : 0;

    const configOstype = typeof config.ostype === "string" ? config.ostype : undefined;
    const configHostname = typeof config.hostname === "string" ? config.hostname : undefined;
    const configCores = typeof config.cores === "number" ? config.cores : 1;
    const configUnprivileged = config.unprivileged;
    const configProtection = config.protection;
    const configTags = typeof config.tags === "string" ? config.tags : undefined;
    const configDescription = typeof config.description === "string" ? config.description : undefined;

    return {
      vmId,
      name: statusName ?? `CT ${vmId}`,
      node: nodeName,
      status: statusStatus,
      isRunning: statusStatus === "running",
      osType: configOstype,
      hostname: configHostname,
      cpuCores: configCores,
      cpuUtilization: statusCpu,
      memoryTotal: statusMaxmem,
      memoryUsed: statusMem,
      swapTotal: statusMaxswap,
      swapUsed: statusSwap,
      diskTotal: statusMaxdisk,
      diskUsed: statusDisk,
      uptime: statusUptime,
      networkInterfaces,
      disks,
      privileged: configUnprivileged !== true && configUnprivileged !== 1,
      protected: configProtection === true || configProtection === 1,
      tags: configTags,
      description: configDescription,
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
    const [statusRaw, configRaw] = await Promise.all([
      proxmox.nodes.$(nodeName).qemu.$(vmId).status.current.$get(),
      proxmox.nodes.$(nodeName).qemu.$(vmId).config.$get(),
    ]);

    const status = statusRaw as Record<string, unknown>;
    const config = configRaw as Record<string, unknown>;

    logger.info("Retrieved QEMU details", { nodeName, vmId });

    const networkInterfaces = this.parseNetworkInterfaces(config, "qemu");
    const disks = this.parseDisksConfig(config, "qemu");

    // Try to get guest OS info from agent if available
    let guestOsInfo: QemuDetails["guestOsInfo"];
    const agentEnabled =
      status.agent === true ||
      status.agent === 1 ||
      config.agent === true ||
      config.agent === 1 ||
      config.agent === "1";
    if (agentEnabled && status.status === "running") {
      try {
        const osInfoRaw = (await proxmox.nodes.$(nodeName).qemu.$(vmId).agent["get-osinfo"].$get()) as Record<
          string,
          unknown
        >;
        const osInfoResult =
          typeof osInfoRaw.result === "object" && osInfoRaw.result !== null
            ? (osInfoRaw.result as Record<string, unknown>)
            : undefined;
        if (osInfoResult) {
          guestOsInfo = {
            name: typeof osInfoResult.name === "string" ? osInfoResult.name : undefined,
            version: typeof osInfoResult.version === "string" ? osInfoResult.version : undefined,
            kernel: typeof osInfoResult["kernel-version"] === "string" ? osInfoResult["kernel-version"] : undefined,
            architecture: typeof osInfoResult.machine === "string" ? osInfoResult.machine : undefined,
          };
        }
      } catch (error) {
        logger.debug("Failed to get guest OS info from agent", { nodeName, vmId, error });
      }
    }

    // Try to get snapshot count
    let snapshotCount = 0;
    try {
      const snapshotsRaw = await proxmox.nodes.$(nodeName).qemu.$(vmId).snapshot.$get();
      const snapshots = Array.isArray(snapshotsRaw) ? snapshotsRaw : [];
      snapshotCount = snapshots.length > 0 ? snapshots.length - 1 : 0; // Exclude current state
    } catch (error) {
      logger.debug("Failed to get snapshot count", { nodeName, vmId, error });
    }

    const statusName = typeof status.name === "string" ? status.name : undefined;
    const statusStatus = typeof status.status === "string" ? status.status : "unknown";
    const statusCpu = typeof status.cpu === "number" ? status.cpu : 0;
    const statusMaxmem = typeof status.maxmem === "number" ? status.maxmem : 0;
    const statusMem = typeof status.mem === "number" ? status.mem : 0;
    const statusMaxdisk = typeof status.maxdisk === "number" ? status.maxdisk : 0;
    const statusDisk = typeof status.disk === "number" ? status.disk : 0;
    const statusUptime = typeof status.uptime === "number" ? status.uptime : 0;

    const configSockets = typeof config.sockets === "number" ? config.sockets : 1;
    const configCores = typeof config.cores === "number" ? config.cores : 1;
    const configCpu = typeof config.cpu === "string" ? config.cpu : undefined;
    const configProtection = config.protection;
    const configTags = typeof config.tags === "string" ? config.tags : undefined;
    const configDescription = typeof config.description === "string" ? config.description : undefined;
    const configBoot = typeof config.boot === "string" ? config.boot : undefined;
    const configVga = typeof config.vga === "string" ? config.vga : undefined;
    const configBios = typeof config.bios === "string" ? config.bios : undefined;
    const configMachine = typeof config.machine === "string" ? config.machine : undefined;

    return {
      vmId,
      name: statusName ?? `VM ${vmId}`,
      node: nodeName,
      status: statusStatus,
      isRunning: statusStatus === "running",
      cpuSockets: configSockets,
      cpuCores: configCores,
      cpuType: configCpu,
      cpuUtilization: statusCpu,
      memoryTotal: statusMaxmem,
      memoryUsed: statusMem,
      diskTotal: statusMaxdisk,
      diskUsed: statusDisk,
      uptime: statusUptime,
      networkInterfaces,
      disks,
      agentEnabled,
      guestOsInfo,
      snapshotCount,
      bootOrder: configBoot,
      vgaType: configVga,
      biosType: configBios,
      machineType: configMachine,
      protected: configProtection === true || configProtection === 1,
      tags: configTags,
      description: configDescription,
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
    const [statusRaw, storagesRaw] = (await Promise.all([
      proxmox.nodes.$(nodeName).storage.$(storageName).status.$get(),
      proxmox.storage.$get(),
    ])) as [Record<string, unknown>, unknown];

    const status = statusRaw;
    const storages = Array.isArray(storagesRaw) ? storagesRaw : [];

    logger.info("Retrieved storage details", { nodeName, storageName });

    // Find the storage configuration from the storage list
    const storageConfig = storages.find(
      (storageItem) => (storageItem as Record<string, unknown>).storage === storageName,
    ) as Record<string, unknown> | undefined;

    const statusActive = typeof status.active === "number" ? status.active : 0;
    const statusType = typeof status.type === "string" ? status.type : "unknown";
    const statusTotal = typeof status.total === "number" ? status.total : 0;
    const statusUsed = typeof status.used === "number" ? status.used : 0;
    const statusAvail = typeof status.avail === "number" ? status.avail : 0;
    const statusEnabled = typeof status.enabled === "number" ? status.enabled : 1;
    const statusContent = typeof status.content === "string" ? status.content : "";

    const storageConfigShared = storageConfig && typeof storageConfig.shared === "number" ? storageConfig.shared : 0;
    const storageConfigPath = storageConfig && typeof storageConfig.path === "string" ? storageConfig.path : undefined;

    return {
      id: `${nodeName}:storage/${storageName}`,
      name: storageName,
      node: nodeName,
      status: statusActive ? "available" : "unavailable",
      isAvailable: statusActive === 1,
      type: statusType,
      total: statusTotal,
      used: statusUsed,
      available: statusAvail,
      isShared: storageConfigShared === 1,
      path: storageConfigPath,
      contentTypes: statusContent.split(",").filter(Boolean),
      enabled: statusEnabled !== 0,
      config: storageConfig
        ? {
            server: typeof storageConfig.server === "string" ? storageConfig.server : undefined,
            export: typeof storageConfig.export === "string" ? storageConfig.export : undefined,
            share: typeof storageConfig.share === "string" ? storageConfig.share : undefined,
            vgname: typeof storageConfig.vgname === "string" ? storageConfig.vgname : undefined,
            pool: typeof storageConfig.pool === "string" ? storageConfig.pool : undefined,
            thinpool: typeof storageConfig.thinpool === "string" ? storageConfig.thinpool : undefined,
          }
        : undefined,
    };
  }

  /**
   * Parse network interface configuration from VM/LXC config
   * Supports both QEMU (netN) and LXC (netN) network configs
   */
  private parseNetworkInterfaces(config: Record<string, unknown>, type: "qemu" | "lxc"): NetworkInterface[] {
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
        const [key, value] = part.split("=");
        if (key && value) {
          configMap[key.trim()] = value.trim();
        }
      }

      const netInterface: NetworkInterface = {
        name: key,
        bridge: configMap.bridge ?? "",
        macAddress: type === "qemu" ? (parts[0] ? parts[0].split("=")[1] : undefined) : configMap.hwaddr,
        enabled: true,
        model: type === "qemu" ? (parts[0] ? parts[0].split("=")[0] : undefined) : undefined,
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
        const match = /^([^:]+):([^,]+),?.*size=(\d+)([MGT])?/.exec(rootfs);
        if (match) {
          const [, storage, , sizeStr, unit] = match;
          const multiplier =
            unit === "G"
              ? 1024 * 1024 * 1024
              : unit === "M"
                ? 1024 * 1024
                : unit === "T"
                  ? 1024 * 1024 * 1024 * 1024
                  : 1;
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
          const match = /^([^:]+):([^,]+),?.*mp=([^,]+).*size=(\d+)([MGT])?/.exec(mpConfig);
          if (match) {
            const [, storage, , mountPoint, sizeStr, unit] = match;
            const multiplier =
              unit === "G"
                ? 1024 * 1024 * 1024
                : unit === "M"
                  ? 1024 * 1024
                  : unit === "T"
                    ? 1024 * 1024 * 1024 * 1024
                    : 1;
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
            const match = /^([^:]+):([^,]+),?.*size=(\d+)([MGT])?/.exec(diskConfig);
            if (match) {
              const [, storage, , sizeStr, unit] = match;
              const multiplier =
                unit === "G"
                  ? 1024 * 1024 * 1024
                  : unit === "M"
                    ? 1024 * 1024
                    : unit === "T"
                      ? 1024 * 1024 * 1024 * 1024
                      : 1;
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
