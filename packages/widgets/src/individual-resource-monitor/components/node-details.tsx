import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconBrain, IconClock, IconCpu, IconDatabase, IconServer } from "@tabler/icons-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

import { humanFileSize } from "@homarr/common";
import type { NodeDetails } from "@homarr/integrations/types";

import { ResourceStatsCard } from "./resource-stats-card";

dayjs.extend(duration);

interface NodeDetailsProps {
  data: NodeDetails;
  visibleSections: readonly string[];
}

export const NodeDetailsComponent = ({ data, visibleSections }: NodeDetailsProps) => {
  const cpuPercent = Math.round(data.cpuUtilization * 100);
  const memoryPercent = data.memoryTotal > 0 ? Math.round((data.memoryUsed / data.memoryTotal) * 100) : 0;
  const swapPercent = data.swapTotal > 0 ? Math.round((data.swapUsed / data.swapTotal) * 100) : 0;
  const rootFsPercent = data.rootFsTotal > 0 ? Math.round((data.rootFsUsed / data.rootFsTotal) * 100) : 0;

  const uptimeFormatted = dayjs.duration(data.uptime, "seconds").format("D[d] H[h] m[m]");

  return (
    <Stack gap="sm" p={10}>
      <Group justify="space-between">
        <Group gap="xs">
          <IconServer size={18} />
          <Title order={4}>{data.name}</Title>
        </Group>
        <Badge color={data.isOnline ? "green" : "red"}>{data.status}</Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {visibleSections.includes("cpu") && (
          <ResourceStatsCard
            title="CPU"
            icon={IconCpu}
            value={`${cpuPercent}%`}
            subtitle={data.cpuModel}
            progress={{
              value: cpuPercent,
              color: cpuPercent > 80 ? "red" : cpuPercent > 60 ? "yellow" : "green",
              label: `${data.cpuCores} cores`,
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
            title="Root Filesystem"
            icon={IconDatabase}
            value={`${rootFsPercent}%`}
            subtitle={`${humanFileSize(data.rootFsUsed)} / ${humanFileSize(data.rootFsTotal)}`}
            progress={{
              value: rootFsPercent,
              color: rootFsPercent > 80 ? "red" : rootFsPercent > 60 ? "yellow" : "green",
            }}
            color="grape"
          />
        )}

        {visibleSections.includes("uptime") && (
          <ResourceStatsCard title="Uptime" icon={IconClock} value={uptimeFormatted} color="violet" />
        )}

        {visibleSections.includes("load") && (
          <ResourceStatsCard title="Load Average" icon={IconBrain} value="" color="violet">
            <Card padding="xs" radius="sm" withBorder bg="gray.0">
              <Group gap="md">
                <Text size="xs">1m: {data.loadAverage1.toFixed(2)}</Text>
                <Text size="xs">5m: {data.loadAverage5.toFixed(2)}</Text>
                <Text size="xs">15m: {data.loadAverage15.toFixed(2)}</Text>
              </Group>
            </Card>
          </ResourceStatsCard>
        )}
      </SimpleGrid>

      {visibleSections.includes("system") && (
        <Card padding="sm" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              System Information
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Version
                </Text>
                <Text size="xs">{data.version}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Kernel
                </Text>
                <Text size="xs">{data.kernelVersion}</Text>
              </Group>
              {data.swapTotal > 0 && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Swap
                  </Text>
                  <Text size="xs">
                    {humanFileSize(data.swapUsed)} / {humanFileSize(data.swapTotal)} ({swapPercent}%)
                  </Text>
                </Group>
              )}
            </SimpleGrid>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
