import type { fetch as undiciFetch } from "undici";
import { Response } from "undici";
import { describe, expect, test } from "vitest";

import { createIntegrationAsync } from "../..";
import type { IIndividualResourceMonitoringIntegration } from "../../interfaces/health-monitoring/individual-resource-monitoring-integration";

describe("Proxmox Individual Resource Monitoring Integration", () => {
  const testIntegration = {
    id: "test-integration",
    name: "Test Proxmox",
    kind: "proxmox" as const,
    url: "https://proxmox.example.com:8006",
    secrets: [
      { kind: "username", value: "testuser" },
      { kind: "realm", value: "pam" },
      { kind: "tokenId", value: "test-token" },
      { kind: "apiKey", value: "test-api-key-secret" },
    ],
  };

  describe("getNodeDetailsAsync", () => {
    test("should fetch and map node details correctly", async () => {
      // Arrange
      const mockedFetch: typeof undiciFetch = async (url) => {
        if (url.toString().includes("/nodes/pve/status")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  pveversion: "pve-manager/8.0.3",
                  kversion: "5.15.0-91-generic",
                  cpu: 0.234,
                  cpuinfo: {
                    model: "Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz",
                    cpus: 4,
                  },
                  memory: {
                    total: 16777216000,
                    used: 8388608000,
                  },
                  swap: {
                    total: 8388608000,
                    used: 1048576000,
                  },
                  rootfs: {
                    total: 107374182400,
                    used: 21474836480,
                  },
                  uptime: 3600,
                  loadavg: [0.5, 0.4, 0.3],
                },
              }),
              {
                status: 200,
                headers: { "content-type": "application/json;charset=UTF-8" },
              },
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 404 }));
      };

      // Act
      const integration = (await createIntegrationAsync(
        testIntegration,
        mockedFetch,
      )) as IIndividualResourceMonitoringIntegration;
      const result = await integration.getNodeDetailsAsync("pve");

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe("pve");
      expect(result.isOnline).toBe(true);
      expect(result.cpuModel).toBe("Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz");
      expect(result.cpuCores).toBe(4);
      expect(result.cpuUtilization).toBeCloseTo(0.234);
      expect(result.memoryTotal).toBe(16777216000);
      expect(result.memoryUsed).toBe(8388608000);
      expect(result.uptime).toBe(3600);
      expect(result.loadAverage1).toBe(0.5);
      expect(result.loadAverage5).toBe(0.4);
      expect(result.loadAverage15).toBe(0.3);
    });
  });

  describe("getLxcDetailsAsync", () => {
    test("should fetch and map LXC container details correctly", async () => {
      // Arrange
      const mockedFetch: typeof undiciFetch = async (url) => {
        if (url.toString().includes("/nodes/pve/lxc/100/status/current")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  name: "test-ct",
                  status: "running",
                  cpu: 0.15,
                  maxmem: 2147483648,
                  mem: 536870912,
                  maxswap: 536870912,
                  swap: 0,
                  maxdisk: 10737418240,
                  disk: 2147483648,
                  uptime: 7200,
                },
              }),
              {
                status: 200,
                headers: { "content-type": "application/json;charset=UTF-8" },
              },
            ),
          );
        }
        if (url.toString().includes("/nodes/pve/lxc/100/config")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  ostype: "ubuntu",
                  hostname: "test-ct",
                  cores: 2,
                  unprivileged: 0,
                  protection: 0,
                  tags: "test;production",
                  net0: "name=eth0,bridge=vmbr0,hwaddr=BC:24:11:2E:F4:00,ip=dhcp",
                },
              }),
              {
                status: 200,
                headers: { "content-type": "application/json;charset=UTF-8" },
              },
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 404 }));
      };

      // Act
      const integration = (await createIntegrationAsync(
        testIntegration,
        mockedFetch,
      )) as IIndividualResourceMonitoringIntegration;
      const result = await integration.getLxcDetailsAsync("pve", 100);

      // Assert
      expect(result).toBeDefined();
      expect(result.vmId).toBe(100);
      expect(result.name).toBe("test-ct");
      expect(result.isRunning).toBe(true);
      expect(result.status).toBe("running");
      expect(result.osType).toBe("ubuntu");
      expect(result.hostname).toBe("test-ct");
      expect(result.cpuCores).toBe(2);
      expect(result.cpuUtilization).toBeCloseTo(0.15);
      expect(result.privileged).toBe(true); // unprivileged: 0 means privileged
      expect(result.protected).toBe(false);
      expect(result.tags).toBe("test;production");
      expect(result.networkInterfaces.length).toBeGreaterThan(0);
    });
  });

  describe("getQemuDetailsAsync", () => {
    test("should fetch and map QEMU VM details correctly", async () => {
      // Arrange
      const mockedFetch: typeof undiciFetch = async (url) => {
        if (url.toString().includes("/nodes/pve/qemu/101/status/current")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  name: "test-vm",
                  status: "running",
                  cpu: 0.25,
                  maxmem: 4294967296,
                  mem: 2147483648,
                  maxdisk: 53687091200,
                  disk: 10737418240,
                  uptime: 14400,
                  agent: 1,
                },
              }),
              {
                status: 200,
                headers: { "content-type": "application/json;charset=UTF-8" },
              },
            ),
          );
        }
        if (url.toString().includes("/nodes/pve/qemu/101/config")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  sockets: 2,
                  cores: 2,
                  cpu: "host",
                  agent: 1,
                  bios: "ovmf",
                  vga: "std",
                  protection: 1,
                  tags: "production",
                  net0: "virtio=BC:24:11:2E:F4:01,bridge=vmbr0",
                },
              }),
              {
                status: 200,
                headers: { "content-type": "application/json;charset=UTF-8" },
              },
            ),
          );
        }
        if (url.toString().includes("/nodes/pve/qemu/101/snapshot")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: [
                  { name: "current" },
                  { name: "snap1" },
                  { name: "snap2" },
                ],
              }),
              {
                status: 200,
                headers: { "content-type": "application/json;charset=UTF-8" },
              },
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 404 }));
      };

      // Act
      const integration = (await createIntegrationAsync(
        testIntegration,
        mockedFetch,
      )) as IIndividualResourceMonitoringIntegration;
      const result = await integration.getQemuDetailsAsync("pve", 101);

      // Assert
      expect(result).toBeDefined();
      expect(result.vmId).toBe(101);
      expect(result.name).toBe("test-vm");
      expect(result.isRunning).toBe(true);
      expect(result.status).toBe("running");
      expect(result.cpuSockets).toBe(2);
      expect(result.cpuCores).toBe(2);
      expect(result.cpuType).toBe("host");
      expect(result.cpuUtilization).toBeCloseTo(0.25);
      expect(result.agentEnabled).toBe(true);
      expect(result.biosType).toBe("ovmf");
      expect(result.vgaType).toBe("std");
      expect(result.protected).toBe(true);
      expect(result.snapshotCount).toBe(2); // Excluding "current"
      expect(result.networkInterfaces.length).toBeGreaterThan(0);
    });
  });

  describe("getStorageDetailsAsync", () => {
    test("should fetch and map storage details correctly", async () => {
      // Arrange
      const mockedFetch: typeof undiciFetch = async (url) => {
        if (url.toString().includes("/nodes/pve/storage/local-lvm/status")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  type: "lvmthin",
                  active: 1,
                  total: 107374182400,
                  used: 53687091200,
                  avail: 53687091200,
                  enabled: 1,
                  content: "images,rootdir",
                },
              }),
              {
                status: 200,
                headers: { "content-type": "application/json;charset=UTF-8" },
              },
            ),
          );
        }
        if (url.toString().includes("/storage")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: [
                  {
                    storage: "local-lvm",
                    type: "lvmthin",
                    shared: 0,
                    vgname: "pve",
                    thinpool: "data",
                  },
                ],
              }),
              {
                status: 200,
                headers: { "content-type": "application/json;charset=UTF-8" },
              },
            ),
          );
        }
        return Promise.resolve(new Response(JSON.stringify({}), { status: 404 }));
      };

      // Act
      const integration = (await createIntegrationAsync(
        testIntegration,
        mockedFetch,
      )) as IIndividualResourceMonitoringIntegration;
      const result = await integration.getStorageDetailsAsync("pve", "local-lvm");

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe("local-lvm");
      expect(result.node).toBe("pve");
      expect(result.isAvailable).toBe(true);
      expect(result.status).toBe("available");
      expect(result.type).toBe("lvmthin");
      expect(result.total).toBe(107374182400);
      expect(result.used).toBe(53687091200);
      expect(result.available).toBe(53687091200);
      expect(result.isShared).toBe(false);
      expect(result.enabled).toBe(true);
      expect(result.contentTypes).toContain("images");
      expect(result.contentTypes).toContain("rootdir");
      expect(result.config?.vgname).toBe("pve");
      expect(result.config?.thinpool).toBe("data");
    });
  });
});
