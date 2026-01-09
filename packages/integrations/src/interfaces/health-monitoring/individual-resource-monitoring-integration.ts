import type { LxcDetails, NodeDetails, QemuDetails, StorageDetails } from "./individual-resource-monitoring-types";

/**
 * Interface for integrations that support monitoring individual resources
 * with detailed information beyond cluster-wide views.
 * 
 * This interface provides methods to fetch detailed information about specific
 * nodes, LXC containers, QEMU VMs, and storage resources.
 */
export interface IIndividualResourceMonitoringIntegration {
  /**
   * Get detailed information about a specific node
   * 
   * @param nodeName - The name of the node to query
   * @returns Promise resolving to detailed node information
   * @throws {IntegrationError} If the node doesn't exist or cannot be accessed
   * 
   * @example
   * ```typescript
   * const nodeDetails = await integration.getNodeDetailsAsync('pve-node-1');
   * console.log(`Node ${nodeDetails.name} - CPU: ${nodeDetails.cpuUtilization * 100}%`);
   * ```
   */
  getNodeDetailsAsync(nodeName: string): Promise<NodeDetails>;

  /**
   * Get detailed information about a specific LXC container
   * 
   * @param nodeName - The name of the node where the container is running
   * @param vmId - The VM ID of the LXC container
   * @returns Promise resolving to detailed LXC container information
   * @throws {IntegrationError} If the container doesn't exist or cannot be accessed
   * 
   * @example
   * ```typescript
   * const lxcDetails = await integration.getLxcDetailsAsync('pve-node-1', 100);
   * console.log(`Container ${lxcDetails.name} - Status: ${lxcDetails.status}`);
   * ```
   */
  getLxcDetailsAsync(nodeName: string, vmId: number): Promise<LxcDetails>;

  /**
   * Get detailed information about a specific QEMU virtual machine
   * 
   * @param nodeName - The name of the node where the VM is running
   * @param vmId - The VM ID of the QEMU virtual machine
   * @returns Promise resolving to detailed QEMU VM information
   * @throws {IntegrationError} If the VM doesn't exist or cannot be accessed
   * 
   * @example
   * ```typescript
   * const qemuDetails = await integration.getQemuDetailsAsync('pve-node-1', 101);
   * console.log(`VM ${qemuDetails.name} - Agent: ${qemuDetails.agentEnabled ? 'enabled' : 'disabled'}`);
   * ```
   */
  getQemuDetailsAsync(nodeName: string, vmId: number): Promise<QemuDetails>;

  /**
   * Get detailed information about a specific storage resource
   * 
   * @param nodeName - The name of the node where the storage is available
   * @param storageName - The name of the storage resource
   * @returns Promise resolving to detailed storage information
   * @throws {IntegrationError} If the storage doesn't exist or cannot be accessed
   * 
   * @example
   * ```typescript
   * const storageDetails = await integration.getStorageDetailsAsync('pve-node-1', 'local-lvm');
   * console.log(`Storage ${storageDetails.name} - Type: ${storageDetails.type}`);
   * ```
   */
  getStorageDetailsAsync(nodeName: string, storageName: string): Promise<StorageDetails>;
}
