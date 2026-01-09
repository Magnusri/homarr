"use client";

import { Center, Loader, ScrollArea, Stack, Text } from "@mantine/core";

import { clientApi } from "@homarr/api/client";
import { useI18n } from "@homarr/translation/client";

import type { WidgetComponentProps } from "../definition";
import { LxcDetailsComponent } from "./components/lxc-details";
import { NodeDetailsComponent } from "./components/node-details";
import { QemuDetailsComponent } from "./components/qemu-details";
import { StorageDetailsComponent } from "./components/storage-details";

export default function IndividualResourceMonitorWidget(props: WidgetComponentProps<"individualResourceMonitor">) {
  const t = useI18n();
  const { options, integrationIds } = props;

  const integrationId = integrationIds[0];

  if (!integrationId) {
    return (
      <Center h="100%">
        <Text c="dimmed">{t("widget.individualResourceMonitor.error.noIntegration")}</Text>
      </Center>
    );
  }

  if (!options.nodeName) {
    return (
      <Center h="100%">
        <Text c="dimmed">{t("widget.individualResourceMonitor.error.noNodeName")}</Text>
      </Center>
    );
  }

  // Render based on resource type
  if (options.resourceType === "node") {
    return <NodeMonitor integrationId={integrationId} nodeName={options.nodeName} visibleSections={options.visibleSections} />;
  }

  if (!options.resourceIdentifier) {
    return (
      <Center h="100%">
        <Text c="dimmed">{t("widget.individualResourceMonitor.error.noResourceIdentifier")}</Text>
      </Center>
    );
  }

  if (options.resourceType === "lxc") {
    const vmId = parseInt(options.resourceIdentifier, 10);
    if (isNaN(vmId)) {
      return (
        <Center h="100%">
          <Text c="dimmed">{t("widget.individualResourceMonitor.error.invalidVmId")}</Text>
        </Center>
      );
    }
    return <LxcMonitor integrationId={integrationId} nodeName={options.nodeName} vmId={vmId} visibleSections={options.visibleSections} />;
  }

  if (options.resourceType === "qemu") {
    const vmId = parseInt(options.resourceIdentifier, 10);
    if (isNaN(vmId)) {
      return (
        <Center h="100%">
          <Text c="dimmed">{t("widget.individualResourceMonitor.error.invalidVmId")}</Text>
        </Center>
      );
    }
    return <QemuMonitor integrationId={integrationId} nodeName={options.nodeName} vmId={vmId} visibleSections={options.visibleSections} />;
  }

  if (options.resourceType === "storage") {
    return (
      <StorageMonitor
        integrationId={integrationId}
        nodeName={options.nodeName}
        storageName={options.resourceIdentifier}
        visibleSections={options.visibleSections}
      />
    );
  }

  return (
    <Center h="100%">
      <Text c="dimmed">{t("widget.individualResourceMonitor.error.unknownResourceType")}</Text>
    </Center>
  );
}

// Individual resource monitor components
interface NodeMonitorProps {
  integrationId: string;
  nodeName: string;
  visibleSections: readonly string[];
}

function NodeMonitor({ integrationId, nodeName, visibleSections }: NodeMonitorProps) {
  const t = useI18n();
  const { data, isLoading, error } = clientApi.widget.individualResource.getNodeDetails.useQuery({
    integrationId,
    nodeName,
  });

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Center h="100%">
        <Stack gap="xs" align="center">
          <Text c="red">{t("widget.individualResourceMonitor.error.failedToLoad")}</Text>
          {error && <Text size="xs" c="dimmed">{error.message}</Text>}
        </Stack>
      </Center>
    );
  }

  return (
    <ScrollArea h="100%">
      <NodeDetailsComponent data={data} visibleSections={visibleSections} />
    </ScrollArea>
  );
}

interface LxcMonitorProps {
  integrationId: string;
  nodeName: string;
  vmId: number;
  visibleSections: readonly string[];
}

function LxcMonitor({ integrationId, nodeName, vmId, visibleSections }: LxcMonitorProps) {
  const t = useI18n();
  const { data, isLoading, error } = clientApi.widget.individualResource.getLxcDetails.useQuery({
    integrationId,
    nodeName,
    vmId,
  });

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Center h="100%">
        <Stack gap="xs" align="center">
          <Text c="red">{t("widget.individualResourceMonitor.error.failedToLoad")}</Text>
          {error && <Text size="xs" c="dimmed">{error.message}</Text>}
        </Stack>
      </Center>
    );
  }

  return (
    <ScrollArea h="100%">
      <LxcDetailsComponent data={data} visibleSections={visibleSections} />
    </ScrollArea>
  );
}

interface QemuMonitorProps {
  integrationId: string;
  nodeName: string;
  vmId: number;
  visibleSections: readonly string[];
}

function QemuMonitor({ integrationId, nodeName, vmId, visibleSections }: QemuMonitorProps) {
  const t = useI18n();
  const { data, isLoading, error } = clientApi.widget.individualResource.getQemuDetails.useQuery({
    integrationId,
    nodeName,
    vmId,
  });

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Center h="100%">
        <Stack gap="xs" align="center">
          <Text c="red">{t("widget.individualResourceMonitor.error.failedToLoad")}</Text>
          {error && <Text size="xs" c="dimmed">{error.message}</Text>}
        </Stack>
      </Center>
    );
  }

  return (
    <ScrollArea h="100%">
      <QemuDetailsComponent data={data} visibleSections={visibleSections} />
    </ScrollArea>
  );
}

interface StorageMonitorProps {
  integrationId: string;
  nodeName: string;
  storageName: string;
  visibleSections: readonly string[];
}

function StorageMonitor({ integrationId, nodeName, storageName, visibleSections }: StorageMonitorProps) {
  const t = useI18n();
  const { data, isLoading, error } = clientApi.widget.individualResource.getStorageDetails.useQuery({
    integrationId,
    nodeName,
    storageName,
  });

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  if (error || !data) {
    return (
      <Center h="100%">
        <Stack gap="xs" align="center">
          <Text c="red">{t("widget.individualResourceMonitor.error.failedToLoad")}</Text>
          {error && <Text size="xs" c="dimmed">{error.message}</Text>}
        </Stack>
      </Center>
    );
  }

  return (
    <ScrollArea h="100%">
      <StorageDetailsComponent data={data} visibleSections={visibleSections} />
    </ScrollArea>
  );
}
