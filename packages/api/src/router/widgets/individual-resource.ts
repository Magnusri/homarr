import { observable } from "@trpc/server/observable";
import { z } from "zod/v4";

import { createIntegrationAsync } from "@homarr/integrations";
import type { LxcDetails, NodeDetails, QemuDetails, StorageDetails } from "@homarr/integrations/types";

import { createOneIntegrationMiddleware } from "../../middlewares/integration";
import { createTRPCRouter, publicProcedure } from "../../trpc";

export const individualResourceRouter = createTRPCRouter({
  getNodeDetails: publicProcedure
    .concat(createOneIntegrationMiddleware("input", "proxmox"))
    .input(
      z.object({
        integrationId: z.string(),
        nodeName: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const integration = await createIntegrationAsync(ctx.integration);
      const result = await integration.getNodeDetailsAsync(input.nodeName);
      return result;
    }),

  subscribeNodeDetails: publicProcedure
    .concat(createOneIntegrationMiddleware("input", "proxmox"))
    .input(
      z.object({
        integrationId: z.string(),
        nodeName: z.string(),
      }),
    )
    .subscription(({ ctx, input }) => {
      return observable<NodeDetails>((emit) => {
        const fetchDataAsync = async () => {
          const integration = await createIntegrationAsync(ctx.integration);
          const result = await integration.getNodeDetailsAsync(input.nodeName);
          emit.next(result);
        };

        // Initial fetch
        void fetchDataAsync();

        // Set up polling interval (every 5 seconds)
        const interval = setInterval(() => {
          void fetchDataAsync();
        }, 5000);

        return () => {
          clearInterval(interval);
        };
      });
    }),

  getLxcDetails: publicProcedure
    .concat(createOneIntegrationMiddleware("input", "proxmox"))
    .input(
      z.object({
        integrationId: z.string(),
        nodeName: z.string(),
        vmId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const integration = await createIntegrationAsync(ctx.integration);
      const result = await integration.getLxcDetailsAsync(input.nodeName, input.vmId);
      return result;
    }),

  subscribeLxcDetails: publicProcedure
    .concat(createOneIntegrationMiddleware("input", "proxmox"))
    .input(
      z.object({
        integrationId: z.string(),
        nodeName: z.string(),
        vmId: z.number(),
      }),
    )
    .subscription(({ ctx, input }) => {
      return observable<LxcDetails>((emit) => {
        const fetchDataAsync = async () => {
          const integration = await createIntegrationAsync(ctx.integration);
          const result = await integration.getLxcDetailsAsync(input.nodeName, input.vmId);
          emit.next(result);
        };

        // Initial fetch
        void fetchDataAsync();

        // Set up polling interval (every 5 seconds)
        const interval = setInterval(() => {
          void fetchDataAsync();
        }, 5000);

        return () => {
          clearInterval(interval);
        };
      });
    }),

  getQemuDetails: publicProcedure
    .concat(createOneIntegrationMiddleware("input", "proxmox"))
    .input(
      z.object({
        integrationId: z.string(),
        nodeName: z.string(),
        vmId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const integration = await createIntegrationAsync(ctx.integration);
      const result = await integration.getQemuDetailsAsync(input.nodeName, input.vmId);
      return result;
    }),

  subscribeQemuDetails: publicProcedure
    .concat(createOneIntegrationMiddleware("input", "proxmox"))
    .input(
      z.object({
        integrationId: z.string(),
        nodeName: z.string(),
        vmId: z.number(),
      }),
    )
    .subscription(({ ctx, input }) => {
      return observable<QemuDetails>((emit) => {
        const fetchDataAsync = async () => {
          const integration = await createIntegrationAsync(ctx.integration);
          const result = await integration.getQemuDetailsAsync(input.nodeName, input.vmId);
          emit.next(result);
        };

        // Initial fetch
        void fetchDataAsync();

        // Set up polling interval (every 5 seconds)
        const interval = setInterval(() => {
          void fetchDataAsync();
        }, 5000);

        return () => {
          clearInterval(interval);
        };
      });
    }),

  getStorageDetails: publicProcedure
    .concat(createOneIntegrationMiddleware("input", "proxmox"))
    .input(
      z.object({
        integrationId: z.string(),
        nodeName: z.string(),
        storageName: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const integration = await createIntegrationAsync(ctx.integration);
      const result = await integration.getStorageDetailsAsync(input.nodeName, input.storageName);
      return result;
    }),

  subscribeStorageDetails: publicProcedure
    .concat(createOneIntegrationMiddleware("input", "proxmox"))
    .input(
      z.object({
        integrationId: z.string(),
        nodeName: z.string(),
        storageName: z.string(),
      }),
    )
    .subscription(({ ctx, input }) => {
      return observable<StorageDetails>((emit) => {
        const fetchDataAsync = async () => {
          const integration = await createIntegrationAsync(ctx.integration);
          const result = await integration.getStorageDetailsAsync(input.nodeName, input.storageName);
          emit.next(result);
        };

        // Initial fetch
        void fetchDataAsync();

        // Set up polling interval (every 5 seconds)
        const interval = setInterval(() => {
          void fetchDataAsync();
        }, 5000);

        return () => {
          clearInterval(interval);
        };
      });
    }),
});
