import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconBrain, IconClock, IconCpu, IconDatabase, IconNetwork, IconServer } from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

import { humanFileSize } from "@homarr/common";
import type { QemuDetails } from "@homarr/integrations/types";

import { ResourceStatsCard } from "./resource-stats-card";

dayjs.extend(duration);

interface QemuDetailsProps {
  data: QemuDetails;
  visibleSections: readonly string[];
}

export const QemuDetailsComponent = ({ data, visibleSections }: QemuDetailsProps) => {
  const cpuPercent = Math.round(data.cpuUtilization * 100);
  const memoryPercent = data.memoryTotal > 0 ? Math.round((data.memoryUsed / data.memoryTotal) * 100) : 0;
  const diskPercent = data.diskTotal > 0 ? Math.round((data.diskUsed / data.diskTotal) * 100) : 0;
  const uptimeFormatted = data.uptime > 0 ? dayjs.duration(data.uptime, "seconds").format("D[d] H[h] m[m]") : "N/A";

  return (
    <Stack gap="sm" p={10}>
      <Group justify="space-between">
        <Group gap="xs">
          <IconServer size={18} />
          <Title order={4}>
            {data.name} (VM {data.vmId})
          </Title>
        </Group>
        <Badge color={data.isRunning ? "green" : "gray"}>{data.status}</Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {visibleSections.includes("cpu") && (
          <ResourceStatsCard
            title="CPU"
            icon={IconCpu}
            value={`${cpuPercent}%`}
            subtitle={`${data.cpuSockets} socket(s), ${data.cpuCores} core(s) each`}
            progress={{
              value: cpuPercent,
              color: cpuPercent > 80 ? "red" : cpuPercent > 60 ? "yellow" : "green",
            }}
            color="blue"
          />
        )}

        {visibleSections.includes("memory") && (
          <ResourceStatsCard
            title="Memory"
            icon={IconBrain}
            value={`${memoryPercent}%`}
            subtitle={`${humanFileSize(data.memoryUsed)} / ${humanFileSize(data.memoryTotal)}`}
            progress={{
              value: memoryPercent,
              color: memoryPercent > 80 ? "red" : memoryPercent > 60 ? "yellow" : "green",
            }}
            color="cyan"
          />
        )}

        {visibleSections.includes("storage") && (
          <ResourceStatsCard
            title="Disk"
            icon={IconDatabase}
            value={`${diskPercent}%`}
            subtitle={`${humanFileSize(data.diskUsed)} / ${humanFileSize(data.diskTotal)}`}
            progress={{
              value: diskPercent,
              color: diskPercent > 80 ? "red" : diskPercent > 60 ? "yellow" : "green",
            }}
            color="grape"
          />
        )}

        {visibleSections.includes("uptime") && (
          <ResourceStatsCard title="Uptime" icon={IconClock} value={uptimeFormatted} color="violet" />
        )}

        {visibleSections.includes("snapshots") && data.snapshotCount > 0 && (
          <ResourceStatsCard title="Snapshots" icon={IconDatabase} value={String(data.snapshotCount)} color="cyan" />
        )}
      </SimpleGrid>

      {visibleSections.includes("network") && data.networkInterfaces.length > 0 && (
        <Card padding="sm" radius="md" withBorder>
          <Stack gap="xs">
            <Group gap="xs">
              <IconNetwork size={20} />
              <Text size="sm" fw={500}>
                Network Interfaces
              </Text>
            </Group>
            <Stack gap="xs">
              {data.networkInterfaces.map((iface) => (
                <Card key={iface.name} padding="xs" radius="sm" withBorder bg="gray.0">
                  <Group justify="space-between">
                    <Text size="xs" fw={500}>
                      {iface.name}
                    </Text>
                    <Group gap="xs">
                      {iface.model && <Badge size="xs">{iface.model}</Badge>}
                      <Badge size="xs">{iface.bridge}</Badge>
                    </Group>
                  </Group>
                  {iface.macAddress && (
                    <Text size="xs" c="dimmed">
                      MAC: {iface.macAddress}
                    </Text>
                  )}
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      {visibleSections.includes("configuration") && (
        <Card padding="sm" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Virtual Machine Information
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Node
                </Text>
                <Text size="xs">{data.node}</Text>
              </Group>
              {data.cpuType && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    CPU Type
                  </Text>
                  <Text size="xs">{data.cpuType}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Agent
                </Text>
                <Badge size="xs" color={data.agentEnabled ? "green" : "gray"}>
                  {data.agentEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </Group>
              {data.guestOsInfo?.name && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Guest OS
                  </Text>
                  <Text size="xs">
                    {data.guestOsInfo.name} {data.guestOsInfo.version}
                  </Text>
                </Group>
              )}
              {data.biosType && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    BIOS
                  </Text>
                  <Text size="xs">{data.biosType}</Text>
                </Group>
              )}
              {data.vgaType && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    VGA
                  </Text>
                  <Text size="xs">{data.vgaType}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Protected
                </Text>
                <Badge size="xs" color={data.protected ? "blue" : "gray"}>
                  {data.protected ? "Yes" : "No"}
                </Badge>
              </Group>
              {data.tags && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Tags
                  </Text>
                  <Text size="xs">{data.tags}</Text>
                </Group>
              )}
            </SimpleGrid>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
