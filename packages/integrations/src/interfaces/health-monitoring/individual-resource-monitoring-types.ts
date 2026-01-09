/**
 * Network interface configuration for virtual machines and containers
 */
export interface NetworkInterface {
  /** Network interface name (e.g., net0, net1) */
  name: string;
  /** Network bridge (e.g., vmbr0) */
  bridge: string;
  /** MAC address */
  macAddress?: string;
  /** IP address (if available from guest agent) */
  ipAddress?: string;
  /** IPv6 address (if available from guest agent) */
  ipv6Address?: string;
  /** Whether the interface is enabled */
  enabled: boolean;
  /** Network model/driver (e.g., virtio, e1000) */
  model?: string;
}

/**
 * Disk configuration for virtual machines and containers
 */
export interface DiskConfig {
  /** Disk identifier (e.g., scsi0, ide0, mp0) */
  id: string;
  /** Storage pool name */
  storage: string;
  /** Size in bytes */
  size: number;
  /** Mount point (for containers) or device (for VMs) */
  mountPoint?: string;
  /** Disk type (e.g., disk, cdrom) */
  type?: string;
}

/**
 * Extended node information with detailed system metrics
 */
export interface NodeDetails {
  /** Node name */
  name: string;
  /** Node status (online, offline) */
  status: string;
  /** Whether the node is online */
  isOnline: boolean;
  /** CPU model name */
  cpuModel: string;
  /** Number of CPU cores */
  cpuCores: number;
  /** CPU utilization (0-1) */
  cpuUtilization: number;
  /** Total memory in bytes */
  memoryTotal: number;
  /** Used memory in bytes */
  memoryUsed: number;
  /** Total swap in bytes */
  swapTotal: number;
  /** Used swap in bytes */
  swapUsed: number;
  /** Total root filesystem size in bytes */
  rootFsTotal: number;
  /** Used root filesystem size in bytes */
  rootFsUsed: number;
  /** System uptime in seconds */
  uptime: number;
  /** Load average (1 minute) */
  loadAverage1: number;
  /** Load average (5 minutes) */
  loadAverage5: number;
  /** Load average (15 minutes) */
  loadAverage15: number;
  /** Proxmox VE version */
  version: string;
  /** Kernel version */
  kernelVersion: string;
  /** PVE manager version */
  pveVersion: string;
}

/**
 * Extended LXC container information with configuration details
 */
export interface LxcDetails {
  /** VM ID */
  vmId: number;
  /** Container name */
  name: string;
  /** Node where the container is running */
  node: string;
  /** Container status (running, stopped) */
  status: string;
  /** Whether the container is running */
  isRunning: boolean;
  /** OS type (e.g., ubuntu, debian, alpine) */
  osType?: string;
  /** Container hostname */
  hostname?: string;
  /** Number of CPU cores allocated */
  cpuCores: number;
  /** CPU utilization (0-1) */
  cpuUtilization: number;
  /** Total memory in bytes */
  memoryTotal: number;
  /** Used memory in bytes */
  memoryUsed: number;
  /** Total swap in bytes */
  swapTotal: number;
  /** Used swap in bytes */
  swapUsed: number;
  /** Total disk size in bytes */
  diskTotal: number;
  /** Used disk size in bytes */
  diskUsed: number;
  /** Uptime in seconds */
  uptime: number;
  /** Network interfaces */
  networkInterfaces: NetworkInterface[];
  /** Disk/mount point configurations */
  disks: DiskConfig[];
  /** Whether the container is privileged */
  privileged: boolean;
  /** Whether the container is protected from deletion */
  protected: boolean;
  /** Tags */
  tags?: string;
  /** Description */
  description?: string;
}

/**
 * Extended QEMU VM information with advanced configuration
 */
export interface QemuDetails {
  /** VM ID */
  vmId: number;
  /** VM name */
  name: string;
  /** Node where the VM is running */
  node: string;
  /** VM status (running, stopped, paused) */
  status: string;
  /** Whether the VM is running */
  isRunning: boolean;
  /** Number of CPU sockets */
  cpuSockets: number;
  /** Number of CPU cores per socket */
  cpuCores: number;
  /** CPU type/model */
  cpuType?: string;
  /** CPU utilization (0-1) */
  cpuUtilization: number;
  /** Total memory in bytes */
  memoryTotal: number;
  /** Used memory in bytes */
  memoryUsed: number;
  /** Total disk size in bytes */
  diskTotal: number;
  /** Used disk size in bytes */
  diskUsed: number;
  /** Uptime in seconds */
  uptime: number;
  /** Network interfaces */
  networkInterfaces: NetworkInterface[];
  /** Disk configurations */
  disks: DiskConfig[];
  /** Whether QEMU guest agent is running */
  agentEnabled: boolean;
  /** Guest OS information (from agent) */
  guestOsInfo?: {
    /** OS name */
    name?: string;
    /** OS version */
    version?: string;
    /** Kernel version */
    kernel?: string;
    /** Machine architecture */
    architecture?: string;
  };
  /** Number of snapshots */
  snapshotCount: number;
  /** Boot order */
  bootOrder?: string;
  /** VGA type */
  vgaType?: string;
  /** BIOS type (seabios, ovmf) */
  biosType?: string;
  /** Machine type */
  machineType?: string;
  /** Whether the VM is protected from deletion */
  protected: boolean;
  /** Tags */
  tags?: string;
  /** Description */
  description?: string;
}

/**
 * Extended storage information with detailed configuration
 */
export interface StorageDetails {
  /** Storage identifier */
  id: string;
  /** Storage name */
  name: string;
  /** Node where the storage is available */
  node: string;
  /** Storage status (available, unavailable) */
  status: string;
  /** Whether the storage is available */
  isAvailable: boolean;
  /** Storage type/plugin (dir, lvm, zfs, nfs, cifs, etc.) */
  type: string;
  /** Total storage size in bytes */
  total: number;
  /** Used storage size in bytes */
  used: number;
  /** Available storage size in bytes */
  available: number;
  /** Whether the storage is shared across nodes */
  isShared: boolean;
  /** Storage path or configuration */
  path?: string;
  /** Content types supported (images, rootdir, vztmpl, backup, iso, snippets) */
  contentTypes: string[];
  /** Whether the storage is enabled */
  enabled: boolean;
  /** Additional storage-specific configuration */
  config?: {
    /** Server address (for network storage) */
    server?: string;
    /** Export path (for NFS) */
    export?: string;
    /** Share name (for CIFS/SMB) */
    share?: string;
    /** Volume group (for LVM) */
    vgname?: string;
    /** Pool name (for ZFS/RBD) */
    pool?: string;
    /** Thin pool (for LVM-thin) */
    thinpool?: string;
  };
}
