import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconBrain, IconCpu, IconClock, IconContainer, IconDatabase, IconNetwork } from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

import { humanFileSize } from "@homarr/common";
import type { LxcDetails } from "@homarr/integrations/types";

import { ResourceStatsCard } from "./resource-stats-card";

dayjs.extend(duration);

interface LxcDetailsProps {
  data: LxcDetails;
  visibleSections: readonly string[];
}

export const LxcDetailsComponent = ({ data, visibleSections }: LxcDetailsProps) => {
  const cpuPercent = Math.round(data.cpuUtilization * 100);
  const memoryPercent = data.memoryTotal > 0 ? Math.round((data.memoryUsed / data.memoryTotal) * 100) : 0;
  const diskPercent = data.diskTotal > 0 ? Math.round((data.diskUsed / data.diskTotal) * 100) : 0;
  const uptimeFormatted = data.uptime > 0 ? dayjs.duration(data.uptime, "seconds").format("D[d] H[h] m[m]") : "N/A";

  return (
    <Stack gap="sm" p={10}>
      <Group justify="space-between">
        <Group gap="xs">
          <IconContainer size={18} />
          <Title order={4}>
            {data.name} (CT {data.vmId})
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
            subtitle={`${data.cpuCores} cores`}
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

        {visibleSections.includes("details") && (
          <ResourceStatsCard title="Uptime" icon={IconClock} value={uptimeFormatted} color="violet" />
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
                    <Badge size="xs">{iface.bridge}</Badge>
                  </Group>
                  {iface.macAddress && (
                    <Text size="xs" c="dimmed">
                      MAC: {iface.macAddress}
                    </Text>
                  )}
                  {iface.ipAddress && (
                    <Text size="xs" c="dimmed">
                      IP: {iface.ipAddress}
                    </Text>
                  )}
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      {visibleSections.includes("details") && (
        <Card padding="sm" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Container Information
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Node
                </Text>
                <Text size="xs">{data.node}</Text>
              </Group>
              {data.osType && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    OS Type
                  </Text>
                  <Text size="xs">{data.osType}</Text>
                </Group>
              )}
              {data.hostname && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Hostname
                  </Text>
                  <Text size="xs">{data.hostname}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Privileged
                </Text>
                <Badge size="xs" color={data.privileged ? "red" : "green"}>
                  {data.privileged ? "Yes" : "No"}
                </Badge>
              </Group>
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
