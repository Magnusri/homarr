import { IconServer } from "@tabler/icons-react";

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
            value: "details",
            label: (t) => t("widget.individualResourceMonitor.option.visibleSections.option.details"),
          },
        ] as const,
        defaultValue: ["cpu", "memory", "storage", "network", "details"] as const,
      }),
    }));
  },
  supportedIntegrations: ["proxmox"],
  integrationsRequired: true,
}).withDynamicImport(() => import("./component"));
