import type { ReactNode } from "react";
import { Card, Group, Progress, RingProgress, Stack, Text } from "@mantine/core";
import type { TablerIcon } from "@tabler/icons-react";

interface ResourceStatsCardProps {
  title: string;
  icon: TablerIcon;
  value: string | number;
  subtitle?: string;
  progress?: {
    value: number; // 0-100
    color?: string;
    label?: string;
  };
  ringProgress?: {
    sections: Array<{
      value: number;
      color: string;
      tooltip?: string;
    }>;
    label?: ReactNode;
  };
  color?: string;
  children?: ReactNode;
}

export const ResourceStatsCard = ({
  title,
  icon: Icon,
  value,
  subtitle,
  progress,
  ringProgress,
  color = "blue",
  children,
}: ResourceStatsCardProps) => {
  return (
    <Card padding="sm" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Icon size={20} color={color} />
            <Text size="sm" fw={500}>
              {title}
            </Text>
          </Group>
          <Text size="sm" fw={700}>
            {value}
          </Text>
        </Group>

        {subtitle && (
          <Text size="xs" c="dimmed">
            {subtitle}
          </Text>
        )}

        {progress && (
          <Stack gap={4}>
            <Progress value={progress.value} color={progress.color ?? color} size="sm" radius="md" />
            {progress.label && (
              <Text size="xs" c="dimmed">
                {progress.label}
              </Text>
            )}
          </Stack>
        )}

        {ringProgress && (
          <Group justify="center">
            <RingProgress
              size={120}
              thickness={12}
              sections={ringProgress.sections}
              label={
                <Text size="xs" ta="center" fw={700}>
                  {ringProgress.label}
                </Text>
              }
            />
          </Group>
        )}

        {children}
      </Stack>
    </Card>
  );
};
