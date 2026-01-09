import { IconServer } from "@tabler/icons-react";
import { z } from "zod/v4";

import { createWidgetDefinition } from "../definition";
import { optionsBuilder } from "../options";

export const { definition, componentLoader } = createWidgetDefinition("individualResourceMonitor", {
  icon: IconServer,
  createOptions() {
    return optionsBuilder.from((factory) => ({
      resourceType: factory.select({
        defaultValue: "node",
        options: [
          { value: "node", label: (t) => t("widget.individualResourceMonitor.option.resourceType.option.node") },
          { value: "lxc", label: (t) => t("widget.individualResourceMonitor.option.resourceType.option.lxc") },
          { value: "qemu", label: (t) => t("widget.individualResourceMonitor.option.resourceType.option.qemu") },
          {
            value: "storage",
            label: (t) => t("widget.individualResourceMonitor.option.resourceType.option.storage"),
          },
        ] as const,
      }),
      nodeName: factory.text({
        defaultValue: "",
        withDescription: true,
      }),
      resourceIdentifier: factory.text({
        defaultValue: "",
        withDescription: true,
      }),
      refreshInterval: factory.number({
        defaultValue: 5000,
        withDescription: true,
        validate: z.number().min(1000).max(60000),
      }),
      visibleSections: factory.multiSelect({
        options: [
          { value: "cpu", label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.cpu") },
          {
            value: "memory",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.memory"),
          },
          {
            value: "storage",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.storage"),
          },
          {
            value: "network",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.network"),
          },
          {
            value: "uptime",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.uptime"),
          },
          {
            value: "load",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.load"),
          },
          {
            value: "system",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.system"),
          },
          {
            value: "container",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.container"),
          },
          {
            value: "snapshots",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.snapshots"),
          },
          {
            value: "configuration",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.configuration"),
          },
          {
            value: "type",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.type"),
          },
        ] as const,
        defaultValue: [
          "cpu",
          "memory",
          "storage",
          "network",
          "uptime",
          "load",
          "system",
          "container",
          "snapshots",
          "configuration",
          "type",
        ] as const,
      }),
    }));
  },
  supportedIntegrations: ["proxmox"],
  integrationsRequired: false,
}).withDynamicImport(() => import("./component"));
