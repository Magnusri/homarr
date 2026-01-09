import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconDatabase, IconServer } from "@tabler/icons-react";

import { humanFileSize } from "@homarr/common";
import type { StorageDetails } from "@homarr/integrations/types";

import { ResourceStatsCard } from "./resource-stats-card";

interface StorageDetailsProps {
  data: StorageDetails;
  visibleSections: readonly string[];
}

export const StorageDetailsComponent = ({ data, visibleSections }: StorageDetailsProps) => {
  const usagePercent = data.total > 0 ? Math.round((data.used / data.total) * 100) : 0;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="xs">
          <IconDatabase size={24} />
          <Title order={3}>{data.name}</Title>
        </Group>
        <Badge color={data.isAvailable ? "green" : "red"}>{data.status}</Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {visibleSections.includes("storage") && (
          <ResourceStatsCard
            title="Storage Usage"
            icon={IconDatabase}
            value={`${usagePercent}%`}
            subtitle={`${humanFileSize(data.used)} / ${humanFileSize(data.total)}`}
            progress={{
              value: usagePercent,
              color: usagePercent > 80 ? "red" : usagePercent > 60 ? "yellow" : "green",
              label: `${humanFileSize(data.available)} available`,
            }}
            color="grape"
          />
        )}

        {visibleSections.includes("details") && (
          <Card padding="sm" radius="md" withBorder>
            <Stack gap="xs">
              <Group gap="xs">
                <IconServer size={20} />
                <Text size="sm" fw={500}>
                  Storage Type
                </Text>
              </Group>
              <Badge size="lg">{data.type}</Badge>
              {data.isShared && (
                <Badge size="sm" color="blue">
                  Shared Storage
                </Badge>
              )}
            </Stack>
          </Card>
        )}
      </SimpleGrid>

      {visibleSections.includes("details") && (
        <Card padding="sm" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Storage Information
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Node
                </Text>
                <Text size="xs">{data.node}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Enabled
                </Text>
                <Badge size="xs" color={data.enabled ? "green" : "gray"}>
                  {data.enabled ? "Yes" : "No"}
                </Badge>
              </Group>
              {data.path && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Path
                  </Text>
                  <Text size="xs" style={{ wordBreak: "break-all" }}>
                    {data.path}
                  </Text>
                </Group>
              )}
              {data.contentTypes.length > 0 && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Content Types
                  </Text>
                  <Group gap={4}>
                    {data.contentTypes.map((type) => (
                      <Badge key={type} size="xs" variant="light">
                        {type}
                      </Badge>
                    ))}
                  </Group>
                </Group>
              )}
            </SimpleGrid>
          </Stack>
        </Card>
      )}

      {visibleSections.includes("details") && data.config && (
        <Card padding="sm" radius="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Configuration
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              {data.config.server && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Server
                  </Text>
                  <Text size="xs">{data.config.server}</Text>
                </Group>
              )}
              {data.config.export && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Export
                  </Text>
                  <Text size="xs">{data.config.export}</Text>
                </Group>
              )}
              {data.config.share && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Share
                  </Text>
                  <Text size="xs">{data.config.share}</Text>
                </Group>
              )}
              {data.config.vgname && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Volume Group
                  </Text>
                  <Text size="xs">{data.config.vgname}</Text>
                </Group>
              )}
              {data.config.pool && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Pool
                  </Text>
                  <Text size="xs">{data.config.pool}</Text>
                </Group>
              )}
              {data.config.thinpool && (
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Thin Pool
                  </Text>
                  <Text size="xs">{data.config.thinpool}</Text>
                </Group>
              )}
            </SimpleGrid>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
